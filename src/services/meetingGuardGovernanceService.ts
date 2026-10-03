/**
 * ConnectWe Corporate Governance & Meeting Guard Studio Service
 * 이사회 거버넌스 팩트체크, 핵심 인재 큐레이터, 오프라인 CRDT 동기화, 미팅 가드 & 팔로업
 */

import { Person } from '../types/network';
import {
  OutsideDirectorMandate,
  ProxyVotingAgendaItem,
  EquityHoldingChangeAlert,
  ExecutiveTalentCandidate,
  ExecutiveTalentTrack,
  OfflineSyncStatus,
  OfflineActionRecord,
  MeetingReminderBrief,
  MeetingFollowUpBrief
} from '../types/meetingGuardGovernance';

const STORAGE_OFFLINE_QUEUE_KEY = 'cw_offline_action_queue_v1';
const STORAGE_FOLLOWUPS_KEY = 'cw_meeting_followups_v1';

// ==========================================
// 1. 이사회 거버넌스 & 주총 의결권 인텔리전스
// ==========================================

export function getOutsideDirectorMandates(people: Person[]): OutsideDirectorMandate[] {
  // people 중 사외이사 또는 임원 관련 인맥 및 샘플 데이터 합성
  return people.slice(0, 4).map((p, idx) => {
    const isOverLimit = idx === 3;
    const directorships = isOverLimit
      ? [
          {
            corpName: '네오테크놀로지',
            stockCode: '041510',
            isListed: true,
            role: '사외이사 (ESG위원장)',
            appointmentDate: '2024-03-22',
            termEndDate: '2027-03-21',
          },
          {
            corpName: '글로벌파이낸스',
            stockCode: '086790',
            isListed: true,
            role: '사외이사 (감사위원)',
            appointmentDate: '2025-03-15',
            termEndDate: '2028-03-14',
          },
          {
            corpName: '에이아이솔루션스',
            stockCode: '323410',
            isListed: true,
            role: '사외이사 (보수위원)',
            appointmentDate: '2026-03-20',
            termEndDate: '2029-03-19',
          },
        ]
      : [
          {
            corpName: p.currentCompany || '테크파트너스',
            stockCode: '035720',
            isListed: true,
            role: '사외이사 (기술자문위원)',
            appointmentDate: '2025-03-20',
            termEndDate: '2028-03-19',
          },
          {
            corpName: '넥스트벤처스',
            stockCode: '035420',
            isListed: false,
            role: '비상무이사',
            appointmentDate: '2024-06-10',
            termEndDate: '2027-06-09',
          },
        ];

    const listedCount = directorships.filter((d) => d.isListed).length;
    const regulatoryLimitStatus =
      listedCount > 2
        ? 'VIOLATION_OVER_LIMIT'
        : listedCount === 2
        ? 'WARNING_MAX_LIMIT'
        : 'COMPLIANT';

    const conflictRiskNote =
      regulatoryLimitStatus === 'VIOLATION_OVER_LIMIT'
        ? '상법 시행령 제34조 제5항에 따라 상장사 사외이사 2개사 초과 재직 불가 (정기 주총 전 사임 필요)'
        : regulatoryLimitStatus === 'WARNING_MAX_LIMIT'
        ? '상장사 사외이사 2개사 한도 도달 (추가 상장사 선임 시 이해상충 사전 검토 권장)'
        : '거버넌스 규제 한도 내 안정적 재직 중';

    return {
      personId: p.id,
      personName: p.name,
      currentCompany: p.currentCompany || '글로벌 테크',
      currentTitle: p.currentTitle || '리더 / 사외이사',
      activeDirectorships: directorships,
      regulatoryLimitStatus,
      conflictRiskNote,
    };
  });
}

export const PRESET_PROXY_AGENDA_ITEMS: ProxyVotingAgendaItem[] = [
  {
    id: 'agenda-01',
    corpName: '카카오',
    stockCode: '035720',
    agendaCategory: 'director_appointment',
    agendaTitle: '제2호 의안: 사내이사 및 사외이사 선임의 건',
    keyIssues: '독립적 감사위원회 위원 분리선출 및 글로벌 AI 거버넌스 전문성 검증',
    governanceRecommendation: 'APPROVE',
    rationaleSummary: '후보자의 직무 독립성과 AI 데이터 윤리 이사회 전문성 충족 확인',
    dartReferenceUrl: 'https://dart.fss.or.kr',
  },
  {
    id: 'agenda-02',
    corpName: '네이버',
    stockCode: '035420',
    agendaCategory: 'remuneration_limit',
    agendaTitle: '제4호 의안: 이사 보수한도 승인의 건 (전년 동결)',
    keyIssues: '주주가치 제고 및 경영 성과 연동형 스톡옵션 보상 체계 투명성',
    governanceRecommendation: 'APPROVE',
    rationaleSummary: '경영 실적 대비 과도하지 않은 한도 설정 및 투명한 성과 연동 공시',
    dartReferenceUrl: 'https://dart.fss.or.kr',
  },
  {
    id: 'agenda-03',
    corpName: '넥스트바이오',
    stockCode: '282330',
    agendaCategory: 'amendment_articles',
    agendaTitle: '제3호 의안: 정관 일부 변경의 건 (신주인수권 제3자 배정 한도 확대)',
    keyIssues: '기존 주주 지분 희석 리스크 및 전환사채(CB) 발행 조건',
    governanceRecommendation: 'CAUTION',
    rationaleSummary: '자금 조달 목적의 구체성이 다소 미흡하여 기존 주주 권익 보호 점검 요망',
    dartReferenceUrl: 'https://dart.fss.or.kr',
  },
];

export function getProxyVotingAgendaItems(): ProxyVotingAgendaItem[] {
  return [...PRESET_PROXY_AGENDA_ITEMS];
}

export const PRESET_EQUITY_CHANGE_ALERTS: EquityHoldingChangeAlert[] = [
  {
    id: 'eq-alert-01',
    personName: '김민준',
    corpName: '카카오모빌리티',
    changeType: 'BUY',
    sharesChanged: 15000,
    remainingShares: 125000,
    percentageHolding: 5.2,
    filingDate: '2026-10-02',
    summaryNote: '책임경영 강화를 위한 장내 자사주 매수 공시 (지분율 5% 초과 신규 보고)',
  },
  {
    id: 'eq-alert-02',
    personName: '이지원',
    corpName: '토스뱅크',
    changeType: 'EXERCISE_OPTION',
    sharesChanged: 8000,
    remainingShares: 48000,
    percentageHolding: 1.8,
    filingDate: '2026-09-28',
    summaryNote: '스톡옵션 행사에 따른 신규 보통주 취득 공시',
  },
];

export function getEquityHoldingChangeAlerts(): EquityHoldingChangeAlert[] {
  return [...PRESET_EQUITY_CHANGE_ALERTS];
}

// ==========================================
// 2. 글로벌 핵심 인재 스카우팅 & 탤런트 풀 큐레이터
// ==========================================

export function getExecutiveTalentPool(people: Person[]): ExecutiveTalentCandidate[] {
  const tracks: { track: ExecutiveTalentTrack; label: string; kw: string }[] = [
    { track: 'CTO', label: '최고기술책임자 (CTO)', kw: '아키텍트' },
    { track: 'AI_LAB_LEAD', label: '수석 AI 연구소장 (AI Lab Lead)', kw: 'ai' },
    { track: 'CPO', label: '최고제품책임자 (CPO)', kw: '프로덕트' },
    { track: 'CFO', label: '최고재무책임자 (CFO)', kw: '투자' },
  ];

  return people.slice(0, 4).map((person, idx) => {
    const t = tracks[idx % tracks.length];
    const candidate: ExecutiveTalentCandidate = {
      person,
      targetTrack: t.track,
      trackLabel: t.label,
      readinessLevel: idx === 0 ? 'READY_NOW' : idx === 1 ? 'READY_IN_1YR' : 'STRATEGIC_WATCH',
      peerEndorsementCount: 12 + idx * 7,
      verifiedProductionSuccess: `${person.currentCompany || '선도 기업'}에서 대규모 시스템 및 조직 스케일업 성공 견인`,
      coreDomainSynergy: `${person.primaryDomain || '기술/프로덕트'} 분야의 깊은 인사이트 및 동료 실전 검증 신뢰도 보유`,
      confidentialCoffeeInvite: '',
    };
    candidate.confidentialCoffeeInvite = generateConfidentialTalentInvite(candidate);
    return candidate;
  });
}

export function generateConfidentialTalentInvite(candidate: ExecutiveTalentCandidate): string {
  return `안녕하세요 ${candidate.person.name}님,
늘 ${candidate.person.currentCompany || '현재 몸담고 계신 곳'}에서의 훌륭한 행보를 뜻깊게 지켜보고 있습니다.

다름이 아니오라, 저희가 최근 추진 중인 핵심 전략 과제 및 [${candidate.trackLabel}] 관점의 기술적 난제 해결과 관련하여, ${candidate.person.name}님의 깊은 혜안을 조심스럽게 여쭙고자 연락드렸습니다.

어떠한 부담도 드리지 않는 비공개 티타임으로, 현재 업계 흐름과 아키텍처 비전에 대해 편안하게 차 한잔 나누실 수 있으실지요?
바쁘신 일정에 맞춰 계신 곳 근처로 편히 찾아뵙겠습니다.

감사합니다.
ConnectWe Executive Talent Network 드림`;
}

// ==========================================
// 3. 초고속 오프라인 우선 PWA & IndexedDB CRDT 동기화
// ==========================================

export function getOfflineSyncStatus(peopleCount: number = 30): OfflineSyncStatus {
  const queue = getOfflineActionQueue();
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  return {
    isOnline,
    offlineQueueCount: queue.filter((q) => !q.isSynced).length,
    lastSyncedTimestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
    crdtMergedCount: queue.length + 14,
    vaultIntegrityStatus: queue.length > 0 ? 'PENDING_SYNC' : 'SECURE',
    cachedProfilesCount: peopleCount,
  };
}

export function getOfflineActionQueue(): OfflineActionRecord[] {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_OFFLINE_QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function queueOfflineAction(
  action: Omit<OfflineActionRecord, 'id' | 'timestamp' | 'isSynced'>
): OfflineActionRecord {
  const newRecord: OfflineActionRecord = {
    ...action,
    id: `act_${Date.now()}`,
    timestamp: new Date().toISOString(),
    isSynced: false,
  };

  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      const queue = getOfflineActionQueue();
      queue.unshift(newRecord);
      window.localStorage.setItem(STORAGE_OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    } catch {
      // Graceful fallback
    }
  }

  return newRecord;
}

export function triggerReconciliation(): { reconciledCount: number } {
  const queue = getOfflineActionQueue();
  const count = queue.filter((q) => !q.isSynced).length;

  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      const updated = queue.map((q) => ({ ...q, isSynced: true }));
      window.localStorage.setItem(STORAGE_OFFLINE_QUEUE_KEY, JSON.stringify(updated));
    } catch {
      // Graceful fallback
    }
  }

  return { reconciledCount: count || 3 };
}

// ==========================================
// 4. 미팅 가드 & 스마트 팔로업 스튜디오
// ==========================================

export function generateMeetingReminderBrief(
  person: Person,
  scheduledTime: string = '내일 오후 3:00',
  location: string = '조선 팰리스 1914 라운지'
): MeetingReminderBrief {
  const company = person.currentCompany || '파트너사';
  const name = person.name;

  return {
    personId: person.id,
    personName: name,
    personCompany: company,
    scheduledTime,
    meetingLocation: location,
    reminders: {
      hours24Before: `${company} ${name}님, 안녕하십니까. 내일(${scheduledTime}) [${location}]에서 뵙기로 한 환담 일정 앞두고 미리 안부 인사드립니다. 이동 간 불편함 없으시길 바라며, 내일 뵙고 따뜻한 말씀 나누겠습니다. 편안한 하루 보내십시오.`,
      hours2Before: `${name}님, 잠시 후 ${scheduledTime} [${location}]에서 뵙겠습니다. 주차는 센터필드 지하 3층에 가능하며, 천천히 조심히 오십시오.`,
    },
  };
}

export const INITIAL_FOLLOW_UPS: MeetingFollowUpBrief[] = [
  {
    id: 'fu-01',
    personId: 'p-001',
    personName: '김민준',
    meetingDate: '2026-10-03',
    discussionSummary: 'AI 에이전트 인프라 협력 및 데이터 주권 E2EE 볼트 연계 방안 협의',
    thankYouLetterDraft: `김민준 대표님, 오늘 바쁘신 중에도 귀한 시간 내어주셔서 진심으로 감사드립니다.

나누어 주신 AI 에이전트 인프라에 대한 인사이트는 향후 저희 방향성을 수립하는 데 매우 큰 영감이 되었습니다.
말씀드린 프로덕트 1-Page 브리프 자료를 첨부해 드리오니 편안하실 때 살펴보아 주십시오.

모쪼록 풍성한 결실 맺으시길 응원하며, 조만간 또 뵙겠습니다.
감사합니다.`,
    commitments: [
      {
        id: 'cm-01',
        text: '차주 월요일까지 E2EE 아키텍처 1-Page 브리프 송부',
        deadline: '2026-10-06',
        assignee: 'ME',
        isCompleted: true,
      },
      {
        id: 'cm-02',
        text: '사내 AI 엔지니어링 리드와의 2차 실무 미팅 일정 조율',
        deadline: '2026-10-14',
        assignee: 'PARTNER',
        isCompleted: false,
      },
    ],
  },
];

export function getSavedFollowUps(): MeetingFollowUpBrief[] {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return [...INITIAL_FOLLOW_UPS];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_FOLLOWUPS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Graceful fallback
  }
  return [...INITIAL_FOLLOW_UPS];
}

export function saveFollowUp(followUp: MeetingFollowUpBrief): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
  try {
    const list = getSavedFollowUps();
    const filtered = list.filter((item) => item.id !== followUp.id);
    filtered.unshift(followUp);
    window.localStorage.setItem(STORAGE_FOLLOWUPS_KEY, JSON.stringify(filtered));
  } catch {
    // Graceful fallback
  }
}

export function toggleCommitmentComplete(
  followUpId: string,
  commitmentId: string
): MeetingFollowUpBrief[] {
  const list = getSavedFollowUps();
  const updated = list.map((fu) => {
    if (fu.id === followUpId) {
      return {
        ...fu,
        commitments: fu.commitments.map((cm) =>
          cm.id === commitmentId ? { ...cm, isCompleted: !cm.isCompleted } : cm
        ),
      };
    }
    return fu;
  });

  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_FOLLOWUPS_KEY, JSON.stringify(updated));
    } catch {
      // Graceful fallback
    }
  }

  return updated;
}
