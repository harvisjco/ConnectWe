/**
 * ConnectWe Corporate Governance & Meeting Guard Studio Types
 * 이사회 거버넌스 팩트체크, 핵심 인재 큐레이터, 오프라인 CRDT 동기화, 미팅 가드 & 팔로업
 */

import { Person } from './network';

// ==========================================
// 1. 이사회 거버넌스 & 주총 의결권 인텔리전스
// ==========================================

export interface OutsideDirectorMandate {
  personId: string;
  personName: string;
  currentCompany: string;
  currentTitle: string;
  activeDirectorships: {
    corpName: string;
    stockCode: string;
    isListed: boolean;
    role: string; // 예: 사외이사, 감사위원, 비상무이사
    appointmentDate: string;
    termEndDate: string;
  }[];
  regulatoryLimitStatus: 'COMPLIANT' | 'WARNING_MAX_LIMIT' | 'VIOLATION_OVER_LIMIT';
  conflictRiskNote?: string;
}

export interface ProxyVotingAgendaItem {
  id: string;
  corpName: string;
  stockCode: string;
  agendaCategory: 'director_appointment' | 'auditor_election' | 'amendment_articles' | 'remuneration_limit';
  agendaTitle: string;
  keyIssues: string;
  governanceRecommendation: 'APPROVE' | 'CAUTION' | 'AGAINST';
  rationaleSummary: string;
  dartReferenceUrl?: string;
}

export interface EquityHoldingChangeAlert {
  id: string;
  personName: string;
  corpName: string;
  changeType: 'BUY' | 'SELL' | 'EXERCISE_OPTION';
  sharesChanged: number;
  remainingShares: number;
  percentageHolding: number;
  filingDate: string;
  summaryNote: string;
}

// ==========================================
// 2. 글로벌 핵심 인재 스카우팅 & 탤런트 풀 큐레이터
// ==========================================

export type ExecutiveTalentTrack = 'CTO' | 'CPO' | 'CFO' | 'AI_LAB_LEAD';

export interface ExecutiveTalentCandidate {
  person: Person;
  targetTrack: ExecutiveTalentTrack;
  trackLabel: string;
  readinessLevel: 'READY_NOW' | 'READY_IN_1YR' | 'STRATEGIC_WATCH';
  peerEndorsementCount: number;
  verifiedProductionSuccess: string;
  coreDomainSynergy: string;
  confidentialCoffeeInvite: string;
}

// ==========================================
// 3. 초고속 오프라인 우선 PWA & IndexedDB CRDT 동기화
// ==========================================

export interface OfflineSyncStatus {
  isOnline: boolean;
  offlineQueueCount: number;
  lastSyncedTimestamp: string;
  crdtMergedCount: number;
  vaultIntegrityStatus: 'SECURE' | 'PENDING_SYNC' | 'RECONCILED';
  cachedProfilesCount: number;
}

export interface OfflineActionRecord {
  id: string;
  actionType: 'UPDATE_MEMO' | 'CREATE_SHOWCASE' | 'LOG_MEETING' | 'SAVE_COMMITMENT';
  targetId: string;
  timestamp: string;
  isSynced: boolean;
  summary: string;
}

// ==========================================
// 4. 미팅 가드 & 스마트 팔로업 스튜디오
// ==========================================

export interface MeetingReminderBrief {
  personId: string;
  personName: string;
  personCompany: string;
  scheduledTime: string;
  meetingLocation: string;
  reminders: {
    hours24Before: string; // 24시간 전 리마인더 문안
    hours2Before: string;  // 2시간 전 리마인더 문안
  };
}

export interface MeetingFollowUpBrief {
  id: string;
  personId: string;
  personName: string;
  meetingDate: string;
  discussionSummary: string;
  thankYouLetterDraft: string;
  commitments: MeetingCommitmentItem[];
}

export interface MeetingCommitmentItem {
  id: string;
  text: string;
  deadline: string;
  assignee: 'ME' | 'PARTNER';
  isCompleted: boolean;
}
