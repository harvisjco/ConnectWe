import { Person, GraphQueryResult, AgeGroup } from '../types/network';
import { calculateSemanticMatches } from './semanticSearch';
import { identifyTalentCluster } from './talentClusterEngine';
import { isPureChoseong, matchChoseong, findClosestMatch } from '../utils/koreanUtils';

// 한국어 & 비즈니스 공통 불용어 (과매칭 방지)
const STOPWORDS = new Set([
  '및', '과', '와', '의', '에', '에서', '으로', '로', '를', '을', '은', '는', '이', '가',
  '출신', '거쳐간', '있는', '추천해줘', '위해', '대한', '관련', '글로벌', 'top-tier', 'toptier', 'top',
  '등의', '등', '등을', '하는', '된', '한', '수', '추천', '만날만한', '과거', '현재'
]);

// 오타 교정용 대표 키워드 후보 풀
const CORE_KEYWORD_CANDIDATES = [
  '네이버', '삼성전자', '카카오', '비바리퍼블리카', '토스', '크래프톤',
  '하이퍼클라우드', '넥스트비전', '퓨처웨이브', '알토스캐피탈', '케이테크홀딩스',
  '오픈소버린', '로지스넥스트', '카이스트', 'KAIST', '서울대', '서울대학교',
  'PyTorch', 'LLM', '클라우드', '사내이사', '심사역', '파트너', 'CTO', 'CEO', 'CFO'
];

/**
 * GraphRAG 자연어 인맥 질의 처리 인터프리터 (Semantic Vector + Graph Topology + 초성/오타 교정 Hybrid)
 */
export function executeGraphRagQuery(query: string, people: Person[]): GraphQueryResult {
  const cleanQ = query.trim().toLowerCase();
  const highlightNodeIds: string[] = [];
  const relatedCompanies = new Set<string>();
  const filterTags: string[] = [];

  if (!cleanQ) {
    return {
      query,
      matchedPeople: people,
      reasoning: '전체 인맥 네트워크가 표출 중입니다.',
      highlightNodeIds: [],
      relatedCompanies: [],
      filterTags: []
    };
  }

  // 1. 질의 토큰 정제 (불용어 제거)
  const rawTokens = cleanQ.split(/\s+/).filter(t => t.length >= 1);
  const meaningfulTokens = rawTokens.filter(t => !STOPWORDS.has(t));
  const choseongMode = isPureChoseong(cleanQ);

  // 2. 질의 의도 파악 (Intent Analysis)
  const isNaverAlumni = cleanQ.includes('네이버') || cleanQ.includes('naver');
  const isSamsungAlumni = cleanQ.includes('삼성') || cleanQ.includes('samsung');
  const isTossKakao = cleanQ.includes('토스') || cleanQ.includes('카카오') || cleanQ.includes('toss') || cleanQ.includes('kakao') || cleanQ.includes('비바리퍼블리카');
  const isAiDomain = cleanQ.includes('ai') || cleanQ.includes('인공지능') || cleanQ.includes('llm') || cleanQ.includes('머신러닝') || cleanQ.includes('연구');
  const isInfraCloud = cleanQ.includes('클라우드') || cleanQ.includes('인프라') || cleanQ.includes('cto') || cleanQ.includes('devops');
  const isVcFinance = cleanQ.includes('vc') || cleanQ.includes('투자') || cleanQ.includes('심사') || cleanQ.includes('m&a') || cleanQ.includes('pe');
  const isDartFact = cleanQ.includes('공시') || cleanQ.includes('dart') || cleanQ.includes('상장') || cleanQ.includes('사내이사') || cleanQ.includes('등기');
  const isStaleIntent = cleanQ.includes('뜸한') || cleanQ.includes('단절') || cleanQ.includes('연락') || cleanQ.includes('오랜만');
  const isKaist = cleanQ.includes('카이스트') || cleanQ.includes('kaist');
  const isSeoulUniv = cleanQ.includes('서울대') || cleanQ.includes('snu') || cleanQ.includes('서울대학교');

  // 5대 인재 클러스터 특화 의도
  const isVentureLeader = cleanQ.includes('벤처') || cleanQ.includes('스타트업') || cleanQ.includes('창업자') || cleanQ.includes('founder') || cleanQ.includes('ceo');
  const isTechFellow = cleanQ.includes('딥테크') || cleanQ.includes('펠로우') || cleanQ.includes('fellow') || cleanQ.includes('연구원') || cleanQ.includes('scientist');
  const isInvestorPartner = isVcFinance || cleanQ.includes('엔젤') || cleanQ.includes('심사역');
  const isListedExecutive = cleanQ.includes('상장사') || isDartFact;
  const isCoreSpecialist = cleanQ.includes('스페셜리스트') || cleanQ.includes('프로덕트') || cleanQ.includes('po') || cleanQ.includes('pm') || cleanQ.includes('테크 리드');

  // 나이대 및 전문 경력 단계 의도 탐지
  let targetAgeGroup: AgeGroup | null = null;
  if (cleanQ.includes('20대') || cleanQ.includes('주니어') || cleanQ.includes('프론티어')) {
    targetAgeGroup = '20s';
    filterTags.push('경력 단계: 도약기 리더');
  } else if (cleanQ.includes('30대') || cleanQ.includes('실무') || cleanQ.includes('팀장')) {
    targetAgeGroup = '30s';
    filterTags.push('경력 단계: 전략 총괄');
  } else if (cleanQ.includes('40대') || cleanQ.includes('임원') || cleanQ.includes('본부장')) {
    targetAgeGroup = '40s';
    filterTags.push('경력 단계: Executive 15년+');
  } else if (cleanQ.includes('50대') || cleanQ.includes('c-level') || cleanQ.includes('고문')) {
    targetAgeGroup = '50s_plus';
    filterTags.push('경력 단계: 원로 고문');
  }

  // 5대 클러스터 태그 추가
  if (isVentureLeader) filterTags.push('클러스터: 어자일 벤처 리더');
  if (isTechFellow) filterTags.push('클러스터: 딥테크 펠로우');
  if (isInvestorPartner) filterTags.push('클러스터: 투자 파트너');
  if (isListedExecutive) filterTags.push('클러스터: 상장사 임원');
  if (isCoreSpecialist) filterTags.push('클러스터: 프로덕트 스페셜리스트');

  // 기업 및 학맥 태그 추가
  if (isNaverAlumni) filterTags.push('기업: 네이버(현직/전직)');
  if (isSamsungAlumni) filterTags.push('기업: 삼성(현직/전직)');
  if (isTossKakao) filterTags.push('기업: 토스/카카오');
  if (isAiDomain) filterTags.push('도메인: AI/LLM');
  if (isInfraCloud) filterTags.push('도메인: 클라우드/인프라');
  if (isDartFact) filterTags.push('검증: DART 실공시 팩트');
  if (isStaleIntent) filterTags.push('상태: 안부 환기 권장');
  if (isKaist) filterTags.push('학맥: KAIST');
  if (isSeoulUniv) filterTags.push('학맥: 서울대학교');

  // 의미론적 벡터 유사도 매칭 수행 (threshold 상향 조정)
  const semanticMatches = calculateSemanticMatches(cleanQ, people, 0.20);
  const semanticScores = new Map<string, number>();
  semanticMatches.forEach(m => semanticScores.set(m.person.id, m.score));

  // 3. 인맥 스코어링 및 필터링
  const scoredPeople: { person: Person; score: number }[] = [];

  for (const p of people) {
    let score = 0;
    const cluster = identifyTalentCluster(p);

    // [초성 검색 모드]
    if (choseongMode) {
      if (matchChoseong(p.name, cleanQ)) score += 30;
      if (matchChoseong(p.currentCompany, cleanQ)) score += 20;
      if (matchChoseong(p.currentTitle, cleanQ)) score += 15;
      if (score > 0) {
        scoredPeople.push({ person: p, score });
        continue;
      }
    }

    // [하드 필터 조건]
    if (targetAgeGroup && p.estimatedAgeGroup !== targetAgeGroup) {
      continue;
    }
    if (isDartFact && !(p.sourceType === 'DART_FACT' || p.dartInfo?.isPublicDirector)) {
      continue;
    }
    if (isStaleIntent && !p.isStale) {
      continue;
    }

    // [소프트 가중치 매칭]
    // 5대 인재 클러스터 일치 가중치
    if (isVentureLeader && cluster.id === 'VENTURE_LEADER') score += 12;
    if (isTechFellow && cluster.id === 'TECH_FELLOW') score += 12;
    if (isInvestorPartner && cluster.id === 'INVESTOR_PARTNER') score += 12;
    if (isListedExecutive && cluster.id === 'LISTED_EXECUTIVE') score += 12;
    if (isCoreSpecialist && cluster.id === 'CORE_SPECIALIST') score += 12;

    // 알럼나이 및 현직 회사 조건 (정밀 판별)
    if (isNaverAlumni) {
      const hasNow = p.currentCompany.toLowerCase().includes('네이버') || p.currentCompany.toLowerCase().includes('naver');
      const hasPast = p.careers.some(c => c.companyName.toLowerCase().includes('네이버') || c.companyName.toLowerCase().includes('naver'));
      if (hasNow || hasPast) score += 10;
    }

    if (isSamsungAlumni) {
      const hasNow = p.currentCompany.toLowerCase().includes('삼성') || p.currentCompany.toLowerCase().includes('samsung');
      const hasPast = p.careers.some(c => c.companyName.toLowerCase().includes('삼성') || c.companyName.toLowerCase().includes('samsung'));
      if (hasNow || hasPast) score += 10;
    }

    if (isTossKakao) {
      const hasNow = p.currentCompany.toLowerCase().includes('토스') || p.currentCompany.toLowerCase().includes('카카오') || p.currentCompany.toLowerCase().includes('비바리퍼블리카');
      const hasPast = p.careers.some(c => c.companyName.toLowerCase().includes('토스') || c.companyName.toLowerCase().includes('카카오') || c.companyName.toLowerCase().includes('비바리퍼블리카'));
      if (hasNow || hasPast) score += 10;
    }

    // 도메인 조건
    if (isAiDomain && (p.primaryDomain.includes('AI') || p.skills.some(s => s.toLowerCase().includes('ai')))) {
      score += 6;
    }
    if (isInfraCloud && (p.primaryDomain.includes('인프라') || p.primaryDomain.includes('클라우드') || p.currentTitle.includes('CTO'))) {
      score += 6;
    }
    if (isVcFinance && (p.primaryDomain.includes('투자') || p.primaryDomain.includes('재무') || p.currentTitle.includes('심사역') || p.currentTitle.includes('파트너') || cluster.id === 'INVESTOR_PARTNER')) {
      score += 8;
    }

    // 학맥 조건
    if (isKaist && p.academics.some(a => a.schoolName.toLowerCase().includes('카이스트') || a.schoolName.toLowerCase().includes('kaist'))) {
      score += 8;
    }
    if (isSeoulUniv && p.academics.some(a => a.schoolName.toLowerCase().includes('서울대'))) {
      score += 8;
    }

    // 의미론적 벡터 유사도
    const semanticMatch = semanticScores.get(p.id) || 0;
    if (semanticMatch > 0.20) {
      score += Math.round(semanticMatch * 10);
    }

    // 정제된 유의미 토큰 직접 매칭 (불용어 배제)
    const personCorpus = `${p.name} ${p.currentCompany} ${p.currentDepartment} ${p.currentTitle} ${p.primaryDomain} ${p.memo || ''} ${p.skills.join(' ')} ${p.careers.map(c => c.companyName).join(' ')}`.toLowerCase();
    
    let matchedTokenCount = 0;
    meaningfulTokens.forEach(token => {
      if (personCorpus.includes(token)) {
        matchedTokenCount += 1;
        // 이름 정확 일치 시 최고 가중치
        if (p.name.toLowerCase() === token) score += 25;
        // 현재 회사명 일치 시 가중치
        else if (p.currentCompany.toLowerCase().includes(token)) score += 10;
        // 직함 일치 시 가중치
        else if (p.currentTitle.toLowerCase().includes(token)) score += 6;
      }
    });

    // 1촌 필터 조건 가중치
    const isFirstDegree = cleanQ.includes('1촌') || cleanQ.includes('일촌');
    if (isFirstDegree && p.closeness === 1) {
      score += 20;
    }

    if (matchedTokenCount > 0) {
      score += matchedTokenCount * 3;
    }

    // [A-1] 다중 엔티티 복합 조건 교집합 부스트 (Multi-entity Intersection Boost)
    if (meaningfulTokens.length >= 2) {
      if (matchedTokenCount >= meaningfulTokens.length) {
        // 질의의 모든 핵심 엔티티 조건을 100% 충족하는 인재는 최상단 압도적 승격
        score += 50;
      } else if (matchedTokenCount >= 2) {
        score += matchedTokenCount * 15;
      }
    }

    // 최소 점수 임계치 (단순 스치기 과매칭 방지: 의도 감지되었거나 유의미 토큰 매칭 시 최소 score >= 4)
    if (score >= 4) {
      scoredPeople.push({ person: p, score });
    }
  }

  // 4. 연관도 스코어 기준 내림차순 정렬 (Relevance Sorting)
  scoredPeople.sort((a, b) => b.score - a.score);
  const matched = scoredPeople.map(item => item.person);

  // 하이라이트 노드 및 연관 회사 목록 구성
  matched.forEach(p => {
    highlightNodeIds.push(`p_${p.id}`);
    relatedCompanies.add(p.currentCompany);
    p.careers.filter(c => !c.isCurrent).forEach(c => relatedCompanies.add(c.companyName));
  });

  // 5. 오타 교정 및 Did You Mean 추천 탐색
  let didYouMean: string | undefined = undefined;
  if (matched.length === 0 && !choseongMode) {
    const suggestion = findClosestMatch(cleanQ, CORE_KEYWORD_CANDIDATES, 2);
    if (suggestion) {
      didYouMean = suggestion;
    }
  }

  // 6. 지능형 추론 브리핑 (Reasoning Synthesis)
  let reasoning = '';
  if (matched.length === 0) {
    if (didYouMean) {
      reasoning = `입력하신 조건("[${query}]")과 일치하는 인맥을 찾지 못했습니다. 혹시 **"${didYouMean}"**(으)로 검색하시겠습니까?`;
    } else {
      reasoning = `입력하신 조건("[${query}]")과 일치하는 인맥 노드를 그래프에서 발견하지 못했습니다. 검색 조건을 완화하거나 다른 키워드로 검색해 보세요.`;
    }
  } else {
    const factCount = matched.filter(m => m.sourceType === 'DART_FACT').length;
    const alumniHighlights = matched.filter(m => m.careers.some(c => !c.isCurrent)).length;

    // 5대 클러스터 포트폴리오 집계
    const clusterMap: Record<string, number> = {};
    matched.forEach(p => {
      const c = identifyTalentCluster(p);
      clusterMap[c.label] = (clusterMap[c.label] || 0) + 1;
    });
    const clusterDistribution = Object.entries(clusterMap)
      .map(([label, count]) => `${label} ${count}명`)
      .join(', ');

    reasoning = `GraphRAG 지식 경로 탐색 결과, 총 **${matched.length}명**의 관련 인맥 노드가 연결되었습니다. ` +
      (clusterDistribution ? `인재 클러스터 포트폴리오는 **${clusterDistribution}** 구성입니다. ` : '') +
      (factCount > 0 ? `이 중 **${factCount}명**은 금융감독원 DART 실공시로 검증된 상장사 등기/미등기 임원 팩트입니다. ` : '') +
      (alumniHighlights > 0 ? `과거 주요 빅테크/선도기업을 거쳐간 알럼나이 인력 **${alumniHighlights}명**이 포함되어 있어 2촌 확장 시 높은 레버리지를 기대할 수 있습니다.` : '');
  }

  return {
    query,
    matchedPeople: matched,
    reasoning,
    highlightNodeIds,
    relatedCompanies: Array.from(relatedCompanies),
    filterTags,
    didYouMean
  };
}

