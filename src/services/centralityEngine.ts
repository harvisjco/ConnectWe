import { Person } from '../types/network';

export type NetworkTier = 'ALPHA_HUB' | 'CORE_CONNECTOR' | 'SPECIALIST' | 'GROWTH_NODE';

export interface PersonPowerMetric {
  person: Person;
  powerScore: number; // 0 ~ 100
  tier: NetworkTier;
  tierLabel: string;
  alumniReachCount: number; // 연결 가능한 알럼나이 수
  sameCompanyCount: number; // 사내 동료 인맥 수
  isDartPublicDirector: boolean;
  insights: string[];
}

/**
 * 인맥 그래프 기반 허브 지수 & 영향력(Centrality & Power Score) 계산 엔진
 */
export function calculatePersonPowerMetric(
  target: Person,
  allPeople: Person[]
): PersonPowerMetric {
  const isDart = target.sourceType === 'DART_FACT' || !!target.dartInfo?.isPublicDirector;
  
  // 1. 사내 동료 인맥 수 계산
  const targetCleanCompany = target.currentCompany.replace(/[\(주\)|주식회사|\s]/gi, '').toLowerCase();
  const colleagues = allPeople.filter(p => {
    if (p.id === target.id) return false;
    const cleanComp = p.currentCompany.replace(/[\(주\)|주식회사|\s]/gi, '').toLowerCase();
    return cleanComp && (cleanComp.includes(targetCleanCompany) || targetCleanCompany.includes(cleanComp));
  });

  // 2. 알럼나이(이전 경력) 겹침 수 계산
  const targetCareerCompanies = (target.careers || []).map(c => 
    c.companyName.replace(/[\(주\)|주식회사|\s]/gi, '').toLowerCase()
  );

  const alumniConnections = allPeople.filter(p => {
    if (p.id === target.id) return false;
    return (p.careers || []).some(c => {
      const clean = c.companyName.replace(/[\(주\)|주식회사|\s]/gi, '').toLowerCase();
      return targetCareerCompanies.includes(clean);
    });
  });

  // 3. 점수 계산 (Fact-Grounded Weighting)
  let score = 30; // 기본 점수

  // (A) DART 상장사 공시 임원 가중치 (+25점)
  if (isDart) score += 25;

  // (B) 사내 동료 인맥 풀 (+최대 20점)
  score += Math.min(20, colleagues.length * 4);

  // (C) 알럼나이 네트워크 도달 범위 (+최대 15점)
  score += Math.min(15, alumniConnections.length * 3);

  // (D) 친밀도 및 최근 소통 여부 (+최대 10점)
  if (target.closeness <= 2) score += 6;
  if (!target.isStale) score += 4;

  const finalScore = Math.min(100, Math.max(10, score));

  // 4. 네트워크 티어 분류
  let tier: NetworkTier = 'GROWTH_NODE';
  let tierLabel = '잠재 인맥 노드';

  if (finalScore >= 80) {
    tier = 'ALPHA_HUB';
    tierLabel = '핵심 네트워크 허브 (Key Connector)';
  } else if (finalScore >= 65) {
    tier = 'CORE_CONNECTOR';
    tierLabel = '핵심 비즈니스 연결자';
  } else if (finalScore >= 45) {
    tier = 'SPECIALIST';
    tierLabel = '도메인 스페셜리스트';
  }

  // 5. 정량적 인사이트 도출
  const insights: string[] = [];
  if (isDart) {
    insights.push(`DART 상장사 [${target.dartInfo?.stockName || target.currentCompany}] 공시 임원으로 최상위 의사결정권 보유`);
  }
  if (colleagues.length > 0) {
    insights.push(`${target.currentCompany} 사내 인맥 ${colleagues.length}명과의 허브 노드 역할`);
  }
  if (alumniConnections.length > 0) {
    insights.push(`출신 기업 알럼나이 ${alumniConnections.length}명과 연결된 가교`);
  }
  if (target.closeness <= 2) {
    insights.push(`친밀도 1~2촌의 두터운 신뢰 관계 보유`);
  }

  return {
    person: target,
    powerScore: finalScore,
    tier,
    tierLabel,
    alumniReachCount: alumniConnections.length,
    sameCompanyCount: colleagues.length,
    isDartPublicDirector: isDart,
    insights
  };
}

/**
 * 전체 인맥 중 상위 슈퍼 커넥터(Super Connector) 랭킹 산출
 */
export function getTopSuperConnectors(
  people: Person[],
  limit: number = 5
): PersonPowerMetric[] {
  return people
    .map(p => calculatePersonPowerMetric(p, people))
    .sort((a, b) => b.powerScore - a.powerScore)
    .slice(0, limit);
}
