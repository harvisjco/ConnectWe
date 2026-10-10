// ConnectWe B2B Cross-Board Synergy & M&A Strategy Simulator Engine
// Fact-grounded DART Executive Overlay & Trust Bridge Routing

import { Person } from '../types/network';
import LIVE_DART_EXECUTIVES_RAW from '../data/liveDartExecutives.json';
import { RawDartExecutive } from './dartFactEngine';

const DART_EXECUTIVES = LIVE_DART_EXECUTIVES_RAW as RawDartExecutive[];

export type SynergyGrade = 'S' | 'A' | 'B' | 'C';

export type OverlayType = 
  | 'DIRECT_BOARD'       // 양사 이사회 직접 연결 (1촌 사내/사외이사)
  | 'ALUMNI_OVERLAP'     // 출신 직장(네이버, 삼성전자 등) 및 학교 동문 겹침
  | 'CONCURRENT_BOARD'   // 사외이사/감사 겸직 등 거버넌스 접점
  | 'INVESTOR_LINK';     // 공동 투자사 / 벤처 파트너십 가교

export interface CrossBoardOverlayItem {
  id: string;
  type: OverlayType;
  typeLabel: string;
  badgeStyle: string;
  personName: string;
  personTitle: string;
  personCompany: string;
  connectionContext: string;
  closeness: number;
  matchedPerson?: Person;
  concurrentPublicCorpCount?: number;
  isCommercialLawCompliant?: boolean;
  complianceWarning?: string;
}

export interface TrustRoute {
  id: string;
  routeName: string;
  routeType: 'DIRECT' | 'ALUMNI' | 'INVESTOR';
  trustScore: number; // 0 ~ 100
  keyPerson: string;
  keyPersonRole: string;
  routeTitle: string;
  approachStrategy: string;
  icebreakerTopic: string;
}

export interface StrategicSynergyTheme {
  id: string;
  title: string;
  category: '기술/R&D 시너지' | '공급망/유통망 결합' | '지분 제휴/M&A 기회';
  description: string;
  expectedImpact: string;
}

export interface CrossBoardSynergyReport {
  ourCorpName: string;
  targetCorpName: string;
  synergyScore: number; // 0 ~ 100
  synergyGrade: SynergyGrade;
  gradeLabel: string;
  executiveSummary: string;
  totalOverlaysCount: number;
  overlays: CrossBoardOverlayItem[];
  threeTrustRoutes: TrustRoute[];
  synergyThemes: StrategicSynergyTheme[];
  onePageBriefText: string;
}

/**
 * 기업명 정규화 (주식회사, 공백 등 제거)
 */
function normalizeCorpName(name: string): string {
  return name.replace(/[\(주\)|주식회사|\s]/gi, '').toLowerCase();
}

/**
 * 특정 기업의 DART 임원 목록 추출
 */
export function getCorpExecutives(corpName: string): RawDartExecutive[] {
  const normTarget = normalizeCorpName(corpName);
  return DART_EXECUTIVES.filter(exec => {
    const normExec = normalizeCorpName(exec.corpName);
    return normExec.includes(normTarget) || normTarget.includes(normExec);
  });
}

/**
 * 특정 인물이 DART 상장사 중 겸직 중인 상장사 목록 및 상법 제542조의8 준수 여부 산출
 * (상법 제542조의8 및 시행령 제34조: 상장회사 사외이사는 2개 이상의 다른 회사 이사/감사 겸직 불가 - 최대 2개사 한도)
 */
export function getConcurrentDirectorships(personName: string): {
  count: number;
  companies: string[];
  isCompliant: boolean;
  warning?: string;
} {
  const matchingExecs = DART_EXECUTIVES.filter(e => e.name === personName);
  const distinctCorps = Array.from(new Set(matchingExecs.map(e => e.corpName)));
  const count = distinctCorps.length;
  const isCompliant = count <= 2;
  return {
    count,
    companies: distinctCorps,
    isCompliant,
    warning: !isCompliant 
      ? `상법 제542조의8 겸직 한도 주의 (상장사 ${count}개사: ${distinctCorps.join(', ')})`
      : undefined
  };
}

/**
 * 전략적 크로스 보드 시너지 및 3대 신뢰 가교 경로 분석
 */
export function analyzeCrossBoardSynergy(
  targetCorpName: string,
  people: Person[],
  ourCorpName: string = '(주)ConnectWe'
): CrossBoardSynergyReport {
  const targetExecs = getCorpExecutives(targetCorpName);
  const overlays: CrossBoardOverlayItem[] = [];

  // 1. DART 공시 임원 중 내 주소록(people)과 일치하거나 관련 있는 인물 매핑
  targetExecs.forEach(exec => {
    const matchedPerson = people.find(p => 
      p.name === exec.name && 
      (normalizeCorpName(p.currentCompany).includes(normalizeCorpName(exec.corpName)) ||
       normalizeCorpName(exec.corpName).includes(normalizeCorpName(p.currentCompany)))
    );

    if (matchedPerson) {
      const isDirector = (exec.registrationType || '').includes('사외') || (exec.position || '').includes('사외');
      const directorshipInfo = getConcurrentDirectorships(matchedPerson.name);
      overlays.push({
        id: `overlay-direct-${exec.id || exec.name}`,
        type: isDirector ? 'CONCURRENT_BOARD' : 'DIRECT_BOARD',
        typeLabel: isDirector ? '사외이사/감사 거버넌스' : '이사회 직접 접점 (1촌)',
        badgeStyle: isDirector 
          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
        personName: matchedPerson.name,
        personTitle: matchedPerson.currentTitle,
        personCompany: targetCorpName,
        connectionContext: `DART 공시 ${exec.position || '임원'} (${exec.chargeJob || '경영 총괄'}) · 내 1촌 핵심 네트워크`,
        closeness: matchedPerson.closeness,
        matchedPerson,
        concurrentPublicCorpCount: directorshipInfo.count,
        isCommercialLawCompliant: directorshipInfo.isCompliant,
        complianceWarning: directorshipInfo.warning
      });
    }
  });

  // 2. 알럼나이(이전 직장/학교) 공유 네트워크 탐색
  // 주요 테크/대기업(삼성, 네이버, 카카오, SK, 현대 등) 출신 인맥 교차 매핑
  const majorAlumniKeywords = ['삼성', '네이버', '카카오', 'sk', 'lg', '현대', '쿠팡', '토스', '서울대', '카이스트'];
  
  people.forEach(p => {
    // 이미 직접 오버레이에 포함된 인물 제외
    if (overlays.some(o => o.personName === p.name)) return;

    // 타깃 기업 임원진의 출신/경력 키워드와 매칭
    const pCompanies = [
      p.currentCompany,
      ...(p.careers?.map(c => c.companyName) || []),
      ...(p.pastCompanies || [])
    ].map(c => c.toLowerCase());

    const hasAlumniMatch = targetExecs.some(exec => {
      const execCareer = (exec.mainCareer || '').toLowerCase();
      return pCompanies.some(pc => {
        if (!pc) return false;
        const normPc = normalizeCorpName(pc);
        return normPc.length >= 2 && execCareer.includes(normPc);
      }) || majorAlumniKeywords.some(kw => execCareer.includes(kw) && pCompanies.some(pc => pc.includes(kw)));
    });

    if (hasAlumniMatch) {
      overlays.push({
        id: `overlay-alumni-${p.id}`,
        type: 'ALUMNI_OVERLAP',
        typeLabel: '공동 알럼나이 (전직·학연)',
        badgeStyle: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
        personName: p.name,
        personTitle: `${p.currentCompany} ${p.currentTitle}`,
        personCompany: p.currentCompany,
        connectionContext: `상대 기업 핵심 임원진과 동일한 이전 직장/연구 도메인 공유 (${p.primaryDomain || '전문 기술'})`,
        closeness: p.closeness,
        matchedPerson: p
      });
    }
  });

  // 3. 투자 파트너십 / VC 연결고리 탐색
  people.filter(p => 
    (p.primaryDomain?.includes('투자') || p.primaryDomain?.includes('VC') || p.currentTitle?.includes('파트너') || p.currentTitle?.includes('이사')) &&
    !overlays.some(o => o.personName === p.name)
  ).slice(0, 2).forEach(p => {
    overlays.push({
      id: `overlay-investor-${p.id}`,
      type: 'INVESTOR_LINK',
      typeLabel: '투자·자문 파트너 가교',
      badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      personName: p.name,
      personTitle: `${p.currentCompany} ${p.currentTitle}`,
      personCompany: p.currentCompany,
      connectionContext: `전략적 투자자(SI) 및 자문 네트워크를 통한 제3자 신뢰 소개 브릿지`,
      closeness: p.closeness,
      matchedPerson: p
    });
  });

  // 4. 시너지 지수 산출 (최대 100점)
  // 기본 점수 55점 + 직접 이사회(20점/건) + 알럼나이(8점/건) + 투자사(6점/건)
  const directCount = overlays.filter(o => o.type === 'DIRECT_BOARD').length;
  const concurrentCount = overlays.filter(o => o.type === 'CONCURRENT_BOARD').length;
  const alumniCount = overlays.filter(o => o.type === 'ALUMNI_OVERLAP').length;
  const investorCount = overlays.filter(o => o.type === 'INVESTOR_LINK').length;

  let rawScore = 55 + (directCount * 20) + (concurrentCount * 15) + (alumniCount * 8) + (investorCount * 6);
  if (targetExecs.length === 0) rawScore = 45; // 공시 임원이 없는 경우
  const synergyScore = Math.min(98, Math.max(35, rawScore));

  let synergyGrade: SynergyGrade = 'C';
  let gradeLabel = '초기 관계 형성 필요';
  if (synergyScore >= 85) {
    synergyGrade = 'S';
    gradeLabel = '전략적 즉시 제휴 유력 (최고 신뢰 연결망)';
  } else if (synergyScore >= 70) {
    synergyGrade = 'A';
    gradeLabel = '우호적 파트너십 구축 가능 (유력 브릿지 보유)';
  } else if (synergyScore >= 50) {
    synergyGrade = 'B';
    gradeLabel = '탐색적 티타임 접촉 권장 (알럼나이 레버리지)';
  }

  // 5. 3대 신뢰 가교 경로 도출
  const directKey = overlays.find(o => o.type === 'DIRECT_BOARD' || o.type === 'CONCURRENT_BOARD');
  const alumniKey = overlays.find(o => o.type === 'ALUMNI_OVERLAP');
  const investorKey = overlays.find(o => o.type === 'INVESTOR_LINK');

  const threeTrustRoutes: TrustRoute[] = [
    {
      id: 'route-direct',
      routeName: '루트 1: [C-Level 다이렉트 패스]',
      routeType: 'DIRECT',
      trustScore: directKey ? 94 : 70,
      keyPerson: directKey ? directKey.personName : (targetExecs[0]?.name || '핵심 사내이사'),
      keyPersonRole: directKey ? directKey.personTitle : (targetExecs[0]?.position || '등기임원'),
      routeTitle: directKey ? `${directKey.personName} 1촌 직통 조율` : '이사회 직통 공식 안건 제안',
      approachStrategy: directKey 
        ? `${directKey.personName} 님과의 사전 1:1 티타임을 통해 양사 공동 비전 공감대를 형성한 후 대표이사 미팅으로 상향 연계.`
        : '상호 우호적 C-Level 채널을 통해 사업 협력 제안서(1-Page) 공식 전달.',
      icebreakerTopic: '차세대 인프라 협력 및 기술 얼라이언스 비전 공유'
    },
    {
      id: 'route-alumni',
      routeName: '루트 2: [알럼나이 브릿지 패스]',
      routeType: 'ALUMNI',
      trustScore: alumniKey ? 86 : 65,
      keyPerson: alumniKey ? alumniKey.personName : '전직 알럼나이 핵심 리드',
      keyPersonRole: alumniKey ? alumniKey.personTitle : '시니어 엔지니어링 리더',
      routeTitle: alumniKey ? `${alumniKey.personName} 님의 신뢰 추천` : '동일 직장 출신 네트워크를 통한 자연스러운 소개',
      approachStrategy: alumniKey
        ? `과거 협업 경험이 있는 ${alumniKey.personName} 님의 Double Opt-in 티타임 소개를 통해 상대 기업 실무 총괄과 편안하게 연결.`
        : '업계 동문 인맥을 통해 실무 책임자의 관심 의제를 사전 조율한 후 접근.',
      icebreakerTopic: '과거 성공 프로젝트 회고 및 상호 기술적 시너지 탐색'
    },
    {
      id: 'route-investor',
      routeName: '루트 3: [투자·자문 파트너 가교]',
      routeType: 'INVESTOR',
      trustScore: investorKey ? 88 : 72,
      keyPerson: investorKey ? investorKey.personName : '공동 투자사 대표 파트너',
      keyPersonRole: investorKey ? investorKey.personTitle : 'VC/PE 총괄 파트너',
      routeTitle: investorKey ? `${investorKey.personName} 파트너 신뢰 보증` : '주요 주주 및 자문단을 통한 우호적 중재',
      approachStrategy: investorKey
        ? `${investorKey.personName} 파트너의 주선으로 양사 대표이사가 참여하는 비공개 전략 디너 또는 라운드테이블 미팅 주선.`
        : '기업 가치 제고를 명분으로 양사 주주 간 사전 협력 의사 타진.',
      icebreakerTopic: '산업 밸류체인 통합 및 공동 시장 진출에 따른 기업가치 배수(Multiple) 확장'
    }
  ];

  // 6. 양사 간 전략적 시너지 3대 화두 생성
  const synergyThemes: StrategicSynergyTheme[] = [
    {
      id: 'theme-tech',
      title: 'AI 인텔리전스 & 차세대 엔터프라이즈 인프라 결합',
      category: '기술/R&D 시너지',
      description: `${ourCorpName}의 고도화된 소프트웨어 기술력과 ${targetCorpName}의 강력한 고객 도메인 데이터셋을 융합하여 독점적 솔루션 공동 개발.`,
      expectedImpact: '신규 엔터프라이즈 시장 침투 기간 6개월 단축 및 공동 R&D 비용 30% 절감'
    },
    {
      id: 'theme-distribution',
      title: '양사 상호 채널 교차 세일즈 및 파트너 생태계 통합',
      category: '공급망/유통망 결합',
      description: `${targetCorpName}의 견고한 B2B 네트워크망에 ${ourCorpName}의 솔루션을 번들링 탑재하여 크로스 세일즈(Cross-Selling) 파이프라인 개설.`,
      expectedImpact: '연간 신규 파이프라인 계약 20억원 이상의 즉각적인 상생 매출 창출'
    },
    {
      id: 'theme-ma',
      title: '전략적 우호 지분 스왑(Swap) 및 M&A 얼라이언스 타진',
      category: '지분 제휴/M&A 기회',
      description: '단순 업무협약을 넘어 상호 소수지분 교환 또는 조인트벤처(JV) 설립을 통해 장기적 경영 협력 관계 락인(Lock-in).',
      expectedImpact: '상호 거버넌스 안정성 강화 및 후속 라운드 공동 투자 유치 유리'
    }
  ];

  // 7. 1-Page C-Level 전략 시너지 브리프 자동 합성
  const topKeyName = directKey?.personName || alumniKey?.personName || '내부 키맨';
  const onePageBriefText = `[C-Level 전략 시너지 브리프]
■ 대상 기업: ${targetCorpName} ↔ ${ourCorpName}
■ 시너지 종합 점수: ${synergyScore}점 (등급: ${synergyGrade}등급 - ${gradeLabel})
■ 핵심 인맥 접점: 총 ${overlays.length}명 감지 (직접 이사회 ${directCount + concurrentCount}명, 알럼나이 ${alumniCount}명, 투자/자문 ${investorCount}명)

[최우선 3대 신뢰 가교 경로]
1. ${threeTrustRoutes[0].routeName}: ${threeTrustRoutes[0].keyPerson} (${threeTrustRoutes[0].keyPersonRole}) - 신뢰도 ${threeTrustRoutes[0].trustScore}%
   - 전략: ${threeTrustRoutes[0].approachStrategy}
2. ${threeTrustRoutes[1].routeName}: ${threeTrustRoutes[1].keyPerson} - 신뢰도 ${threeTrustRoutes[1].trustScore}%
   - 전략: ${threeTrustRoutes[1].approachStrategy}
3. ${threeTrustRoutes[2].routeName}: ${threeTrustRoutes[2].keyPerson} - 신뢰도 ${threeTrustRoutes[2].trustScore}%
   - 전략: ${threeTrustRoutes[2].approachStrategy}

[양사 3대 전략 결합 화두]
1. ${synergyThemes[0].title} (${synergyThemes[0].expectedImpact})
2. ${synergyThemes[1].title} (${synergyThemes[1].expectedImpact})
3. ${synergyThemes[2].title} (${synergyThemes[2].expectedImpact})

[경영진 권고 액션]
본 건은 ${topKeyName} 님을 통한 1단계 비공개 티타임 사전 조율 후, 2주 이내 양사 대표이사/CTO 전략 협력 세션으로 발전시킬 것을 권고합니다.`;

  return {
    ourCorpName,
    targetCorpName,
    synergyScore,
    synergyGrade,
    gradeLabel,
    executiveSummary: `${targetCorpName}과의 전략적 결합 가능성은 ${synergyScore}점(${synergyGrade}등급)으로, ${topKeyName} 님을 비롯한 ${overlays.length}개의 신뢰 접점을 통해 안전하고 격조 높은 파트너십 구축이 가능합니다.`,
    totalOverlaysCount: overlays.length,
    overlays,
    threeTrustRoutes,
    synergyThemes,
    onePageBriefText
  };
}
