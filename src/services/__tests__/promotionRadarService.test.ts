import { describe, it, expect } from 'vitest';
import { 
  generateCongratulationMessages, 
  PromotionEvent, 
  getCadenceAlerts,
  addPromotionEvent,
  toggleCongratulatedStatus
} from '../promotionRadarService';
import { Person } from '../../types/network';

describe('promotionRadarService - 영전 축전 및 소통 주기 진단', () => {
  it('대표이사 취임 이벤트에 대해 축하 리본 및 공식 서신이 올바르게 생성되어야 한다', () => {
    const event: PromotionEvent = {
      id: 'promo-1',
      personId: 'p1',
      personName: '홍길동',
      companyName: '카카오',
      previousTitle: '부사장',
      newTitle: '대표이사 (CEO)',
      promotionType: 'CEO_APPOINTMENT',
      announcedDate: '2026-03-01',
      isCongratulated: false,
    };

    const messages = generateCongratulationMessages(event, '김파트너');
    expect(messages.length).toBe(3);

    const ribbon = messages.find(m => m.type === 'FLOWER_RIBBON');
    expect(ribbon?.content).toContain('祝 就任');
    expect(ribbon?.content).toContain('김파트너 拜上');

    const formal = messages.find(m => m.type === 'FORMAL_LETTER');
    expect(formal?.content).toContain('홍길동 대표이사 (CEO)님께');
    expect(formal?.content).toContain('취임');
  });

  it('마지막 연락 후 60일이 지난 핵심 1·2촌 인맥은 소통 공백(Cadence Alert)으로 탐지되어야 한다', () => {
    const people: Person[] = [
      {
        id: 'p1',
        name: '오래된친구',
        currentCompany: '토스',
        currentDepartment: '개발팀',
        currentTitle: 'CTO',
        mobile: '010-0000-0000',
        email: 'test@toss.im',
        estimatedAgeGroup: '30s',
        isAgeEstimated: false,
        primaryDomain: 'IT',
        skills: [],
        careers: [],
        academics: [],
        sourceType: 'SOURCE_DATA',
        closeness: 2,
        connectionChannel: 'vcard',
        isStale: false,
        lastContactDate: '2026-06-01', // 115일 전
      },
    ];

    const alerts = getCadenceAlerts(people);
    expect(alerts.length).toBe(1);
    expect(alerts[0].person.name).toBe('오래된친구');
    expect(alerts[0].daysSinceLastContact).toBeGreaterThanOrEqual(60);
    expect(alerts[0].urgency).toBe('MEDIUM');
  });

  it('신규 승진 이벤트를 추가하고 축하 완료 상태를 토글할 수 있어야 한다', () => {
    const initialEvents: PromotionEvent[] = [
      {
        id: 'promo-init-1',
        personId: 'p_init',
        personName: '박창업',
        companyName: '루닛',
        previousTitle: '이사',
        newTitle: '상무',
        promotionType: 'PROMOTION',
        announcedDate: '2026-04-01',
        isCongratulated: false
      }
    ];

    const newEvent: PromotionEvent = {
      id: 'promo-init-2',
      personId: 'p_init2',
      personName: '이혁신',
      companyName: '업스테이지',
      previousTitle: '헤드',
      newTitle: '부사장',
      promotionType: 'PROMOTION',
      announcedDate: '2026-04-05',
      isCongratulated: false
    };

    const added = addPromotionEvent(initialEvents, newEvent);
    expect(added.length).toBe(2);
    expect(added[0].id).toBe('promo-init-2');

    const toggled = toggleCongratulatedStatus(added, 'promo-init-2');
    expect(toggled.find(e => e.id === 'promo-init-2')?.isCongratulated).toBe(true);
    expect(toggled.find(e => e.id === 'promo-init-2')?.congratulatedAt).toBeDefined();

    const toggledBack = toggleCongratulatedStatus(toggled, 'promo-init-2');
    expect(toggledBack.find(e => e.id === 'promo-init-2')?.isCongratulated).toBe(false);
  });
});

