import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  networkVitalityService,
  SEASON_GREETING_PRESETS,
  DEFAULT_MEETUP_ROOM,
  DEFAULT_BILINGUAL_MEETINGS
} from '../networkVitalityService';
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
    name: '김지원',
    currentCompany: '토스',
    currentTitle: '프론트엔드 리드',
    closeness: 1,
    interactionHistory: [{ date: '2026-09-25', note: '커피챗' }],
    tags: ['개발'],
    topics: ['React'],
    strengths: ['프론트'],
    personality: '신중',
    communicationStyle: '정중',
    relationshipGoal: '협력',
    preferredMeetingType: '온라인',
    academics: [],
    experiences: [],
    projects: [],
    customFields: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-09-25'
  },
  {
    id: 'p-002',
    name: '이동훈',
    currentCompany: '당근마켓',
    currentTitle: '백엔드 아키텍트',
    closeness: 2,
    interactionHistory: [{ date: '2026-04-10', note: '세미나' }],
    tags: ['인프라'],
    topics: ['K8s'],
    strengths: ['대규모 분산'],
    personality: '활발',
    communicationStyle: '직접적',
    relationshipGoal: '지식교류',
    preferredMeetingType: '오프라인',
    academics: [],
    experiences: [],
    projects: [],
    customFields: [],
    createdAt: '2026-01-01',
    updatedAt: '2026-04-10'
  }
];

describe('networkVitalityService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MockStorage());
  });

  describe('1. 관계 생명력 & 안부 레이더', () => {
    it('마지막 접점일 기준 4단계 생명력 지수와 통계를 산출해야 한다', () => {
      const list = networkVitalityService.calculateVitality(MOCK_PEOPLE);
      expect(list.length).toBe(2);
      
      const p1 = list.find(i => i.person.id === 'p-001');
      expect(p1?.vitalityLevel).toBe('active');
      expect(p1?.vitalityScore).toBeGreaterThanOrEqual(80);

      const p2 = list.find(i => i.person.id === 'p-002');
      expect(p2?.vitalityLevel).toBe('needs_care');

      const stats = networkVitalityService.getVitalityStats(MOCK_PEOPLE);
      expect(stats.total).toBe(2);
      expect(stats.active).toBe(1);
      expect(stats.needsCare).toBe(1);
    });

    it('시즌별(환절기, 분기, 명절, 커피챗) 맞춤 안부 서신을 생성해야 한다', () => {
      const p = MOCK_PEOPLE[0];
      const letter = networkVitalityService.generateSeasonGreeting(p, 'CHANGE_OF_SEASON', '신규 펀딩 유치');
      expect(letter).toContain(p.name);
      expect(letter).toContain('환절기');
      expect(letter).toContain('신규 펀딩 유치');
    });
  });

  describe('2. 현장 밋업 & 컨퍼런스 네트워킹 룸', () => {
    it('기본 밋업 룸을 조회하고 새로운 참가자가 체크인할 수 있어야 한다', () => {
      const room = networkVitalityService.getMeetupRoom('TECH26');
      expect(room.roomCode).toBe('TECH26');
      expect(room.participants.length).toBe(DEFAULT_MEETUP_ROOM.participants.length);

      const updated = networkVitalityService.checkInToRoom('TECH26', {
        name: '박지훈',
        company: '라인',
        title: '데이터 엔지니어',
        role: 'developer',
        roleLabel: '개발자',
        skills: ['Kafka', 'Spark'],
        seekingTopics: ['실시간 데이터 스트리밍'],
        vCardAvailable: true
      });

      expect(updated.participants.length).toBe(DEFAULT_MEETUP_ROOM.participants.length + 1);
      expect(updated.participants[0].name).toBe('박지훈');
    });

    it('밋업 참가자 전원에게 전송하는 일괄 안부 서신을 생성해야 한다', () => {
      const room = networkVitalityService.getMeetupRoom('TECH26');
      const broadcast = networkVitalityService.generateMeetupBroadcast(room);
      expect(broadcast).toContain(room.title);
      expect(broadcast).toContain('디지털 명함');
    });
  });

  describe('3. 글로벌 바이링구얼 미팅 인텔리전스', () => {
    it('바이링구얼 미팅 프리셋을 제공하고 영문 팔로업 서신을 추출해야 한다', () => {
      const meetings = networkVitalityService.getBilingualMeetings();
      expect(meetings.length).toBeGreaterThanOrEqual(1);

      const first = meetings[0];
      const email = networkVitalityService.generateEnglishFollowUp(first);
      expect(email).toContain('Dear David');
      expect(email).toContain('ConnectWe');
    });

    it('상대방 타임존에 기반하여 최적의 양사 미팅 시간을 산출해야 한다', () => {
      const timeSlot = networkVitalityService.calculateOptimalCrossTime('America/Los_Angeles (PST)');
      expect(timeSlot.koreanTime).toContain('KST');
      expect(timeSlot.partnerTime).toContain('PST');
    });
  });

  describe('4. 크로스 컴퍼니 실무 난제 SOS 헬프데스크', () => {
    it('신규 SOS 티켓을 등록하고 적합한 지인을 자동 매칭해야 한다', () => {
      const newTicket = networkVitalityService.createProblemTicket({
        title: 'React 19 Server Actions 대규모 트래픽 캐싱 병목',
        category: 'frontend_ux',
        categoryLabel: '프론트엔드 & UX',
        description: 'SSR 환경에서 동시 접속자 1만 명 시 서버 액션 응답 지연 현상',
        confidentialMasked: true
      }, MOCK_PEOPLE);

      expect(newTicket.id).toBeDefined();
      expect(newTicket.matchedAdvisors.length).toBeGreaterThan(0);

      const tickets = networkVitalityService.getProblemTickets();
      expect(tickets.some(t => t.id === newTicket.id)).toBe(true);
    });

    it('지인에게 전송할 15분 티타임 자문 요청 서신을 정중하게 생성해야 한다', () => {
      const tickets = networkVitalityService.getProblemTickets();
      const first = tickets[0];
      const letter = networkVitalityService.generatePeerAdviceLetter(first, '한지수');

      expect(letter).toContain('한지수');
      expect(letter).toContain(first.title);
      expect(letter).toContain('15분');
      expect(letter).toContain('조언');
    });
  });
});
