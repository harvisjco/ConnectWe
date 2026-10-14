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
 * 회사명 정규화 헬퍼 (주식회사 기호 및 공백 제거)
 */
export function cleanCompanyName(company: string | null | undefined): string {
  if (!company) return '';
  return company.replace(/[\(주\)|주식회사|\s]/gi, '').toLowerCase();
}

/**
 * O(1) 고속 조회를 위한 인맥 그래프 사전 색인 인터페이스
 */
export interface NetworkGraphIndex {
  companyMap: Map<string, string[]>; // cleanCompany -> personId[]
  alumniMap: Map<string, string[]>;  // cleanCareerCompany -> personId[]
  allCompanyKeys: string[];
  allAlumniKeys: string[];
}

/**
 * O(N) 단일 패스로 전체 인맥의 소속사 및 경력 알럼나이 해시맵 색인을 구축
 */
export function buildNetworkGraphIndex(allPeople: Person[]): NetworkGraphIndex {
  const companyMap = new Map<string, string[]>();
  const alumniMap = new Map<string, string[]>();

  for (const person of allPeople) {
    // 1. 현재 소속 회사 색인화
    const cleanComp = cleanCompanyName(person.currentCompany);
    if (cleanComp) {
      const list = companyMap.get(cleanComp) || [];
      list.push(person.id);
      companyMap.set(cleanComp, list);
    }

    // 2. 과거 경력 알럼나이 색인화
    if (Array.isArray(person.careers)) {
      const seen = new Set<string>();
      for (const career of person.careers) {
        const cleanCareer = cleanCompanyName(career.companyName);
        if (cleanCareer && !seen.has(cleanCareer)) {
          seen.add(cleanCareer);
          const list = alumniMap.get(cleanCareer) || [];
          list.push(person.id);
          alumniMap.set(cleanCareer, list);
        }
      }
    }
  }

  return {
    companyMap,
    alumniMap,
    allCompanyKeys: Array.from(companyMap.keys()),
    allAlumniKeys: Array.from(alumniMap.keys())
  };
}

/**
 * 사전 색인을 활용한 O(1) 고속 허브 지수 & 영향력 계산 함수
 */
export function calculatePersonPowerMetricIndexed(
  target: Person,
  index: NetworkGraphIndex
): PersonPowerMetric {
  const isDart = target.sourceType === 'DART_FACT' || !!target.dartInfo?.isPublicDirector;
  const targetCleanCompany = cleanCompanyName(target.currentCompany);

  // 1. 사내 동료 인맥 고속 산출 (Map 조회 및 부분 문자열 매칭)
  const colleagueIds = new Set<string>();
  if (targetCleanCompany) {
    for (const compKey of index.allCompanyKeys) {
      if (compKey.includes(targetCleanCompany) || targetCleanCompany.includes(compKey)) {
        const ids = index.companyMap.get(compKey);
        if (ids) {
          for (const id of ids) {
            if (id !== target.id) {
              colleagueIds.add(id);
            }
          }
        }
      }
    }
  }

  // 2. 알럼나이(이전 경력) 겹침 수 고속 산출
  const alumniIds = new Set<string>();
  if (Array.isArray(target.careers)) {
    for (const career of target.careers) {
      const cleanCareer = cleanCompanyName(career.companyName);
      if (cleanCareer) {
        const ids = index.alumniMap.get(cleanCareer);
        if (ids) {
          for (const id of ids) {
            if (id !== target.id) {
              alumniIds.add(id);
            }
          }
        }
      }
    }
  }

  // 3. 점수 계산 (Fact-Grounded Weighting)
  let score = 30; // 기본 점수

  // (A) DART 상장사 공시 임원 가중치 (+25점)
  if (isDart) score += 25;

  // (B) 사내 동료 인맥 풀 (+최대 20점)
  score += Math.min(20, colleagueIds.size * 4);

  // (C) 알럼나이 네트워크 도달 범위 (+최대 15점)
  score += Math.min(15, alumniIds.size * 3);

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
  if (colleagueIds.size > 0) {
    insights.push(`${target.currentCompany} 사내 인맥 ${colleagueIds.size}명과의 허브 노드 역할`);
  }
  if (alumniIds.size > 0) {
    insights.push(`출신 기업 알럼나이 ${alumniIds.size}명과 연결된 가교`);
  }
  if (target.closeness <= 2) {
    insights.push(`친밀도 1~2촌의 두터운 신뢰 관계 보유`);
  }

  return {
    person: target,
    powerScore: finalScore,
    tier,
    tierLabel,
    alumniReachCount: alumniIds.size,
    sameCompanyCount: colleagueIds.size,
    isDartPublicDirector: isDart,
    insights
  };
}

/**
 * 인맥 그래프 기반 허브 지수 & 영향력(Centrality & Power Score) 계산 엔진
 * (기존 단일 대상 호출 호환성 유지)
 */
export function calculatePersonPowerMetric(
  target: Person,
  allPeople: Person[]
): PersonPowerMetric {
  const index = buildNetworkGraphIndex(allPeople);
  return calculatePersonPowerMetricIndexed(target, index);
}

// 인메모리 캐시 레이어 (메모이제이션)
let cachedPeopleRef: Person[] | null = null;
let cachedTopMetrics: PersonPowerMetric[] | null = null;

export function clearCentralityCache(): void {
  cachedPeopleRef = null;
  cachedTopMetrics = null;
}

/**
 * 전체 인맥 중 상위 슈퍼 커넥터(Super Connector) 랭킹 산출
 * O(N) 단일 패스 색인 구축으로 대규모 인맥에서도 즉시 연산 완료
 */
export function getTopSuperConnectors(
  people: Person[],
  limit: number = 5
): PersonPowerMetric[] {
  if (!people || people.length === 0) return [];

  // 캐시 적중 여부 확인
  if (cachedPeopleRef === people && cachedTopMetrics) {
    return cachedTopMetrics.slice(0, limit);
  }

  const index = buildNetworkGraphIndex(people);
  const metrics = people
    .map(p => calculatePersonPowerMetricIndexed(p, index))
    .sort((a, b) => b.powerScore - a.powerScore);

  cachedPeopleRef = people;
  cachedTopMetrics = metrics;

  return metrics.slice(0, limit);
}

/**
 * 대규모 인맥 대상 메인 UI 스레드 멈춤 없는 비동기 청킹 연산 함수
 * 브라우저 렌더링 프레임을 양보(yield)하며 진행
 */
export async function getTopSuperConnectorsAsync(
  people: Person[],
  limit: number = 5,
  chunkSize: number = 100
): Promise<PersonPowerMetric[]> {
  if (!people || people.length === 0) return [];

  if (cachedPeopleRef === people && cachedTopMetrics) {
    return cachedTopMetrics.slice(0, limit);
  }

  const index = buildNetworkGraphIndex(people);
  const metrics: PersonPowerMetric[] = [];

  for (let i = 0; i < people.length; i += chunkSize) {
    const chunk = people.slice(i, i + chunkSize);
    for (const p of chunk) {
      metrics.push(calculatePersonPowerMetricIndexed(p, index));
    }
    // 청크 처리 후 마이크로태스크/이벤트 루프에 제어권 양보
    if (i + chunkSize < people.length) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  metrics.sort((a, b) => b.powerScore - a.powerScore);
  cachedPeopleRef = people;
  cachedTopMetrics = metrics;

  return metrics.slice(0, limit);
}
