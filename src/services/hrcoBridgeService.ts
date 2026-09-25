import { ReferralPosition, ReferralSubmission } from '../types/network';
import { mockReferralPositions } from '../data/mockReferralPositions';

const CONNECTWE_FEED_KEY = 'connectwe_shared_positions_feed_v1';
const CONNECTWE_REFERRAL_INBOX_KEY = 'connectwe_referrals_inbox_v1';
const CONNECTWE_REWARD_EVENTS_KEY = 'connectwe_reward_sync_events_v1';

export interface ConnectWeReferralPayload {
  submissionId: string;
  positionId: string;
  referrerName: string;
  candidateName: string;
  candidateCurrentTitle: string;
  candidateCurrentCompany: string;
  matchScore: number;
  matchReasons: string[];
  recommendationLetter: string;
  submittedAt: string;
}

export interface RewardMilestoneSyncEvent {
  id: string;
  submissionId: string;
  candidateName: string;
  clientCompany: string;
  positionTitle: string;
  milestone: 'coffee_chat' | 'interview_pass' | 'final_hire';
  milestoneLabel: string;
  rewardAmount: number;
  status: 'CONFIRMED' | 'PAID';
  syncedAt: string;
  message: string;
}

/**
 * HRCO GoodPartner ERP 브릿지로부터 실시간 오픈 포지션 피드 수신
 */
export function fetchPositionsFromHrcoBridge(): { positions: ReferralPosition[]; isLiveFromHrco: boolean } {
  try {
    const raw = localStorage.getItem(CONNECTWE_FEED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { positions: parsed, isLiveFromHrco: true };
      }
    }
  } catch (err) {
    console.warn('Failed to read live feed from HRCO, falling back to mock positions:', err);
  }

  // 폴백: 기본 모의 포지션
  return { positions: mockReferralPositions, isLiveFromHrco: false };
}

/**
 * ConnectWe에서 추천된 지인 프로필을 HRCO 채용 파이프라인 수신함으로 전송
 */
export function submitReferralToHrcoBridge(
  submission: ReferralSubmission,
  matchReasons: string[] = ['신뢰 1촌 네트워크 매칭'],
  matchScore: number = 95
): boolean {
  try {
    const payload: ConnectWeReferralPayload = {
      submissionId: submission.id,
      positionId: submission.positionId,
      referrerName: '나 (ConnectWe 마스터)',
      candidateName: submission.candidateName,
      candidateCurrentTitle: submission.candidateTitle,
      candidateCurrentCompany: submission.candidateCompany,
      matchScore,
      matchReasons,
      recommendationLetter: submission.recommendationNote,
      submittedAt: submission.submittedAt
    };

    const raw = localStorage.getItem(CONNECTWE_REFERRAL_INBOX_KEY);
    const inbox: ConnectWeReferralPayload[] = raw ? JSON.parse(raw) : [];
    
    // 중복 방지
    const filtered = inbox.filter(item => item.submissionId !== payload.submissionId);
    filtered.unshift(payload);
    localStorage.setItem(CONNECTWE_REFERRAL_INBOX_KEY, JSON.stringify(filtered));

    // 브라우저 탭 간 IPC 브로드캐스트
    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('hrco_connectwe_bus');
      channel.postMessage({ type: 'REFERRAL_SUBMITTED', payload });
      channel.close();
    }

    return true;
  } catch (err) {
    console.error('Failed to submit referral to HRCO bridge:', err);
    return false;
  }
}

/**
 * HRCO와 ConnectWe 간 상이한 이벤트 포맷을 단일 정규화 포맷으로 변환하는 어댑터
 */
export function normalizeRewardEvent(raw: any): RewardMilestoneSyncEvent {
  if (raw.milestone && raw.rewardAmount) {
    return raw as RewardMilestoneSyncEvent;
  }
  // HRCO 포맷(stage, amount, timestamp, note) 대응
  const stageToMilestone: Record<string, { milestone: 'coffee_chat' | 'interview_pass' | 'final_hire'; label: string }> = {
    coffee_chat_approved: { milestone: 'coffee_chat', label: '커피챗 수락' },
    coffee_chat_pending: { milestone: 'coffee_chat', label: '커피챗 검토' },
    interview_scheduled: { milestone: 'interview_pass', label: '인터뷰 진행' },
    hire_placed: { milestone: 'final_hire', label: '최종 합격' },
    probation_cleared: { milestone: 'final_hire', label: '수습 통과' }
  };
  const mapped = stageToMilestone[raw.stage] || { milestone: 'coffee_chat', label: raw.stage || '단계 갱신' };
  return {
    id: raw.id || `rwd-${Date.now()}`,
    submissionId: raw.submissionId || '',
    candidateName: raw.candidateName || '후보자',
    clientCompany: raw.clientCompany || '채용 의뢰사',
    positionTitle: raw.positionTitle || '지정 포지션',
    milestone: mapped.milestone,
    milestoneLabel: mapped.label,
    rewardAmount: raw.amount || raw.rewardAmount || 0,
    status: 'CONFIRMED',
    syncedAt: (raw.timestamp || raw.syncedAt || new Date().toISOString()).slice(0, 10),
    message: raw.note || raw.message || `[HRCO 채용 전형] ${raw.candidateName} 님 채용 전형 업데이트`
  };
}

/**
 * HRCO로부터 단계별 리워드 정산 이벤트 목록 조회
 */
export function checkRewardMilestoneEvents(): RewardMilestoneSyncEvent[] {
  try {
    const raw = localStorage.getItem(CONNECTWE_REWARD_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(normalizeRewardEvent) : [];
  } catch {
    return [];
  }
}

/**
 * HRCO 리워드 이벤트 신규 저장 및 브로드캐스트
 */
export function recordRewardMilestoneEvent(event: RewardMilestoneSyncEvent): void {
  try {
    const events = checkRewardMilestoneEvents();
    events.unshift(event);
    localStorage.setItem(CONNECTWE_REWARD_EVENTS_KEY, JSON.stringify(events));

    if (typeof BroadcastChannel !== 'undefined') {
      const channel = new BroadcastChannel('hrco_connectwe_bus');
      // ConnectWe 및 HRCO 상호 호환을 위해 양대 채널 규격 브로드캐스트
      channel.postMessage({ type: 'REWARD_SYNC', event });
      channel.postMessage({ type: 'REWARD_MILESTONE_UPDATED', event });
      channel.close();
    }
  } catch (err) {
    console.error('Failed to record reward event:', err);
  }
}

/**
 * HRCO 채용 단계 진척 시뮬레이션 (ConnectWe 테스트 및 시연용)
 */
export function simulateHrcoMilestoneProgress(
  submission: ReferralSubmission,
  milestone: 'coffee_chat' | 'interview_pass' | 'final_hire'
): RewardMilestoneSyncEvent {
  const milestoneMap = {
    coffee_chat: {
      label: '커피챗 수락 완료',
      amount: 50000,
      nextStatus: 'coffee_chat_accepted' as const,
      msg: `[${submission.candidateName}] 님이 커피챗을 수락했습니다! 커피챗 리워드 50,000원이 확정 적립되었습니다.`
    },
    interview_pass: {
      label: '1차 인터뷰 합격',
      amount: 200000,
      nextStatus: 'interviewing' as const,
      msg: `[${submission.candidateName}] 님이 ${submission.clientCompany} 1차 면접에 합격했습니다! 면접 패스 리워드 200,000원이 확정 적립되었습니다.`
    },
    final_hire: {
      label: '최종 합격 및 입사 확정',
      amount: 5000000,
      nextStatus: 'hired_placed' as const,
      msg: `[${submission.candidateName}] 님이 ${submission.clientCompany} 최종 입사를 확정했습니다! 헤드헌팅 최종 바운티 5,000,000원이 확정 지급되었습니다!`
    }
  };

  const meta = milestoneMap[milestone];
  const newEvent: RewardMilestoneSyncEvent = {
    id: `rwd-${Date.now()}`,
    submissionId: submission.id,
    candidateName: submission.candidateName,
    clientCompany: submission.clientCompany,
    positionTitle: submission.positionTitle,
    milestone,
    milestoneLabel: meta.label,
    rewardAmount: meta.amount,
    status: 'CONFIRMED',
    syncedAt: new Date().toISOString().slice(0, 10),
    message: meta.msg
  };

  recordRewardMilestoneEvent(newEvent);

  // 로컬 submissions 상태도 갱신
  try {
    const raw = localStorage.getItem('connectwe_referral_submissions');
    if (raw) {
      const list: ReferralSubmission[] = JSON.parse(raw);
      const target = list.find(s => s.id === submission.id);
      if (target) {
        target.status = meta.nextStatus;
        target.updatedAt = new Date().toISOString().slice(0, 10);
        if (milestone === 'coffee_chat') target.earnedRewards.coffeeChatPaid = true;
        if (milestone === 'interview_pass') target.earnedRewards.interviewPaid = true;
        if (milestone === 'final_hire') target.earnedRewards.hirePaid = true;
        target.earnedRewards.totalAmount = (target.earnedRewards.totalAmount || 0) + meta.amount;
        localStorage.setItem('connectwe_referral_submissions', JSON.stringify(list));
      }
    }
  } catch (e) {
    console.warn('Failed to update submission status:', e);
  }

  return newEvent;
}
