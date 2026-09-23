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
 * HRCO로부터 단계별 리워드 정산 이벤트 수신 리스너
 */
export function checkRewardMilestoneEvents(): any[] {
  try {
    const raw = localStorage.getItem(CONNECTWE_REWARD_EVENTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
