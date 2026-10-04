import { Person, ActivityLog } from '../types/network';

export type ProtocolEventType = 
  | 'CONDOLENCE'                 // 부고/조의
  | 'CONGRATULATION_WEDDING'    // 결혼/화촉
  | 'CONGRATULATION_PROMOTION'  // 승진/영전
  | 'HOLIDAY_GREETING'          // 명절(설/추석) 안부
  | 'FOUNDING_ANNIVERSARY'      // 기업 창립기념일
  | 'BIRTHDAY';                 // 생신/축하

export type AntiGraftCategory = 
  | 'PUBLIC_OFFICIAL'     // 공직자/공무원
  | 'STATE_OWNED'         // 공기업/공공기관 임직원
  | 'JOURNALIST_PRESS'    // 언론인/학계(사립학교)
  | 'PRIVATE_ENTERPRISE'; // 일반 민간기업

export interface AntiGraftGuideline {
  category: AntiGraftCategory;
  categoryLabel: string;
  isSubjectToLaw: boolean;
  cashLimit: string;        // 축의금/조의금 한도
  wreathLimit: string;      // 화환/조화 한도
  giftLimit: string;        // 일반 선물 / 농수산물 한도
  diningLimit: string;      // 원활한 직무수행 목적 식사 가액
  guidanceNote: string;     // 안심 의전 가이드 조언
}

export interface ProtocolEventItem {
  id: string;
  person: Person;
  type: ProtocolEventType;
  title: string;
  targetDate: string; // YYYY-MM-DD
  dDay: number;       // 0: 당일, >0: D-N일 남음, <0: 경과
  urgency: 'HIGH' | 'MEDIUM' | 'NORMAL';
  isResolved: boolean;
  resolvedAt?: string;
  customNote?: string;
}

export interface ProtocolMessageResult {
  person: Person;
  type: ProtocolEventType;
  shortMessage: string;      // 모바일(카카오톡/문자) 정중 서신
  formalLetter: string;      // 장문 최고급 격식 서신
  ribbonCardText: string;    // 화환/동양란/과일바구니 리본 축문
  compliance: AntiGraftGuideline;
}

/**
 * 청탁금지법(김영란법) 적용 여부 및 가액 한도 안심 판정
 */
export function checkAntiGraftCompliance(person: Person): AntiGraftGuideline {
  const company = (person.currentCompany || '').toLowerCase();
  const dept = (person.currentDepartment || '').toLowerCase();
  const title = (person.currentTitle || person.role || '').toLowerCase();

  // 1. 공직자 및 공무원
  if (
    company.includes('부처') || company.includes('청') || company.includes('시청') || 
    company.includes('도청') || company.includes('구청') || company.includes('정부') || 
    company.includes('위원회') || dept.includes('공무원') || title.includes('사무관') || 
    title.includes('국장') || title.includes('과장') || title.includes('차관') || title.includes('장관')
  ) {
    return {
      category: 'PUBLIC_OFFICIAL',
      categoryLabel: '정부 부처 및 공직자',
      isSubjectToLaw: true,
      cashLimit: '50,000원 (축의/조의금)',
      wreathLimit: '100,000원 (화환/조화 별도 가능)',
      giftLimit: '150,000원 (농축수산물 300,000원)',
      diningLimit: '50,000원 (원활한 직무수행/사교 목적)',
      guidanceNote: '직무 관련성이 있는 경우 일체의 금품 수수가 제한되므로, 의전 시 화환 또는 5만원 이내 정중한 조의/축의로 예우하십시오.'
    };
  }

  // 2. 공기업 및 준정부기관
  if (
    company.includes('공사') || company.includes('공단') || company.includes('진흥원') || 
    company.includes('연구원') || company.includes('재단') || company.includes('한전') || 
    company.includes('가스공사') || company.includes('토지주택')
  ) {
    return {
      category: 'STATE_OWNED',
      categoryLabel: '공기업 및 공공기관 임직원',
      isSubjectToLaw: true,
      cashLimit: '50,000원 (축의/조의금)',
      wreathLimit: '100,000원 (화환/조화 별도)',
      giftLimit: '150,000원 (농축수산물 300,000원)',
      diningLimit: '50,000원',
      guidanceNote: '공공기관 임직원 행동강령과 청탁금지법이 적용됩니다. 명절 선물 시 우리 농축수산물 인증 마크가 있는 품목(30만원 한도)을 추천합니다.'
    };
  }

  // 3. 언론사 및 학교 법인
  if (
    company.includes('일보') || company.includes('신문') || company.includes('방송') || 
    company.includes('뉴스') || company.includes('대학') || company.includes('학교') || 
    company.includes('학원') || title.includes('기자') || title.includes('교수')
  ) {
    return {
      category: 'JOURNALIST_PRESS',
      categoryLabel: '언론사 및 교육계 인사',
      isSubjectToLaw: true,
      cashLimit: '50,000원 (화환 100,000원)',
      wreathLimit: '100,000원',
      giftLimit: '150,000원 (농축수산물 300,000원)',
      diningLimit: '50,000원',
      guidanceNote: '언론 및 사립학교 임직원 대상 법정 상한액이 동일 적용됩니다. 격조 높은 서신과 함께 규정 범위 내 정중한 예우를 권장합니다.'
    };
  }

  // 4. 일반 민간기업 (적용 제외 또는 기업 자체 컴플라이언스 준수)
  return {
    category: 'PRIVATE_ENTERPRISE',
    categoryLabel: '민간 기업 경영진 및 파트너',
    isSubjectToLaw: false,
    cashLimit: '상호 비즈니스 관례 및 친밀도 기준 자율',
    wreathLimit: '동양란 / 최고급 축하 화환 자율 예우',
    giftLimit: '기업 비즈니스 품격에 맞춘 명품 선물 자율',
    diningLimit: '비즈니스 오찬/만찬 자율',
    guidanceNote: '청탁금지법 법정 직접 제재 대상은 아니나, 상대 기업의 사내 윤리강령 규정을 존중하여 과도한 의전보다는 정성과 격조를 담은 서신과 함께 진행하십시오.'
  };
}

/**
 * 인맥 데이터 기반 D-Day 임박 경조사 및 의전 대상자 감지
 */
export function detectProtocolEvents(people: Person[]): ProtocolEventItem[] {
  const today = new Date();
  const events: ProtocolEventItem[] = [];

  people.forEach(person => {
    // 1. 생일(Birthday) 체크 (MM-DD 파싱)
    if (person.birthday) {
      const parts = person.birthday.split('-');
      if (parts.length === 2) {
        const month = parseInt(parts[0], 10) - 1;
        const day = parseInt(parts[1], 10);
        const thisYearBirthday = new Date(today.getFullYear(), month, day);
        const diffMs = thisYearBirthday.getTime() - today.getTime();
        const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

        // 7일 전부터 당일까지
        if (diffDays >= -1 && diffDays <= 14) {
          events.push({
            id: `bday-${person.id}`,
            person,
            type: 'BIRTHDAY',
            title: `[생신 축하] ${person.name} ${person.currentTitle}님 생신`,
            targetDate: `${today.getFullYear()}-${person.birthday}`,
            dDay: diffDays,
            urgency: diffDays <= 2 ? 'HIGH' : 'NORMAL',
            isResolved: false
          });
        }
      }
    }

    // 2. DART 승진/영전 인물
    if (person.memo?.includes('승진') || person.memo?.includes('영전') || person.dartInfo?.registeredRole?.includes('대표이사')) {
      events.push({
        id: `promo-proto-${person.id}`,
        person,
        type: 'CONGRATULATION_PROMOTION',
        title: `[영전 축하] ${person.currentCompany} ${person.name} ${person.currentTitle}님 취임/영전`,
        targetDate: today.toISOString().slice(0, 10),
        dDay: 0,
        urgency: 'HIGH',
        isResolved: false
      });
    }

    // 3. 친밀도 높은 VIP 인맥에 대한 명절/시즌 예우 (샘플 큐잉)
    if (person.closeness <= 2 && person.sourceType === 'DART_FACT') {
      events.push({
        id: `season-proto-${person.id}`,
        person,
        type: 'HOLIDAY_GREETING',
        title: `[명절 의전] ${person.name} ${person.currentTitle}님 정기 명절 감사의 뜻 전하기`,
        targetDate: today.toISOString().slice(0, 10),
        dDay: 3,
        urgency: 'MEDIUM',
        isResolved: false
      });
    }
  });

  // 샘플 긴급 부고/결혼 이벤트 보강 (풍부한 데모 경험 제공)
  if (people.length > 0 && !events.some(e => e.type === 'CONDOLENCE')) {
    const p = people.find(p => p.closeness <= 3) || people[0];
    events.unshift({
      id: `condolence-${p.id}`,
      person: p,
      type: 'CONDOLENCE',
      title: `[부고 조의] ${p.currentCompany} ${p.name} ${p.currentTitle}님 빙부상 (부고 의전)`,
      targetDate: today.toISOString().slice(0, 10),
      dDay: 0,
      urgency: 'HIGH',
      isResolved: false
    });
  }

  if (people.length > 1 && !events.some(e => e.type === 'CONGRATULATION_WEDDING')) {
    const p2 = people[1];
    events.push({
      id: `wedding-${p2.id}`,
      person: p2,
      type: 'CONGRATULATION_WEDDING',
      title: `[혼사 축의] ${p2.currentCompany} ${p2.name} ${p2.currentTitle}님 장녀 화촉`,
      targetDate: new Date(today.getTime() + 5 * 86400000).toISOString().slice(0, 10),
      dDay: 5,
      urgency: 'MEDIUM',
      isResolved: false
    });
  }

  return events;
}

/**
 * 상황별 C-Level 격조 높은 서신 및 화환 리본 문구 자동 합성
 */
export function generateProtocolMessage(
  person: Person, 
  type: ProtocolEventType,
  extraDetail?: string
): ProtocolMessageResult {
  const compliance = checkAntiGraftCompliance(person);
  const company = person.currentCompany || '귀사';
  const title = person.currentTitle || '대표/임원';
  const name = person.name;

  let shortMessage = '';
  let formalLetter = '';
  let ribbonCardText = '';

  switch (type) {
    case 'CONDOLENCE':
      shortMessage = `[삼가 조의를 표합니다]\n${name} ${title}님, 갑작스러운 슬픔에 깊은 위로의 마음을 전합니다. 삼가 고인의 명복을 빌며, 유가족분들께도 진심 어린 위로를 올립니다.`;
      formalLetter = `삼가 조의를 표합니다.\n\n${company} ${name} ${title}님,\n갑작스럽게 전해 들은 비보에 비통한 마음을 금할 길이 없습니다.\n\n평소 ${name} ${title}님께서 베풀어주신 따뜻한 가르침과 신뢰를 기억하며, 삼가 고인의 영전에 깊은 애도의 뜻을 표합니다.\n\n유가족분들의 황망한 슬픔에 미력하나마 위로가 되기를 진심으로 바라오며, 고인께서 영원한 평안을 누리시기를 간절히 기도드립니다.\n\n삼가 고인의 명복을 빕니다.`;
      ribbonCardText = `삼가 故人의 冥福을 빕니다\n- 대표이사 배상`;
      break;

    case 'CONGRATULATION_WEDDING':
      shortMessage = `[결혼을 진심으로 축하드립니다]\n${name} ${title}님, 댁내 경사로운 화촉을 진심으로 축하드립니다. 두 분의 새로운 출발에 언제나 건강과 축복이 가득하시길 기원합니다.`;
      formalLetter = `축하의 말씀을 올립니다.\n\n${company} ${name} ${title}님,\n화사한 계절에 전해진 댁내의 경사로운 화촉 소식에 진심으로 축하의 마음을 전합니다.\n\n새로운 인생의 동반자로 서약하는 두 청춘의 앞날에 사랑과 행복이 늘 충만하기를 기원하오며, 화목한 가정을 이루시기를 축복합니다.\n\n바쁘신 와중에도 뜻깊은 날을 맞이하신 ${title}님 가정에 늘 평안과 기쁨이 함께하시기를 진심으로 소망합니다.`;
      ribbonCardText = `祝 華燭의 典 (축 화촉의 전)\n- 대표이사 배상`;
      break;

    case 'CONGRATULATION_PROMOTION':
      shortMessage = `[영전을 축하드립니다]\n${company} ${name} ${title}님의 중책 취임을 마음 깊이 축하드립니다. 탁월한 리더십으로 이끄실 새로운 도약과 건승을 응원합니다.`;
      formalLetter = `영전을 진심으로 축하드립니다.\n\n${company} ${name} ${title}님,\n이번 뜻깊은 영전과 중책 취임 소식을 접하고 기쁜 마음으로 축하의 글을 올립니다.\n\n그동안 보여주신 탁월한 통찰력과 비전이 오늘날 ${company}의 위상을 높이는 큰 초석이 되었음을 확신합니다.\n\n앞으로 ${name} ${title}님의 혜안과 경륜 아래 더 큰 결실과 영광이 함께하시기를 기대하오며, 건승과 댁내의 평안을 축원합니다.`;
      ribbonCardText = `祝 榮轉 (축 영전)\n- 대표이사 배상`;
      break;

    case 'HOLIDAY_GREETING':
      shortMessage = `[명절 안부 인사]\n${name} ${title}님, 풍요롭고 평안한 명절 보내시길 바랍니다. 언제나 보내주시는 성원과 신뢰에 깊이 감사드리며, 건강과 번창을 기원합니다.`;
      formalLetter = `존경하는 ${company} ${name} ${title}님께,\n\n풍요로운 명절을 맞이하여 그동안 보내주신 각별한 신뢰와 따뜻한 배려에 머리 숙여 깊은 감사의 인사를 올립니다.\n\n${name} ${title}님과의 소중한 인연은 당사의 사업 여정에서 가장 든든한 등대이자 큰 힘이 되어 주었습니다.\n\n바쁜 일상을 잠시 내려놓으시고 가족분들과 함께 더없이 넉넉하고 온기 넘치는 시간 보내시기를 소망하오며, 소망하시는 모든 일들이 뜻대로 성취되기를 진심으로 기원합니다.\n\n풍성하고 행복한 명절 되십시오.`;
      ribbonCardText = `謹賀新年 / 豊饒로운 名節\n- 대표이사 배상`;
      break;

    case 'FOUNDING_ANNIVERSARY':
      shortMessage = `[창립기념일 축하]\n${company}의 뜻깊은 창립기념일을 진심으로 축하드립니다. 지속 가능한 성장과 혁신을 이루어 가시는 발걸음을 항상 응원합니다.`;
      formalLetter = `창립기념일을 축하드립니다.\n\n${company} ${name} ${title}님,\n귀사의 영예로운 창립기념일을 맞이하여 진심 어린 축하와 존경의 마음을 전합니다.\n\n창립 이래 산업계의 모범이 되는 혁신과 끊임없는 도전을 거듭해 오신 ${company}의 위대한 발자취에 깊은 경의를 표합니다.\n\n앞으로도 시대를 선도하는 글로벌 리딩 기업으로 더욱 힘차게 비상하시기를 기원하오며, 양사의 굳건한 파트너십 또한 더욱 깊어지기를 기대합니다.`;
      ribbonCardText = `祝 創立記念 (축 창립기념)\n- 대표이사 배상`;
      break;

    case 'BIRTHDAY':
      shortMessage = `[생신을 축하드립니다]\n${name} ${title}님, 뜻깊은 생신을 진심으로 축하드립니다. 오늘 하루 가장 행복하고 따뜻한 시간 되시길 바라며, 늘 건강하시기를 소망합니다.`;
      formalLetter = `생신을 진심으로 축하드립니다.\n\n존경하는 ${name} ${title}님,\n뜻깊은 생신을 맞이하신 오늘, 마음 깊은 축하의 인사를 드립니다.\n\n늘 비즈니스 현장에서 귀감이 되어 주시는 ${title}님의 혜안과 인품에 깊이 감사드리오며, 새해에도 뜻하시는 모든 소망을 이루시고 가정에 기쁨과 화목이 늘 가득하시기를 기원합니다.\n\n오늘 하루 더없이 즐겁고 축복된 날이 되시기를 축원합니다.`;
      ribbonCardText = `祝 壽 (축 수) / 祝 生辰\n- 대표이사 배상`;
      break;
  }

  // 추가 디테일 문구 반영
  if (extraDetail) {
    formalLetter += `\n\n*추신: ${extraDetail}`;
  }

  return {
    person,
    type,
    shortMessage,
    formalLetter,
    ribbonCardText,
    compliance
  };
}

/**
 * 의전 서신 발송 완료 시 소통 기록 갱신 및 활동 로그 저장
 */
export function resolveProtocolAction(
  person: Person,
  eventType: ProtocolEventType,
  copiedText: string
): Person {
  const todayStr = new Date().toISOString().slice(0, 10);
  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const typeLabels: Record<ProtocolEventType, string> = {
    CONDOLENCE: '부고 조의 의전 서신',
    CONGRATULATION_WEDDING: '혼사 축의 서신',
    CONGRATULATION_PROMOTION: '영전/취임 축하 서신',
    HOLIDAY_GREETING: '명절 의전 서신',
    FOUNDING_ANNIVERSARY: '창립기념일 축하 서신',
    BIRTHDAY: '생신 축하 서신'
  };

  const newLog: ActivityLog = {
    id: `log-proto-${Date.now()}`,
    personId: person.id,
    type: 'message',
    title: `[C-Suite 의전 완료] ${typeLabels[eventType]} 발송`,
    content: copiedText.slice(0, 180) + (copiedText.length > 180 ? '...' : ''),
    loggedAt: `${todayStr} ${timeStr}`
  };

  return {
    ...person,
    lastContactDate: todayStr,
    isStale: false,
    activityLogs: [newLog, ...(person.activityLogs || [])]
  };
}
