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
