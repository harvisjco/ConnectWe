import { Person, GraphQueryResult, AgeGroup } from '../types/network';
import { calculateSemanticMatches } from './semanticSearch';

/**
 * GraphRAG 자연어 인맥 질의 처리 인터프리터 (Semantic Vector + Graph Topology Hybrid)
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

  // 1. 질의 의도 파악 (Intent Analysis)
  const isNaverAlumni = cleanQ.includes('네이버') || cleanQ.includes('naver');
  const isSamsungAlumni = cleanQ.includes('삼성') || cleanQ.includes('samsung');
  const isTossKakao = cleanQ.includes('토스') || cleanQ.includes('카카오') || cleanQ.includes('toss') || cleanQ.includes('kakao');
  const isAiDomain = cleanQ.includes('ai') || cleanQ.includes('인공지능') || cleanQ.includes('llm') || cleanQ.includes('머신러닝') || cleanQ.includes('연구');
  const isInfraCloud = cleanQ.includes('클라우드') || cleanQ.includes('인프라') || cleanQ.includes('cto') || cleanQ.includes('devops');
  const isVcFinance = cleanQ.includes('vc') || cleanQ.includes('투자') || cleanQ.includes('심사') || cleanQ.includes('파트너') || cleanQ.includes('m&a');
  const isDartFact = cleanQ.includes('공시') || cleanQ.includes('dart') || cleanQ.includes('상장') || cleanQ.includes('사내이사') || cleanQ.includes('등기');
  const isStaleIntent = cleanQ.includes('뜸한') || cleanQ.includes('단절') || cleanQ.includes('연락') || cleanQ.includes('오랜만');
  const isKaist = cleanQ.includes('카이스트') || cleanQ.includes('kaist');
  const isSeoulUniv = cleanQ.includes('서울대') || cleanQ.includes('snu');

  // 나이대 의도 탐지
  let targetAgeGroup: AgeGroup | null = null;
  if (cleanQ.includes('20대') || cleanQ.includes('주니어')) {
    targetAgeGroup = '20s';
    filterTags.push('연령: 20대');
  } else if (cleanQ.includes('30대') || cleanQ.includes('실무') || cleanQ.includes('팀장')) {
    targetAgeGroup = '30s';
    filterTags.push('연령: 30대');
  } else if (cleanQ.includes('40대') || cleanQ.includes('임원') || cleanQ.includes('본부장')) {
    targetAgeGroup = '40s';
    filterTags.push('연령: 40대');
  } else if (cleanQ.includes('50대') || cleanQ.includes('c-level') || cleanQ.includes('고문')) {
    targetAgeGroup = '50s_plus';
    filterTags.push('연령: 50대+');
  }

  // 태그 추가
  if (isNaverAlumni) filterTags.push('기업: 네이버(현직/전직)');
  if (isSamsungAlumni) filterTags.push('기업: 삼성(현직/전직)');
  if (isTossKakao) filterTags.push('기업: 토스/카카오');
  if (isAiDomain) filterTags.push('도메인: AI/LLM');
  if (isInfraCloud) filterTags.push('도메인: 클라우드/인프라');
  if (isVcFinance) filterTags.push('도메인: VC/투자');
  if (isDartFact) filterTags.push('검증: DART 실공시 팩트');
  if (isStaleIntent) filterTags.push('상태: 6개월 이상 안부 필요');
  if (isKaist) filterTags.push('학맥: KAIST');
  if (isSeoulUniv) filterTags.push('학맥: 서울대학교');

  // 의미론적 벡터 유사도 매칭 수행
  const semanticMatches = calculateSemanticMatches(cleanQ, people);
  const semanticScores = new Map<string, number>();
  semanticMatches.forEach(m => semanticScores.set(m.person.id, m.score));

  // 2. 인맥 필터링 및 엣지 경로 검증
  const matched = people.filter(p => {
    let score = 0;

    // 나이대 조건
    if (targetAgeGroup) {
      if (p.estimatedAgeGroup === targetAgeGroup) score += 3;
      else return false;
    }

    // DART 실공시 조건
    if (isDartFact) {
      if (p.sourceType === 'DART_FACT' || p.dartInfo?.isPublicDirector) score += 5;
      else return false;
    }

    // 6개월 미소통(안부 필요) 조건
    if (isStaleIntent) {
      if (p.isStale) score += 4;
      else return false;
    }

    // 알럼나이 및 현직 회사 조건
    if (isNaverAlumni) {
      const hasNaverNow = p.currentCompany.toLowerCase().includes('네이버') || p.currentCompany.toLowerCase().includes('naver');
      const hasNaverPast = p.careers.some(c => c.companyName.toLowerCase().includes('네이버') || c.companyName.toLowerCase().includes('naver'));
      if (hasNaverNow || hasNaverPast) score += 5;
    }

    if (isSamsungAlumni) {
      const hasSamsungNow = p.currentCompany.toLowerCase().includes('삼성') || p.currentCompany.toLowerCase().includes('samsung');
      const hasSamsungPast = p.careers.some(c => c.companyName.toLowerCase().includes('삼성') || c.companyName.toLowerCase().includes('samsung'));
      if (hasSamsungNow || hasSamsungPast) score += 5;
    }

    if (isTossKakao) {
      const hasNow = p.currentCompany.toLowerCase().includes('토스') || p.currentCompany.toLowerCase().includes('카카오') || p.currentCompany.toLowerCase().includes('비바리퍼블리카');
      const hasPast = p.careers.some(c => c.companyName.toLowerCase().includes('토스') || c.companyName.toLowerCase().includes('카카오'));
      if (hasNow || hasPast) score += 5;
    }

    // 도메인 조건
    if (isAiDomain && (p.primaryDomain.includes('AI') || p.skills.some(s => s.toLowerCase().includes('ai')))) {
      score += 3;
    }
    if (isInfraCloud && (p.primaryDomain.includes('인프라') || p.primaryDomain.includes('클라우드') || p.currentTitle.includes('CTO'))) {
      score += 3;
    }
    if (isVcFinance && (p.primaryDomain.includes('투자') || p.primaryDomain.includes('재무') || p.currentTitle.includes('심사역') || p.currentTitle.includes('파트너'))) {
      score += 3;
    }

    // 학맥 조건
    if (isKaist && p.academics.some(a => a.schoolName.toLowerCase().includes('카이스트') || a.schoolName.toLowerCase().includes('kaist'))) {
      score += 4;
    }
    if (isSeoulUniv && p.academics.some(a => a.schoolName.toLowerCase().includes('서울대'))) {
      score += 4;
    }

    // 의미론적 벡터 유사도 매칭 (Cosine Similarity)
    const semanticMatch = semanticScores.get(p.id) || 0;
    if (semanticMatch > 0.15) {
      score += Math.round(semanticMatch * 10);
    }

    // 범용 텍스트 매칭
    const textCorpus = `${p.name} ${p.currentCompany} ${p.currentDepartment} ${p.currentTitle} ${p.primaryDomain} ${p.memo || ''} ${p.skills.join(' ')}`.toLowerCase();
    const queryTokens = cleanQ.split(/\s+/);
    const tokenMatchCount = queryTokens.filter(t => textCorpus.includes(t)).length;
    score += tokenMatchCount * 2;

    return score > 0;
  });

  // 하이라이트 노드 및 연관 회사 목록 구성
  matched.forEach(p => {
    highlightNodeIds.push(`p_${p.id}`);
    relatedCompanies.add(p.currentCompany);
    p.careers.filter(c => !c.isCurrent).forEach(c => relatedCompanies.add(c.companyName));
  });

  // 3. 지능형 추론 브리핑 (Reasoning Synthesis)
  let reasoning = '';
  if (matched.length === 0) {
    reasoning = `입력하신 조건("[${query}]")과 일치하는 인맥 노드를 그래프에서 발견하지 못했습니다. 검색 조건을 완화하거나 다른 키워드로 검색해 보세요.`;
  } else {
    const factCount = matched.filter(m => m.sourceType === 'DART_FACT').length;
    const alumniHighlights = matched.filter(m => m.careers.some(c => !c.isCurrent)).length;

    reasoning = `GraphRAG 지식 경로 탐색 결과, 총 **${matched.length}명**의 관련 인맥 노드가 연결되었습니다. ` +
      (factCount > 0 ? `이 중 **${factCount}명**은 금융감독원 DART 실공시로 검증된 상장사 등기/미등기 임원 팩트입니다. ` : '') +
      (alumniHighlights > 0 ? `과거 주요 빅테크/선도기업을 거쳐간 알럼나이 인력 **${alumniHighlights}명**이 포함되어 있어 2촌 확장 시 높은 레버리지를 기대할 수 있습니다.` : '');
  }

  return {
    query,
    matchedPeople: matched,
    reasoning,
    highlightNodeIds,
    relatedCompanies: Array.from(relatedCompanies),
    filterTags
  };
}
