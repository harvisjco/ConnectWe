import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getOutsideDirectorMandates,
  getProxyVotingAgendaItems,
  getEquityHoldingChangeAlerts,
  getExecutiveTalentPool,
  generateConfidentialTalentInvite,
  getOfflineSyncStatus,
  queueOfflineAction,
  triggerReconciliation,
  generateMeetingReminderBrief,
  getSavedFollowUps,
  saveFollowUp,
  toggleCommitmentComplete,
} from '../meetingGuardGovernanceService';
import { Person } from '../../types/network';

class MockStorage implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  clear() { this.store = {}; }
  getItem(key: string) { return this.store[key] || null; }
  key(index: number) { return Object.keys(this.store)[index] || null; }
  removeItem(key: string) { delete this.store[key]; }
  setItem(key: string, value: string) { this.store[key] = String(value); }
}

const MOCK_PEOPLE: Person[] = [
  {
    id: 'p-001',
    name: '김민준',
    currentCompany: '토스',
    currentTitle: '프론트엔드 리드',
    closeness: 2,
    primaryDomain: '기술/프로덕트',
  } as unknown as Person,
  {
    id: 'p-002',
    name: '이지원',
    currentCompany: '카카오모빌리티',
    currentTitle: '최고기술책임자',
    closeness: 1,
    primaryDomain: 'AI/LLM',
  } as unknown as Person,
];

describe('Corporate Governance & Meeting Guard Studio Service', () => {
  beforeEach(() => {
    const mockStorage = new MockStorage();
    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', { localStorage: mockStorage });
  });

  describe('1. 이사회 거버넌스 & 주총 의결권 인텔리전스', () => {
    it('사외이사 겸직 규제 한도를 판정하고 규제 상태를 정확히 도출해야 한다', () => {
      const mandates = getOutsideDirectorMandates(MOCK_PEOPLE);
      expect(mandates.length).toBeGreaterThan(0);
      expect(mandates[0].regulatoryLimitStatus).toBeDefined();
      expect(mandates[0].activeDirectorships.length).toBeGreaterThan(0);
    });

    it('주총 안건 3대 카테고리와 의결권 권고(APPROVE, CAUTION 등)를 제공해야 한다', () => {
      const agendas = getProxyVotingAgendaItems();
      expect(agendas.length).toBeGreaterThanOrEqual(3);
      expect(agendas[0].governanceRecommendation).toBeDefined();
      expect(agendas[0].keyIssues).toBeDefined();
    });

    it('5% 이상 대주주 및 임원 지분 변동 공시 알림을 제공해야 한다', () => {
      const alerts = getEquityHoldingChangeAlerts();
      expect(alerts.length).toBeGreaterThanOrEqual(2);
      expect(alerts[0].sharesChanged).toBeGreaterThan(0);
      expect(alerts[0].summaryNote).toBeDefined();
    });
  });

  describe('2. 글로벌 핵심 인재 스카우팅 & 탤런트 풀 큐레이터', () => {
    it('C-Level 트랙(CTO, AI Lab Lead 등) 후보자를 큐레이션해야 한다', () => {
      const pool = getExecutiveTalentPool(MOCK_PEOPLE);
      expect(pool.length).toBe(2);
      expect(['CTO', 'AI_LAB_LEAD']).toContain(pool[0].targetTrack);
      expect(pool[0].peerEndorsementCount).toBeGreaterThan(0);
      expect(pool[0].confidentialCoffeeInvite).toContain('비공개 티타임');
    });

    it('품격 있는 비공개 커피 환담 초대 서신을 합성해야 한다', () => {
      const pool = getExecutiveTalentPool(MOCK_PEOPLE);
      const letter = generateConfidentialTalentInvite(pool[0]);
      expect(letter).toContain(pool[0].person.name);
      expect(letter).toContain(pool[0].trackLabel);
      expect(letter).toContain('ConnectWe Executive Talent Network');
    });
  });

  describe('3. 초고속 오프라인 우선 PWA & IndexedDB CRDT 동기화', () => {
    it('오프라인 액션을 큐잉하고 상태를 확인할 수 있어야 한다', () => {
      const initialStatus = getOfflineSyncStatus(25);
      expect(initialStatus.cachedProfilesCount).toBe(25);

      const action = queueOfflineAction({
        actionType: 'UPDATE_MEMO',
        targetId: 'p-001',
        summary: '커피챗 후 선호 원두 메모 업데이트',
      });
      expect(action.id).toBeDefined();

      const updatedStatus = getOfflineSyncStatus(25);
      expect(updatedStatus.offlineQueueCount).toBe(1);

      const res = triggerReconciliation();
      expect(res.reconciledCount).toBe(1);
    });
  });

  describe('4. 미팅 가드 & 스마트 팔로업 스튜디오', () => {
    it('미팅 24시간 전 및 2시간 전 정중한 에티켓 리마인더 서신을 생성해야 한다', () => {
      const brief = generateMeetingReminderBrief(MOCK_PEOPLE[0], '내일 오후 2시', '카카오 아지트 라운지');
      expect(brief.personName).toBe(MOCK_PEOPLE[0].name);
      expect(brief.reminders.hours24Before).toContain('내일(내일 오후 2시)');
      expect(brief.reminders.hours2Before).toContain('잠시 후');
    });

    it('미팅 감사 서신과 약속 이행 항목을 저장하고 완료 상태를 토글할 수 있어야 한다', () => {
      const followUps = getSavedFollowUps();
      expect(followUps.length).toBeGreaterThan(0);

      const targetFu = followUps[0];
      const targetCm = targetFu.commitments[0];
      const initialStatus = targetCm.isCompleted;

      const toggled = toggleCommitmentComplete(targetFu.id, targetCm.id);
      const updatedFu = toggled.find((f) => f.id === targetFu.id);
      const updatedCm = updatedFu?.commitments.find((c) => c.id === targetCm.id);

      expect(updatedCm?.isCompleted).toBe(!initialStatus);

      // saveFollowUp 검증
      saveFollowUp({
        ...targetFu,
        id: 'fu-new-test',
        discussionSummary: '새로운 파트너십 후속 미팅 요약',
      });
      const savedList = getSavedFollowUps();
      expect(savedList.some((f) => f.id === 'fu-new-test')).toBe(true);
    });
  });
});
