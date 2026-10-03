import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPresetMeetingLocations,
  generateTimeSlotRecommendations,
  formatTeaTimeProposalLetter,
  generateIcsCalendarFile,
  getGlobalCityClusters,
  findLocalReunionMatches,
  getThoughtfulCapsule,
  saveThoughtfulCapsule,
  generateSmallTalkCueCards,
  getProductShowcases,
  formatPortfolioBrief,
} from '../executiveEleganceService';
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

describe('Executive Elegance & Global Showcase Studio Service', () => {
  beforeEach(() => {
    const mockStorage = new MockStorage();
    vi.stubGlobal('localStorage', mockStorage);
    vi.stubGlobal('window', { localStorage: mockStorage });
  });

  describe('1. 비즈니스 품격 일정 조율기 & .ICS 번들러', () => {
    it('사전 정의된 4대 비즈니스 미팅 명소를 정상 반환해야 한다', () => {
      const locations = getPresetMeetingLocations();
      expect(locations).toHaveLength(4);
      expect(locations.map((l) => l.zone)).toEqual(['pangyo', 'gangnam', 'yeouido', 'gwanghwamun']);
      expect(locations[0].placeName).toContain('판교');
      expect(locations[1].parkingAvailable).toBe(true);
    });

    it('3대 추천 시간대를 정확한 ISO 및 라벨 형식으로 생성해야 한다', () => {
      const baseDate = new Date('2026-10-12T09:00:00Z');
      const slots = generateTimeSlotRecommendations('김대표', baseDate);

      expect(slots).toHaveLength(3);
      slots.forEach((slot) => {
        expect(slot.id).toBeDefined();
        expect(slot.dateTimeLabel).toBeDefined();
        expect(new Date(slot.startIso).getTime()).toBeLessThan(new Date(slot.endIso).getTime());
        expect(slot.summary).toContain('김대표');
      });
    });

    it('티타임 제안 서신을 품격 있는 정중한 문구로 포맷팅해야 한다', () => {
      const slots = generateTimeSlotRecommendations('이대표');
      const location = getPresetMeetingLocations()[0];
      const letter = formatTeaTimeProposalLetter('이대표', '넥스트AI', '생성형 검색 협업', slots, location);

      expect(letter).toContain('넥스트AI 이대표님, 안녕하십니까.');
      expect(letter).toContain('[생성형 검색 협업] 관련하여');
      expect(letter).toContain(location.placeName);
      expect(letter).toContain(slots[0].dateTimeLabel);
    });

    it('RFC 5545 표준에 부합하는 .ics 캘린더 파일을 생성해야 한다', () => {
      const ics = generateIcsCalendarFile({
        title: '신뢰 기반 비즈니스 티타임',
        description: '차분한 차담 및 장기적 파트너십 논의',
        location: '조선 팰리스 1914 라운지',
        startIso: '2026-10-20T06:00:00.000Z',
        endIso: '2026-10-20T06:45:00.000Z',
      });

      expect(ics.icsString).toContain('BEGIN:VCALENDAR');
      expect(ics.icsString).toContain('VERSION:2.0');
      expect(ics.icsString).toContain('BEGIN:VEVENT');
      expect(ics.icsString).toContain('SUMMARY:신뢰 기반 비즈니스 티타임');
      expect(ics.icsString).toContain('LOCATION:조선 팰리스 1914 라운지');
      expect(ics.icsString).toContain('END:VEVENT');
      expect(ics.icsString).toContain('END:VCALENDAR');
      expect(ics.filename).toMatch(/^meeting_.*\.ics$/);
    });
  });

  describe('2. 글로벌 출장 & 지방 외근 지능형 인맥 레이더', () => {
    it('8대 전략 거점 클러스터를 누락 없이 반환해야 한다', () => {
      const clusters = getGlobalCityClusters();
      expect(clusters).toHaveLength(8);
      const cityIds = clusters.map((c) => c.id);
      expect(cityIds).toContain('san_francisco');
      expect(cityIds).toContain('tokyo');
      expect(cityIds).toContain('singapore');
      expect(cityIds).toContain('pangyo');
      expect(cityIds).toContain('gangnam');
      expect(cityIds).toContain('yeouido');
      expect(cityIds).toContain('daedeok_rnd');
      expect(cityIds).toContain('busan_centum');
    });

    it('출장 도시와 연관된 인맥을 찾아 제안 서신과 함께 매칭해야 한다', () => {
      const mockPeople: Person[] = [
        {
          id: 'p1',
          name: '스티브 박',
          currentCompany: 'Google Mountain View',
          currentTitle: 'Staff AI Researcher',
          closeness: 5,
        } as unknown as Person,
        {
          id: 'p2',
          name: '최민서',
          currentCompany: '카카오 판교',
          currentTitle: '시니어 프로덕트 오너',
          closeness: 4,
        } as unknown as Person,
      ];

      const matchesSF = findLocalReunionMatches('san_francisco', mockPeople);
      expect(matchesSF.length).toBeGreaterThan(0);
      expect(matchesSF[0].person.name).toBe('스티브 박');
      expect(matchesSF[0].invitationLetterTemplate).toContain('스티브 박님');
      expect(matchesSF[0].invitationLetterTemplate).toContain('샌프란시스코 / 실리콘밸리');

      const matchesPangyo = findLocalReunionMatches('pangyo', mockPeople);
      expect(matchesPangyo[0].person.name).toBe('최민서');
    });
  });

  describe('3. 소소한 감동 메모 캡슐 & 스몰톡 큐카드', () => {
    it('감동 메모 캡슐을 조회하고 영속화할 수 있어야 한다', () => {
      const initial = getThoughtfulCapsule('person_101', '박지민');
      expect(initial.personName).toBe('박지민');
      expect(initial.coffeePreference).toBeDefined();

      const updated = {
        ...initial,
        coffeePreference: '아이스 플랫 화이트, 산미 있는 에티오피아 원두 선호',
      };
      saveThoughtfulCapsule(updated);

      const loaded = getThoughtfulCapsule('person_101');
      expect(loaded.coffeePreference).toBe('아이스 플랫 화이트, 산미 있는 에티오피아 원두 선호');
    });

    it('메모 캡슐을 기반으로 4대 스몰톡 큐카드를 유도 질문과 함께 생성해야 한다', () => {
      const capsule = getThoughtfulCapsule('person_202', '최성우');
      const cards = generateSmallTalkCueCards(capsule);

      expect(cards).toHaveLength(4);
      expect(cards.map((c) => c.category)).toEqual(['coffee', 'hobby', 'industry', 'milestone']);
      expect(cards[0].icebreakerQuestion).toContain('최성우님');
      expect(cards[1].tip).toBeDefined();
    });
  });

  describe('4. 프로덕트 & 프로젝트 레퍼런스 쇼케이스', () => {
    it('초기 프로덕트 쇼케이스 목록을 정상 제공해야 한다', () => {
      const showcases = getProductShowcases();
      expect(showcases.length).toBeGreaterThanOrEqual(3);
      expect(showcases[0].title).toContain('ConnectWe');
      expect(showcases[0].contributors.length).toBeGreaterThan(0);
      expect(showcases[0].endorsementCount).toBeGreaterThan(0);
    });

    it('1-Page 포트폴리오 브리프 텍스트를 마크다운 형식으로 올바르게 변환해야 한다', () => {
      const item = getProductShowcases()[0];
      const brief = formatPortfolioBrief(item);

      expect(brief).toContain('[프로덕트 쇼케이스 1-Page 브리프]');
      expect(brief).toContain(`■ 프로덕트명: ${item.title}`);
      expect(brief).toContain(`■ 한 줄 요약: ${item.tagline}`);
      expect(brief).toContain('■ 핵심 해결 과제:');
      expect(brief).toContain(item.metricsSummary);
      expect(brief).toContain('자료 제공: ConnectWe Executive Showcase Studio');
    });
  });
});
