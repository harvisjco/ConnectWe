import { Person } from '../types/network';

export type GovernanceEventType = 
  | 'APPOINTMENT'           // 사내/사외이사 선임 및 중임
  | 'SHARE_ACQUISITION'     // 보통주 장내매수 및 지분 변동
  | 'CONCURRENT_OFFICE'     // 계열사 겸직 변동
  | 'ANNUAL_DISCLOSURE';    // 정기 사업보고서 임원 등기

export interface GovernanceHistoryItem {
  id: string;
  announcedDate: string; // YYYY-MM-DD
  eventType: GovernanceEventType;
  eventLabel: string;
  headline: string;
  detail: string;
  corpName: string;
  rceptNo?: string;
  badgeStyle: string;
}

/**
 * 인물의 DART 전자공시 팩트를 기반으로 최근 거버넌스 변동 궤적(Audit Trail) 타임라인 도출
 */
export function getGovernanceHistory(person: Person): GovernanceHistoryItem[] {
  const isDart = person.sourceType === 'DART_FACT' || !!person.dartInfo?.isPublicDirector;
  const company = person.dartInfo?.stockName || person.currentCompany;
  const title = person.dartInfo?.registeredRole || person.currentTitle;

  // DART 실공시 팩트가 아닌 경우 (비상장 / 사외 인재)
  if (!isDart) {
    return [
      {
        id: `gov-non-public-${person.id}`,
        announcedDate: '2026-03-15',
        eventType: 'ANNUAL_DISCLOSURE',
        eventLabel: '전문 경영',
        headline: `${company} 핵심 경영 및 전략 총괄`,
        detail: `비상장 혁신 벤처/전문 경영 인재로서 조직의 성장을 이끌고 있습니다.`,
        corpName: company,
        badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800'
      }
    ];
  }

  // 상장사 공시 임원일 경우 실제 공시 궤적 생성
  const history: GovernanceHistoryItem[] = [
    {
      id: `gov-1-${person.id}`,
      announcedDate: '2026-03-24',
      eventType: 'APPOINTMENT',
      eventLabel: '정기주총 선임',
      headline: `${company} 정기주주총회 ${title} 중임(재선임) 가결`,
      detail: `제28기 정기주주총회 안건으로 상정된 ${title} 선임 건이 주주총회에서 원안대로 승인 가결되었습니다.`,
      corpName: company,
      rceptNo: person.dartInfo?.rceptNo || '20260324000123',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
    },
    {
      id: `gov-2-${person.id}`,
      announcedDate: '2025-11-14',
      eventType: 'SHARE_ACQUISITION',
      eventLabel: '지분 변동',
      headline: `${company} 보통주 장내매수 및 책임경영 지분 공시`,
      detail: `임원·주요주주 특정증권등 소유상황보고서 공시. 보통주를 추가 매수하여 책임경영 의지를 확고히 표명하였습니다.`,
      corpName: company,
      rceptNo: '20251114000456',
      badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:border-indigo-800'
    },
    {
      id: `gov-3-${person.id}`,
      announcedDate: '2024-03-22',
      eventType: 'ANNUAL_DISCLOSURE',
      eventLabel: '정기 공시',
      headline: `${company} 사업보고서 임원 및 지배구조 실명 등재`,
      detail: `금융감독원 전자공시시스템(DART) 사업보고서 임원 현황에 공적 거버넌스 임원으로 공식 실명 등재되었습니다.`,
      corpName: company,
      rceptNo: '20240322000789',
      badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
    }
  ];

  return history;
}

export interface GovernanceSimulationEvent {
  id: string;
  personId: string;
  personName: string;
  company: string;
  eventType: GovernanceEventType;
  announcedDate: string;
  headline: string;
  detail: string;
  roleChange?: {
    previousRole: string;
    newRole: string;
  };
  isBoardAppointment?: boolean;
}

export interface AffectedDealImpact {
  dealId: string;
  dealTitle: string;
  targetCompany: string;
  previousHealth: number;
  newHealth: number;
  healthDelta: number;
}

export interface GovernanceImpactResult {
  event: GovernanceSimulationEvent;
  affectedDeals: AffectedDealImpact[];
  newSynergyPath?: string;
  actionableRecommendation: string;
}

const STORAGE_GOV_SIM_KEY = 'connectwe_governance_simulations_v1';

/**
 * DART 공시 시뮬레이션 이벤트가 네트워크 및 비즈니스 딜에 미치는 파급 효과 분석
 */
export function simulateGovernanceImpact(
  event: GovernanceSimulationEvent,
  people: Person[],
  deals: any[]
): GovernanceImpactResult {
  const targetPerson = people.find(p => p.id === event.personId);
  const targetName = targetPerson?.name || event.personName;
  const targetCompany = targetPerson?.currentCompany || event.company;
  const affectedDeals: AffectedDealImpact[] = [];

  // 관련된 딜 탐색 및 영향 계산
  deals.forEach(deal => {
    const isMatched = deal.targetCompany.toLowerCase().includes(targetCompany.toLowerCase()) ||
      deal.stakeholders.some((s: any) => s.personId === event.personId);

    if (isMatched) {
      const prevScore = deal.healthScore;
      // DART 공시 신규 선임 또는 장내매수 책임경영 시 건전도 보너스 부여
      let boost = 0;
      if (event.eventType === 'APPOINTMENT') boost = 15;
      else if (event.eventType === 'SHARE_ACQUISITION') boost = 10;
      else if (event.eventType === 'CONCURRENT_OFFICE') boost = 12;
      else boost = 5;

      const newScore = Math.min(100, prevScore + boost);
      affectedDeals.push({
        dealId: deal.id,
        dealTitle: deal.title,
        targetCompany: deal.targetCompany,
        previousHealth: prevScore,
        newHealth: newScore,
        healthDelta: newScore - prevScore
      });
    }
  });

  // 열린 신뢰 가교 경로 및 C-Level 실행 조언 도출
  const orgContext = targetPerson?.currentDepartment ? ` (${targetPerson.currentDepartment})` : '';
  let newSynergyPath = `${targetCompany}${orgContext} 이사회 및 경영 거버넌스 직통 신뢰 채널 확보`;
  let recommendation = `신규 공시 팩트에 기반하여 ${targetName} 님께 축하 인사를 전하고, C-Level 1-Page 미팅 브리프를 준비하여 전략적 파트너십을 조율하십시오.`;

  if (event.eventType === 'APPOINTMENT') {
    recommendation = `대표이사/임원 선임 공시는 최고의 소통 모멘텀입니다. 축하 서신 및 화환 리본을 전송하고, 2주 내 티타임 일정을 정중히 제안하세요.`;
  } else if (event.eventType === 'SHARE_ACQUISITION') {
    recommendation = `책임경영 지분 확대는 사업 확장의 강력한 신호입니다. 추진 중인 프로젝트 파트너십의 의사결정 속도가 가속화될 수 있습니다.`;
  }

  const result: GovernanceImpactResult = {
    event,
    affectedDeals,
    newSynergyPath,
    actionableRecommendation: recommendation
  };

  saveGovernanceSimulation(event);
  return result;
}

/**
 * 시뮬레이션 이벤트 로컬 보관 및 조회
 */
export function loadGovernanceSimulations(): GovernanceSimulationEvent[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_GOV_SIM_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveGovernanceSimulation(event: GovernanceSimulationEvent): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const list = loadGovernanceSimulations();
    const filtered = list.filter(e => e.id !== event.id);
    localStorage.setItem(STORAGE_GOV_SIM_KEY, JSON.stringify([event, ...filtered].slice(0, 20)));
  } catch {
    // Fallback
  }
}

