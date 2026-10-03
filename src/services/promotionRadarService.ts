import { Person } from '../types/network';

export interface PromotionEvent {
  id: string;
  personId: string;
  personName: string;
  companyName: string;
  previousTitle: string;
  newTitle: string;
  promotionType: 'PROMOTION' | 'CEO_APPOINTMENT' | 'BOARD_INDUCTION' | 'CAREER_MOVE';
  announcedDate: string; // YYYY-MM-DD
  dartRceptNo?: string;
  isCongratulated: boolean;
  congratulatedAt?: string;
}

export interface CadenceAlert {
  person: Person;
  daysSinceLastContact: number;
  thresholdDays: number;
  recommendedAction: 'CALL' | 'COFFEE_CHAT' | 'EMAIL_PING' | 'DART_CHECK';
  urgency: 'HIGH' | 'MEDIUM' | 'LOW';
}

const STORAGE_PROMOTION_KEY = 'connectwe_promotions_v1';

/**
 * DART 공시 및 최근 경력 기반 승진/영전 이벤트 초기 목 데이터 및 감지 로직
 */
export function loadPromotionEvents(people: Person[]): PromotionEvent[] {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_PROMOTION_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // Fallback
    }
  }

  // DART 공시 임원 중 샘플 승진/영전 이벤트 자동 매핑
  const sampleEvents: PromotionEvent[] = [];
  const dartPeople = people.filter(p => p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector);

  if (dartPeople.length > 0) {
    const p1 = dartPeople[0];
    sampleEvents.push({
      id: `promo-${p1.id}-1`,
      personId: p1.id,
      personName: p1.name,
      companyName: p1.currentCompany,
      previousTitle: '상무',
      newTitle: p1.currentTitle.includes('전무') ? p1.currentTitle : '전무 / 사업본부장',
      promotionType: 'PROMOTION',
      announcedDate: '2026-03-15',
      dartRceptNo: p1.dartInfo?.rceptNo || '20260315000123',
      isCongratulated: false
    });
  }

  if (dartPeople.length > 1) {
    const p2 = dartPeople[1];
    sampleEvents.push({
      id: `promo-${p2.id}-2`,
      personId: p2.id,
      personName: p2.name,
      companyName: p2.currentCompany,
      previousTitle: '전무',
      newTitle: '대표이사 (CEO)',
      promotionType: 'CEO_APPOINTMENT',
      announcedDate: '2026-02-28',
      dartRceptNo: p2.dartInfo?.rceptNo || '20260228000456',
      isCongratulated: true,
      congratulatedAt: '2026-03-01'
    });
  }

  // 일반 인맥 중 최근 승진 샘플
  const generalPeople = people.filter(p => p.sourceType !== 'DART_FACT');
  if (generalPeople.length > 0) {
    const p3 = generalPeople[0];
    sampleEvents.push({
      id: `promo-${p3.id}-3`,
      personId: p3.id,
      personName: p3.name,
      companyName: p3.currentCompany,
      previousTitle: '팀장',
      newTitle: '그룹장 / 이사 대우',
      promotionType: 'PROMOTION',
      announcedDate: '2026-01-10',
      isCongratulated: false
    });
  }

  savePromotionEvents(sampleEvents);
  return sampleEvents;
}

export function savePromotionEvents(events: PromotionEvent[]): void {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_PROMOTION_KEY, JSON.stringify(events));
    } catch {
      // Fallback
    }
  }
}

/**
 * 신규 승진/영전 이벤트 등록
 */
export function addPromotionEvent(events: PromotionEvent[], newEvent: PromotionEvent): PromotionEvent[] {
  const filtered = events.filter(e => e.id !== newEvent.id);
  const updated = [newEvent, ...filtered];
  savePromotionEvents(updated);
  return updated;
}

/**
 * 축전 발송 완료 상태 토글
 */
export function toggleCongratulatedStatus(events: PromotionEvent[], eventId: string): PromotionEvent[] {
  const today = new Date().toISOString().split('T')[0];
  const updated = events.map(e => {
    if (e.id === eventId) {
      const willBeCongratulated = !e.isCongratulated;
      return {
        ...e,
        isCongratulated: willBeCongratulated,
        congratulatedAt: willBeCongratulated ? today : undefined
      };
    }
    return e;
  });
  savePromotionEvents(updated);
  return updated;
}


/**
 * 소통 주기 이탈 (Cadence Drift) 인맥 감지
 * - 친밀도 1~2촌: 60일 이상 무연락 시 경고
 * - 친밀도 3촌: 120일 이상 무연락 시 경고
 */
export function getCadenceAlerts(people: Person[]): CadenceAlert[] {
  const alerts: CadenceAlert[] = [];
  const now = new Date('2026-09-24T16:00:00');

  people.forEach(person => {
    const threshold = person.closeness <= 2 ? 60 : 120;
    
    // lastContactDate 없으면 임의 90~150일 전으로 환산
    let daysSince = 100;
    if (person.lastContactDate) {
      const last = new Date(person.lastContactDate);
      daysSince = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
    } else if (person.isStale) {
      daysSince = 180;
    }

    if (daysSince >= threshold) {
      const urgency = daysSince >= 150 ? 'HIGH' : daysSince >= 90 ? 'MEDIUM' : 'LOW';
      const recommendedAction = person.closeness <= 2 ? 'COFFEE_CHAT' : 'CALL';

      alerts.push({
        person,
        daysSinceLastContact: daysSince,
        thresholdDays: threshold,
        recommendedAction,
        urgency
      });
    }
  });

  return alerts.sort((a, b) => b.daysSinceLastContact - a.daysSinceLastContact);
}

/**
 * 축전 및 화환 메시지 자동 생성
 */
export interface CongratulationMessagePreset {
  type: 'FLOWER_RIBBON' | 'FORMAL_LETTER' | 'WARM_MOBILE';
  title: string;
  content: string;
}

export function generateCongratulationMessages(
  event: PromotionEvent,
  senderName: string = '홍길동'
): CongratulationMessagePreset[] {
  const isCeo = event.promotionType === 'CEO_APPOINTMENT';

  return [
    {
      type: 'FLOWER_RIBBON',
      title: '축하 화환 / 동양란 리본 문구',
      content: isCeo
        ? `[우측 리본] 祝 就任 (축 취임) / 代表理事 就任을 眞心으로 祝賀드립니다\n[좌측 리본] ${senderName} 拜上`
        : `[우측 리본] 祝 榮轉 (축 영전) / ${event.newTitle} 昇進을 眞心으로 祝賀드립니다\n[좌측 리본] ${senderName} 拜上`
    },
    {
      type: 'FORMAL_LETTER',
      title: 'C-Level 공식 서신 & 이메일 축전',
      content: `존경하는 ${event.personName} ${event.newTitle}님께,

금번 ${event.companyName}의 ${event.newTitle} ${isCeo ? '취임' : '영전'}을 진심으로 축하드립니다.
그동안 현장에서 보여주신 탁월한 리더십과 혜안이 있었기에 오늘의 영예로운 결실이 더욱 빛나는 것 같습니다.

새로운 중책을 맡으시어 대한민국 산업계와 ${event.companyName}에 더 큰 혁신과 도약을 이끌어주시길 진심으로 응원합니다.
추후 취임 일정과 일정이 조금 정돈되시면, 찾아뵙고 직접 축하 인사 올리도록 하겠습니다.

늘 건강과 무궁한 영광이 함께하시기를 기원합니다.

${senderName} 배상`
    },
    {
      type: 'WARM_MOBILE',
      title: '모바일 카카오톡 / 문자 축하 메시지',
      content: `${event.personName} 선배님/대표님, ${event.companyName} ${event.newTitle} ${isCeo ? '취임' : '승진'} 공시 보고 너무 반갑고 기쁜 마음에 연락드립니다!
그간의 노고와 성과가 결실을 맺게 되어 진심으로 축하드립니다.
바쁘신 일정 조금 추스러지시면 시원하게 축하 커피 한 잔 사겠습니다. 항상 응원하겠습니다!`
    }
  ];
}

/**
 * 소통 골든타임 이탈 인맥을 위한 상황별 맞춤 안부 카피 생성기
 */
export interface CadenceGreetingPreset {
  type: 'WARM_TEA_INVITE' | 'FORMAL_CHECK_IN' | 'ALUMNI_TOUCH';
  title: string;
  badge: string;
  content: string;
}

export function generateCadenceGreetings(
  person: Person,
  daysSinceLastContact: number,
  senderName: string = '홍길동'
): CadenceGreetingPreset[] {
  const company = person.currentCompany;
  const title = person.currentTitle;
  const name = person.name;

  const timeSpanText = daysSinceLastContact >= 365
    ? '어느덧 1년 남짓 시간이 흘러'
    : daysSinceLastContact >= 180
    ? '지난 반년 동안 찾아뵙지 못했는데'
    : '지난 분기 인사드린 후 시간이 다소 흘렀는데';

  return [
    {
      type: 'WARM_TEA_INVITE',
      title: '따뜻한 계절 안부 & 편안한 티타임 제안',
      badge: '가장 추천',
      content: `${name} ${title}님, 평안하신지요? ${senderName}입니다.
${timeSpanText} 뵌 지가 꽤 되었더군요. 바쁜 일상 속에서도 늘 ${company}에서 멋진 성과 이끌어주시는 모습 멀리서나마 깊이 응원하고 있습니다.
날씨도 완연히 좋아졌는데, 이번 달에 부담 없이 편하신 일정에 가볍게 차 한 잔 나누며 안부 전하고 싶습니다.
일정 중 여유로운 날 편하게 말씀해 주시면 맞추어 찾아뵙겠습니다. 늘 건강 유의하세요!`
    },
    {
      type: 'FORMAL_CHECK_IN',
      title: '정중한 비즈니스 근황 안부 & 시너지 탐색',
      badge: '공식 비즈니스',
      content: `${name} ${title}님께,
안녕하십니까, ${senderName}입니다.
최근 ${company}의 역동적인 사업 행보와 혁신적인 프로젝트 소식을 뉴스와 공시를 통해 반갑게 접하고 있습니다.
지난 미팅 이후 현업에 매진하시느라 분주하셨을 줄 압니다. 혹시 이번 분기에 추진 중이신 사업과 관련하여 가볍게 근황도 여쭙고 시너지 포인트를 나눌 수 있는 15분 내외의 티타임 자리가 가능하실지요?
편하신 일시를 회신해 주시면 감사히 조율하도록 하겠습니다.`
    },
    {
      type: 'ALUMNI_TOUCH',
      title: '동문·이전 직장 인연 반가운 터치',
      badge: '알럼나이 인연',
      content: `${name} 선배님/동료님, 잘 지내고 계시죠? ${senderName}입니다.
문득 예전 함께했던 프로젝트 이야기 나누다 선배님 생각이 나 연락드렸습니다.
${company}에서 중책 맡으셔서 눈코 뜰 새 없이 바쁘시겠지만, 근처 지나실 때나 시간 되실 때 따뜻한 커피 한 잔 나누며 밀린 이야기 나눌 수 있으면 좋겠습니다.
항상 건승하시길 기원합니다!`
    }
  ];
}
