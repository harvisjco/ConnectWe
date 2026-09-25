import { Person } from '../types/network';

export type PenetrationGrade = 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | 'GRADE_D';

export interface CompanyPenetration {
  companyName: string;
  industry: string;
  isListed: boolean;
  marketCapRank?: number;
  totalDirectContacts: number; // 1촌
  totalSecondDegreeContacts: number; // 2촌
  dartExecutiveCount: number; // 공시 임원
  decisionMakerCount: number; // C-Level / 본부장급
  grade: PenetrationGrade;
  gradeLabel: string;
  gradeColor: string;
  penetrationScore: number; // 0 ~ 100
  keyContacts: Person[];
  recommendedStrategy: string;
}

export interface NetworkEquitySummary {
  totalPeople: number;
  totalCompanies: number;
  dartExecutiveTotal: number;
  gradeACount: number; // 핵심 파트너십 기업
  gradeBCount: number; // 양호 기업
  gradeCCount: number; // 진입 단계
  blindSpotCount: number; // 사각지대 (D)
  industryDiversityScore: number; // 0 ~ 100 (HHI 기반 역산)
  averageClosenessScore: number; // 1.0 ~ 5.0
  activeRatio90Days: number; // 최근 90일 소통 활성 비율 (%)
}

// 대한민국 20대 핵심 벤치마크 타깃 기업군
const TARGET_BENCHMARK_COMPANIES: { name: string; industry: string; rank: number }[] = [
  { name: '삼성전자', industry: '반도체/전자', rank: 1 },
  { name: 'SK하이닉스', industry: '반도체', rank: 2 },
  { name: 'LG에너지솔루션', industry: '이차전지/배터리', rank: 3 },
  { name: '현대자동차', industry: '모빌리티/자동차', rank: 4 },
  { name: 'NAVER', industry: '빅테크/인터넷', rank: 5 },
  { name: '카카오', industry: '플랫폼/모바일', rank: 6 },
  { name: '토스 (비바리퍼블리카)', industry: '핀테크 유니콘', rank: 7 },
  { name: '쿠팡', industry: '이커머스/물류', rank: 8 },
  { name: '크래프톤', industry: '게임/엔터테인먼트', rank: 9 },
  { name: '두나무 (업비트)', industry: '블록체인/가상자산', rank: 10 },
  { name: 'KB금융', industry: '금융/은행', rank: 11 },
  { name: '신한지주', industry: '금융/은행', rank: 12 },
  { name: '미래에셋증권', industry: '투자은행/증권', rank: 13 },
  { name: '한화에어로스페이스', industry: '방산/항공우주', rank: 14 },
  { name: '엔씨소프트', industry: '게임', rank: 15 },
  { name: 'CJ ENM', industry: '미디어/콘텐츠', rank: 16 },
  { name: 'LG전자', industry: '가전/전장', rank: 17 },
  { name: '기아', industry: '모빌리티', rank: 18 },
  { name: '포스코홀딩스', industry: '철강/소재', rank: 19 },
  { name: 'KT', industry: '통신/AI', rank: 20 },
];

/**
 * 기업명 유사도 판정
 */
function matchCompany(personComp: string, targetComp: string): boolean {
  const p = personComp.toLowerCase().replace(/주식회사|\(주\)|\s/g, '');
  const t = targetComp.toLowerCase().replace(/주식회사|\(주\)|\s/g, '');
  return p.includes(t) || t.includes(p);
}

/**
 * 20대 핵심 기업 네트워크 커버리지(도달도) 분석 산출
 */
export function calculateCompanyPenetrations(people: Person[]): CompanyPenetration[] {
  return TARGET_BENCHMARK_COMPANIES.map(target => {
    const matched = people.filter(p => matchCompany(p.currentCompany, target.name));
    
    const direct1 = matched.filter(p => p.closeness <= 2);
    const second2 = matched.filter(p => p.closeness === 3 || p.closeness === 4);
    const dartExecs = matched.filter(p => p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector);
    const decisionMakers = matched.filter(p => 
      p.currentTitle.includes('대표') || 
      p.currentTitle.includes('사장') || 
      p.currentTitle.includes('부사장') || 
      p.currentTitle.includes('전무') || 
      p.currentTitle.includes('상무') ||
      p.currentTitle.includes('이사') ||
      p.currentTitle.includes('본부장')
    );

    // 네트워크 도달 점수 산출 공식 (0~100)
    // 1촌 1명당 25점, 2촌 1명당 10점, DART 임원 1명당 25점, 의사결정권자 1명당 20점
    const rawScore = 
      (direct1.length * 25) + 
      (second2.length * 10) + 
      (dartExecs.length * 25) + 
      (decisionMakers.length * 20);
    
    const penetrationScore = Math.min(100, rawScore);

    let grade: PenetrationGrade = 'GRADE_D';
    let gradeLabel = '사각지대 (Blind Spot)';
    let gradeColor = 'text-rose-400 bg-rose-950/80 border-rose-500/40';
    let recommendedStrategy = '신규 1·2촌 접점 발굴 및 소개 요청 시급';

    if (penetrationScore >= 75) {
      grade = 'GRADE_A';
      gradeLabel = 'A등급: 핵심 파트너십';
      gradeColor = 'text-emerald-400 bg-emerald-950/80 border-emerald-500/40';
      recommendedStrategy = 'C-Level 다면 채널 및 비즈니스 딜 직통 가동';
    } else if (penetrationScore >= 45) {
      grade = 'GRADE_B';
      gradeLabel = 'B등급: 우호 채널 확보';
      gradeColor = 'text-sky-400 bg-sky-950/80 border-sky-500/40';
      recommendedStrategy = '키맨 추가 미팅 및 챔피언 우호도 강화';
    } else if (penetrationScore >= 15) {
      grade = 'GRADE_C';
      gradeLabel = 'C등급: 초기 진입 단계';
      gradeColor = 'text-amber-400 bg-amber-950/80 border-amber-500/40';
      recommendedStrategy = '기존 인맥을 레버리지하여 2촌 임원 소개 추진';
    }

    return {
      companyName: target.name,
      industry: target.industry,
      isListed: true,
      marketCapRank: target.rank,
      totalDirectContacts: direct1.length,
      totalSecondDegreeContacts: second2.length,
      dartExecutiveCount: dartExecs.length,
      decisionMakerCount: decisionMakers.length,
      grade,
      gradeLabel,
      gradeColor,
      penetrationScore,
      keyContacts: matched,
      recommendedStrategy
    };
  }).sort((a, b) => b.penetrationScore - a.penetrationScore);
}

/**
 * 인맥 자산 종합 헬스 요약 산출
 */
export function calculateNetworkEquity(people: Person[], penetrations: CompanyPenetration[]): NetworkEquitySummary {
  const companySet = new Set<string>();
  const industryMap = new Map<string, number>();

  let activeCount90 = 0;
  const now = new Date('2026-09-24T16:00:00');

  people.forEach(p => {
    if (p.currentCompany) companySet.add(p.currentCompany);
    const domain = p.primaryDomain || '기타';
    industryMap.set(domain, (industryMap.get(domain) || 0) + 1);

    if (p.lastContactDate) {
      const days = (now.getTime() - new Date(p.lastContactDate).getTime()) / (1000 * 60 * 60 * 24);
      if (days <= 90) activeCount90++;
    } else if (!p.isStale) {
      activeCount90++;
    }
  });

  const dartTotal = people.filter(p => p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector).length;
  const gradeACount = penetrations.filter(p => p.grade === 'GRADE_A').length;
  const gradeBCount = penetrations.filter(p => p.grade === 'GRADE_B').length;
  const gradeCCount = penetrations.filter(p => p.grade === 'GRADE_C').length;
  const blindSpotCount = penetrations.filter(p => p.grade === 'GRADE_D').length;

  const activeRatio90Days = people.length > 0 ? Math.round((activeCount90 / people.length) * 100) : 0;
  const avgCloseness = people.length > 0
    ? Number((people.reduce((acc, p) => acc + p.closeness, 0) / people.length).toFixed(1))
    : 3.0;

  // 산업군 다양성 지수 (HHI 역산 방식)
  let sumSq = 0;
  industryMap.forEach(count => {
    const share = count / (people.length || 1);
    sumSq += share * share;
  });
  const diversityScore = Math.max(10, Math.min(100, Math.round((1 - sumSq) * 125)));

  return {
    totalPeople: people.length,
    totalCompanies: companySet.size,
    dartExecutiveTotal: dartTotal,
    gradeACount,
    gradeBCount,
    gradeCCount,
    blindSpotCount,
    industryDiversityScore: diversityScore,
    averageClosenessScore: avgCloseness,
    activeRatio90Days
  };
}

/**
 * CSV BOM 필수 원칙 준수 내보내기 파이프라인
 * \uFEFF 삽입하여 엑셀 한글 깨짐 완벽 방지
 */
export function exportPenetrationCsvWithBom(penetrations: CompanyPenetration[]): void {
  const headers = [
    '기업명',
    '산업분야',
    '시가총액순위',
    '도달등급',
    '도달점수(100점만점)',
    '1촌인맥수',
    '2촌인맥수',
    'DART등기임원수',
    '의사결정권자수',
    '추천전략'
  ];

  const rows = penetrations.map(p => [
    `"${p.companyName}"`,
    `"${p.industry}"`,
    p.marketCapRank || '-',
    `"${p.gradeLabel}"`,
    p.penetrationScore,
    p.totalDirectContacts,
    p.totalSecondDegreeContacts,
    p.dartExecutiveCount,
    p.decisionMakerCount,
    `"${p.recommendedStrategy}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = `ConnectWe_타깃기업_네트워크커버리지_진단리포트_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
