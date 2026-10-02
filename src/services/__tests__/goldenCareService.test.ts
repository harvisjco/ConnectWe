import { describe, it, expect } from 'vitest';
import { 
  calculateGapDays, 
  detectGoldenCareTargets, 
  generateGoldenCareDrafts, 
  resolveGoldenCareContact 
} from '../goldenCareService';
import { Person } from '../../types/network';

describe('goldenCareService - VIP 골든타임 능동형 케어 & 안부 서신 엔진 검증', () => {
  const basePerson: Omit<Person, 'id' | 'name' | 'currentCompany' | 'currentTitle' | 'closeness' | 'sourceType'> = {
    currentDepartment: '경영전략',
    mobile: '010-0000-0000',
    email: 'test@example.com',
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: 'IT/전략',
    skills: [],
    careers: [],
    academics: [],
    connectionChannel: 'business_card',
    isStale: false
  };

  const mockPeople: Person[] = [
    {
      ...basePerson,
      id: 'p-me',
      name: '나 (대표)',
      currentCompany: 'ConnectWe',
      currentTitle: '대표이사',
      closeness: 1,
      lastContactDate: '2026-10-01',
      sourceType: 'SOURCE_DATA'
    },
    {
      ...basePerson,
      id: 'p-1',
      name: '김경영',
      currentCompany: '네이버',
      currentTitle: '부사장',
      closeness: 2,
      lastContactDate: '2026-03-01', // 약 215일 전 (180일+ 긴급)
      isStale: true,
      sourceType: 'DART_FACT'
    },
    {
      ...basePerson,
      id: 'p-2',
      name: '이전략',
      currentCompany: '카카오',
      currentTitle: '전략총괄 부사장',
      closeness: 2,
      lastContactDate: '2026-06-15', // 약 109일 전 (90일 주의)
      isStale: false,
      sourceType: 'SOURCE_DATA'
    },
    {
      ...basePerson,
      id: 'p-3',
      name: '박혁신',
      currentCompany: '토스',
      currentTitle: 'Head of Product',
      closeness: 2,
      lastContactDate: '2026-07-20', // 약 74일 전 (60일 알림)
      isStale: false,
      sourceType: 'SOURCE_DATA'
    },
    {
      ...basePerson,
      id: 'p-4',
      name: '최최근',
      currentCompany: '쿠팡',
      currentTitle: '전무',
      closeness: 2,
      lastContactDate: '2026-09-25', // 약 7일 전 (제외 대상)
      isStale: false,
      sourceType: 'SOURCE_DATA'
    }
  ];

  it('1. 소통 공백 일수(gapDays)를 정확하게 계산해야 한다', () => {
    const gapUndefined = calculateGapDays(undefined);
    expect(gapUndefined).toBe(180);

    const gapInvalid = calculateGapDays('invalid-date');
    expect(gapInvalid).toBe(180);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const gap1 = calculateGapDays(yesterday.toISOString().slice(0, 10));
    expect(gap1).toBe(1);
  });

  it('2. 60일/90일/180일 소통 공백 인물을 긴급도 우선순위로 정확히 필터링 및 정렬해야 한다', () => {
    const targets = detectGoldenCareTargets(mockPeople);

    // 본인(p-me) 및 최근 소통(p-4)은 제외되어야 함
    expect(targets.some(t => t.person.id === 'p-me')).toBe(false);
    expect(targets.some(t => t.person.id === 'p-4')).toBe(false);

    // p-1(180d+), p-2(90d), p-3(60d) 3명이 탐지되어야 함
    expect(targets.length).toBe(3);

    // 1순위는 180일+ 긴급 대상인 김경영 부사장이어야 함
    expect(targets[0].person.name).toBe('김경영');
    expect(targets[0].urgency).toBe('urgent_180d');

    // 2순위는 90일 주의 대상인 이전략 부사장이어야 함
    expect(targets[1].person.name).toBe('이전략');
    expect(targets[1].urgency).toBe('warning_90d');

    // 3순위는 60일 알림 대상인 박혁신
    expect(targets[2].person.name).toBe('박혁신');
    expect(targets[2].urgency).toBe('notice_60d');
  });

  it('3. 대상 인물 맞춤형 4대 테마 안부 서신을 품격 있게 합성해야 한다', () => {
    const drafts = generateGoldenCareDrafts(mockPeople[1]); // 김경영 (네이버 부사장, DART FACT)

    expect(drafts.length).toBe(4);

    const themes = drafts.map(d => d.theme);
    expect(themes).toContain('seasonal_greeting');
    expect(themes).toContain('congratulations');
    expect(themes).toContain('casual_coffee');
    expect(themes).toContain('business_synergy');

    // 단문 SMS/카카오톡 및 장문 이메일 서신 포함 확인
    drafts.forEach(draft => {
      expect(draft.smsBody).toContain('김경영');
      expect(draft.emailBody).toContain('네이버');
      expect(draft.emailSubject.length).toBeGreaterThan(10);
    });

    // DART 상장사 공시 임원 축하 문구 반영 확인
    const congratsDraft = drafts.find(d => d.theme === 'congratulations')!;
    expect(congratsDraft.emailSubject).toContain('DART 공시');
  });

  it('4. 안부 서신 전송 완료 시 lastContactDate 갱신 및 소통 공백이 해소되어야 한다', () => {
    const stalePerson = mockPeople[1];
    expect(stalePerson.isStale).toBe(true);

    const resolved = resolveGoldenCareContact(
      stalePerson,
      '따뜻한 가을 안부 서신 발송 완료',
      '🌱 계절 안부'
    );

    const todayStr = new Date().toISOString().slice(0, 10);
    expect(resolved.lastContactDate).toBe(todayStr);
    expect(resolved.isStale).toBe(false);
    expect(resolved.activityLogs?.[0].title).toBe('[골든타임 안부] 🌱 계절 안부');
    expect(resolved.memo).toContain('골든타임 안부 완료');
  });
});
