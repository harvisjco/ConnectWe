import { Person, ActivityLog } from '../types/network';

export type GoldenCareUrgency = 'urgent_180d' | 'warning_90d' | 'notice_60d';

export interface GoldenCareTarget {
  person: Person;
  gapDays: number;
  urgency: GoldenCareUrgency;
  urgencyLabel: string;
  recommendedTheme: 'seasonal_greeting' | 'congratulations' | 'casual_coffee' | 'business_synergy';
}

export interface GoldenCareMessageDraft {
  theme: 'seasonal_greeting' | 'congratulations' | 'casual_coffee' | 'business_synergy';
  themeLabel: string;
  themeIcon: string;
  summary: string;
  smsBody: string;
  emailSubject: string;
  emailBody: string;
}

/**
 * 소통 공백 일수 계산 (기록이 없을 경우 기본 180일로 산정)
 */
export function calculateGapDays(lastContactDate?: string): number {
  if (!lastContactDate) return 180;
  const lastTime = new Date(lastContactDate).getTime();
  if (isNaN(lastTime)) return 180;
  const now = Date.now();
  const diff = Math.max(0, now - lastTime);
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

/**
 * 60일 이상 소통 공백이 도래한 골든타임 케어 대상 인물 탐지 및 정렬
 */
export function detectGoldenCareTargets(people: Person[]): GoldenCareTarget[] {
  const targets: GoldenCareTarget[] = [];

  for (const person of people) {
    if (person.closeness === 1) continue; // 본인은 제외

    const gapDays = calculateGapDays(person.lastContactDate);
    if (gapDays < 60 && !person.isStale) continue;

    let urgency: GoldenCareUrgency = 'notice_60d';
    let urgencyLabel = '60일 소통 공백';

    if (gapDays >= 180 || person.isStale) {
      urgency = 'urgent_180d';
      urgencyLabel = '180일+ 골든타임 경과';
    } else if (gapDays >= 90) {
      urgency = 'warning_90d';
      urgencyLabel = '90일 소통 공백';
    }

    // 추천 테마 판별
    let recommendedTheme: GoldenCareTarget['recommendedTheme'] = 'seasonal_greeting';
    if (person.memo?.includes('승진') || person.memo?.includes('영전') || person.sourceType === 'DART_FACT') {
      recommendedTheme = 'congratulations';
    } else if (gapDays >= 180) {
      recommendedTheme = 'casual_coffee';
    } else if (person.primaryDomain && person.primaryDomain.includes('경영')) {
      recommendedTheme = 'business_synergy';
    }

    targets.push({
      person,
      gapDays,
      urgency,
      urgencyLabel,
      recommendedTheme
    });
  }

  // 우선순위 정렬: 긴급도(180d > 90d > 60d) -> 공백 일수 내림차순
  return targets.sort((a, b) => {
    const urgencyWeight: Record<GoldenCareUrgency, number> = {
      urgent_180d: 3,
      warning_90d: 2,
      notice_60d: 1
    };
    if (urgencyWeight[b.urgency] !== urgencyWeight[a.urgency]) {
      return urgencyWeight[b.urgency] - urgencyWeight[a.urgency];
    }
    return b.gapDays - a.gapDays;
  });
}

/**
 * 현재 계절 및 날씨 화두 텍스트 추출 (한국 기준)
 */
function getCurrentSeasonContext(): { seasonName: string; greetingText: string } {
  const month = new Date().getMonth() + 1;
  if (month >= 3 && month <= 5) {
    return {
      seasonName: '따뜻한 봄날',
      greetingText: '새로운 기운이 샘솟는 완연한 봄날입니다. 바쁘신 경영 일정 속에서도 건강과 평안이 늘 함께하시길 바랍니다.'
    };
  } else if (month >= 6 && month <= 8) {
    return {
      seasonName: '활기찬 여름',
      greetingText: '무더위 속에서도 언제나 열정적으로 비즈니스를 이끌고 계실 대표님/임원님의 건승을 기원합니다.'
    };
  } else if (month >= 9 && month <= 11) {
    return {
      seasonName: '풍요로운 가을',
      greetingText: '아침저녁으로 선선한 결실의 계절 가을입니다. 올 한 해 계획하셨던 사업 목표들이 풍성한 결실로 맺어지기를 응원합니다.'
    };
  } else {
    return {
      seasonName: '희망찬 겨울',
      greetingText: '날씨가 쌀쌀한 겨울철입니다. 매서운 추위 속에서도 건강 유의하시고, 따뜻하고 뜻깊은 연말연시 보내시길 바랍니다.'
    };
  }
}

/**
 * 대상 인물 맞춤형 4대 테마 안부 서신 자동 합성
 */
export function generateGoldenCareDrafts(person: Person): GoldenCareMessageDraft[] {
  const company = person.currentCompany || '기업';
  const name = person.name;
  const title = person.currentTitle || '리더';
  const season = getCurrentSeasonContext();
  const gapDays = calculateGapDays(person.lastContactDate);

  // 1. 🌱 계절 안부 테마 (Seasonal Greeting)
  const seasonDraft: GoldenCareMessageDraft = {
    theme: 'seasonal_greeting',
    themeLabel: '🌱 계절 안부',
    themeIcon: 'Sun',
    summary: `${season.seasonName}의 기운을 담은 정중하고 따뜻한 안부`,
    smsBody: `${name} ${title}님, 안녕하세요! ${season.seasonName}을 맞아 문득 ${name}님 생각이 나서 따뜻한 안부 여쭙니다. ${company}의 사업도 순항하고 계시는지요? 모쪼록 환절기 건강 유의하시고 편안한 하루 보내십시오.`,
    emailSubject: `[안부 서신] ${company} ${name} ${title}님, ${season.seasonName}을 맞아 정중한 안부 인사 올립니다.`,
    emailBody: `${company} ${name} ${title}님께,\n\n안녕하십니까. ${season.greetingText}\n\n연락드린 지 ${gapDays}여 일이 훌쩍 지나간 듯하여, 바쁘신 일정 속에서도 그간 무탈히 잘 지내고 계신지 안부가 궁금하여 서신 올립니다.\n\n${company}에서 추진하시는 주요 사업과 프로젝트들이 언제나 큰 성과로 이어지기를 진심으로 응원합니다. 언제 강남이나 여의도 근처 오실 일 있으시면 가볍게 차 한 잔 모실 수 있기를 기대하겠습니다.\n\n환절기 건강 유의하십시오.\n\n감사합니다.\n올림`
  };

  // 2. 🎉 영전 / 비즈니스 성과 축하 테마 (Congratulations)
  const isDartPublic = person.sourceType === 'DART_FACT' || person.dartInfo?.isPublicDirector;
  const congratsSubject = isDartPublic
    ? `[축하 인사] ${company} ${name} ${title}님, DART 공시 사업 성과 및 행보에 경의를 표합니다.`
    : `[축하 인사] ${company} ${name} ${title}님의 지속적인 성장과 건승을 응원합니다.`;

  const congratsDraft: GoldenCareMessageDraft = {
    theme: 'congratulations',
    themeLabel: '🎉 영전 & 성과 축하',
    themeIcon: 'Award',
    summary: `${company}의 사업 성과 및 최근 행보에 대한 존경과 축하`,
    smsBody: `${name} ${title}님, 안녕하세요! 최근 ${company}의 도약과 훌륭한 비즈니스 소식을 접하며 무척 반가웠습니다. 언제나 시장을 선도하시는 ${title}님의 탁월한 혜안에 응원의 박수를 보냅니다. 환절기 건강 유의하십시오!`,
    emailSubject: congratsSubject,
    emailBody: `${company} ${name} ${title}님께,\n\n안녕하십니까. 평소 ${company}과 ${name} ${title}님께서 시장에서 보여주고 계신 견고한 리더십과 훌륭한 성과를 늘 깊은 관심과 존경으로 지켜보고 있습니다.\n\n최근 들려오는 반가운 사업 소식과 약진에 진심으로 축하의 말씀을 전하며, ${name}님의 통찰과 헌신이 만들어낸 값진 결실이라 생각합니다.\n\n언제 일정이 허락되실 때 정중히 차 한 잔 모시며 축하의 인사를 직접 전해 올릴 수 있기를 희망합니다.\n\n가정에 늘 건강과 행복이 가득하시길 기원합니다.\n\n감사합니다.\n올림`
  };

  // 3. ☕ 부담 없는 캐주얼 커피/티타임 안부 (Casual Coffee)
  const coffeeDraft: GoldenCareMessageDraft = {
    theme: 'casual_coffee',
    themeLabel: '☕ 가벼운 커피 안부',
    themeIcon: 'Coffee',
    summary: '부담 없이 15~20분 가볍게 차 한 잔 나누는 따뜻한 소통',
    smsBody: `${name} ${title}님, 안녕하세요! 바쁘신 중에 잘 지내시는지요? 문득 차 한 잔 나누며 근황 나누고 싶어 연락드렸습니다. 이번 달 중 판교나 테헤란로 근처 오실 때 15분 정도 가볍게 커피 한 잔 모시겠습니다. 편하실 때 말씀해주세요!`,
    emailSubject: `[따뜻한 안부] ${company} ${name} ${title}님, 틈나실 때 가볍게 차 한 잔 나누고 싶습니다.`,
    emailBody: `${company} ${name} ${title}님께,\n\n안녕하십니까. 한동안 찾아뵙지 못하였으나 늘 감사한 마음으로 ${title}님의 행보를 응원하고 있습니다.\n\n특별한 비즈니스 안건이 아니더라도, 오랜만에 가볍게 20분 내외로 차 한 잔 나누며 그간의 근황과 소소한 업계 이야기를 나누고 싶어 조심스레 연락을 드립니다.\n\n${name}님의 일정에 방해되지 않도록 편하신 장소와 시간대에 맞추어 편히 찾아뵙겠습니다. 모쪼록 편안한 하루 보내시길 바랍니다.\n\n감사합니다.\n올림`
  };

  // 4. 🤝 거시 산업 동향 & 비즈니스 시너지 교류 (Business Synergy)
  const domainText = person.primaryDomain ? `[${person.primaryDomain}]` : '산업 밸류체인';
  const synergyDraft: GoldenCareMessageDraft = {
    theme: 'business_synergy',
    themeLabel: '🤝 사업 & 시너지 교류',
    themeIcon: 'Briefcase',
    summary: `${domainText} 분야의 미래 트렌드 및 협력 시너지 모색`,
    smsBody: `${name} ${title}님, 안녕하세요! 최근 ${domainText} 산업의 급변하는 흐름을 보며 ${name}님의 통찰이 떠올랐습니다. 양사 간 유의미한 시너지 지점에 관해 조만간 편안한 티타임 모시겠습니다. 늘 건승하십시오!`,
    emailSubject: `[산업 동향 교류] ${company} ${name} ${title}님, ${domainText} 트렌드 및 상생 파트너십 티타임 여쭙니다.`,
    emailBody: `${company} ${name} ${title}님께,\n\n안녕하십니까. 급변하는 시장 환경 속에서 ${company}이 보여주고 계신 민첩한 혁신과 전략적 포지셔닝을 늘 인상 깊게 접하고 있습니다.\n\n최근 ${domainText} 영역의 산업 트렌드와 미래 기술 방향성에 관해 ${name} ${title}님의 깊이 있는 시각을 나누어 듣고, 양사가 함께 도모할 수 있는 실질적 시너지 가능성을 가볍게 논의해보고자 합니다.\n\n대표님/임원님의 편하신 시간대에 정중히 모시겠습니다. 일정이 허락되실 때 회신 주시면 감사하겠습니다.\n\n감사합니다.\n올림`
  };

  return [seasonDraft, congratsDraft, coffeeDraft, synergyDraft];
}

/**
 * Web Notification API 브라우저 알림 권한 요청
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission === 'granted') {
    return true;
  }
  if (Notification.permission !== 'denied') {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
  return false;
}

/**
 * 골든타임 VIP 대상 브라우저 푸시 알림 발송 (일 1회 중복 방지)
 */
export function sendGoldenCareNotification(
  target: GoldenCareTarget,
  onClick?: () => void
): boolean {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }
  if (Notification.permission !== 'granted') {
    return false;
  }

  // 하루 1회 중복 발송 제한 (localStorage)
  const todayKey = `connectwe_notif_${target.person.id}_${new Date().toISOString().slice(0, 10)}`;
  if (localStorage.getItem(todayKey)) {
    return false;
  }

  try {
    const notif = new Notification(`🔔 [ConnectWe 골든타임 케어] ${target.person.name} ${target.person.currentTitle}`, {
      body: `${target.person.currentCompany} · 마지막 소통 후 ${target.gapDays}일이 경과했습니다. 따뜻한 안부 서신을 전해보세요.`,
      icon: '/vite.svg',
      tag: `golden-care-${target.person.id}`
    });

    notif.onclick = () => {
      window.focus();
      if (onClick) onClick();
      notif.close();
    };

    localStorage.setItem(todayKey, 'true');
    return true;
  } catch (err) {
    console.warn('Browser notification failed:', err);
    return false;
  }
}

/**
 * 안부 전송 완료 후 소통 공백 해소 & 인물 엔티티 업데이트 (Loop Closing)
 */
export function resolveGoldenCareContact(
  person: Person,
  sentMessageText: string,
  themeLabel: string = '정기 안부'
): Person {
  const todayStr = new Date().toISOString().slice(0, 10);
  const loggedAtStr = new Date().toISOString().replace('T', ' ').slice(0, 16);

  const newActivity: ActivityLog = {
    id: `act-care-${Date.now()}`,
    personId: person.id,
    type: 'message',
    title: `[골든타임 안부] ${themeLabel}`,
    content: sentMessageText,
    loggedAt: loggedAtStr
  };

  return {
    ...person,
    lastContactDate: todayStr,
    isStale: false,
    activityLogs: [newActivity, ...(person.activityLogs || [])],
    memo: person.memo
      ? `${person.memo}\n[${todayStr} 골든타임 안부 완료]: ${themeLabel}`
      : `[${todayStr} 골든타임 안부 완료]: ${themeLabel}`
  };
}
