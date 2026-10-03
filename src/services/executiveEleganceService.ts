/**
 * ConnectWe Executive Elegance & Global Showcase Studio Service
 * 비즈니스 품격 일정 조율기, 글로벌 출장 인맥 레이더, 감동 메모 캡슐, 프로덕트 쇼케이스
 */

import { Person } from '../types/network';
import {
  TimeSlotOption,
  MeetingLocationGuide,
  IcsExportData,
  GlobalCityId,
  GlobalCityCluster,
  BusinessTripItinerary,
  LocalReunionMatch,
  ThoughtfulMemoryCapsule,
  SmallTalkCueCard,
  ProductShowcaseItem,
} from '../types/executiveElegance';

// ==========================================
// 로컬 스토리지 키 상수 정의
// ==========================================
const STORAGE_CAPSULES_KEY = 'connectwe_thoughtful_capsules_v1';
const STORAGE_SHOWCASES_KEY = 'connectwe_product_showcase_v1';
const STORAGE_TRIPS_KEY = 'connectwe_business_trips_v1';

// ==========================================
// 1. 비즈니스 품격 일정 조율기 & .ICS 번들러
// ==========================================

export const PRESET_MEETING_LOCATIONS: MeetingLocationGuide[] = [
  {
    id: 'loc_pangyo_kakao',
    zone: 'pangyo',
    zoneLabel: '판교 테크노밸리',
    placeName: '카카오 판교 아지트 라운지 카페 & 비즈니스 코트',
    address: '경기 성남시 분당구 판교역로 166',
    atmosphereBadge: '조용하고 개방적인 프라이빗 테크 미팅',
    parkingAvailable: true,
  },
  {
    id: 'loc_gangnam_josun',
    zone: 'gangnam',
    zoneLabel: '강남 / 테헤란로',
    placeName: '조선 팰리스 서울 강남 1914 라운지',
    address: '서울 강남구 테헤란로 231 센터필드 타워 웨스트 24층',
    atmosphereBadge: '품격 높은 독점적 C-Level 티타임 및 파트너십 협의',
    parkingAvailable: true,
  },
  {
    id: 'loc_yeouido_fairmont',
    zone: 'yeouido',
    zoneLabel: '여의도 금융가',
    placeName: '페어몬트 앰배서더 서울 더 아트리움 라운지',
    address: '서울 영등포구 여의대로 108 파크원',
    atmosphereBadge: '차분한 층고와 정숙한 분위기의 투자·전략 대화',
    parkingAvailable: true,
  },
  {
    id: 'loc_gwanghwamun_fourseasons',
    zone: 'gwanghwamun',
    zoneLabel: '광화문 / 시청',
    placeName: '포시즌스 호텔 서울 마루 라운지',
    address: '서울 종로구 새문안로 97 로비층',
    atmosphereBadge: '정·재계 비공개 회동 및 품격 있는 정숙한 환담',
    parkingAvailable: true,
  },
];

export function getPresetMeetingLocations(): MeetingLocationGuide[] {
  return [...PRESET_MEETING_LOCATIONS];
}

/**
 * 상대방의 부담을 덜어주는 3대 추천 시간대 자동 계산 (기본: 차주 화/목/금)
 */
export function generateTimeSlotRecommendations(
  targetPersonName: string = '파트너',
  baseDate: Date = new Date()
): TimeSlotOption[] {
  const result: TimeSlotOption[] = [];
  const oneDay = 24 * 60 * 60 * 1000;

  // 다음 주 월요일 기준일 찾기
  const currentDay = baseDate.getDay();
  const daysUntilNextMonday = ((8 - currentDay) % 7) || 7;
  const nextMonday = new Date(baseDate.getTime() + daysUntilNextMonday * oneDay);

  // 슬롯 1: 다음 주 화요일 오후 3시 (집중 업무 후 편안한 티타임)
  const slot1Date = new Date(nextMonday.getTime() + 1 * oneDay);
  slot1Date.setHours(15, 0, 0, 0);
  const slot1End = new Date(slot1Date.getTime() + 45 * 60 * 1000);

  // 슬롯 2: 다음 주 목요일 오전 10시 30분 (활기찬 오전 전략 브리프)
  const slot2Date = new Date(nextMonday.getTime() + 3 * oneDay);
  slot2Date.setHours(10, 30, 0, 0);
  const slot2End = new Date(slot2Date.getTime() + 45 * 60 * 1000);

  // 슬롯 3: 다음 주 금요일 오후 4시 (한 주를 마무리하는 여유로운 환담)
  const slot3Date = new Date(nextMonday.getTime() + 4 * oneDay);
  slot3Date.setHours(16, 0, 0, 0);
  const slot3End = new Date(slot3Date.getTime() + 45 * 60 * 1000);

  const formatSlotLabel = (d: Date, desc: string): string => {
    const month = d.getMonth() + 1;
    const day = d.getDate();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const dayName = dayNames[d.getDay()];
    const hours = d.getHours();
    const period = hours < 12 ? '오전' : '오후';
    const displayHours = hours > 12 ? hours - 12 : hours;
    const minutes = d.getMinutes() === 0 ? '00' : d.getMinutes();

    return `${month}월 ${day}일(${dayName}) ${period} ${displayHours}:${minutes} (${desc})`;
  };

  result.push({
    id: 'slot_opt_1',
    dateTimeLabel: formatSlotLabel(slot1Date, '화요일 오후 차담'),
    startIso: slot1Date.toISOString(),
    endIso: slot1End.toISOString(),
    summary: `${targetPersonName}님과의 차분한 애프터눈 티타임`,
  });

  result.push({
    id: 'slot_opt_2',
    dateTimeLabel: formatSlotLabel(slot2Date, '목요일 오전 환담'),
    startIso: slot2Date.toISOString(),
    endIso: slot2End.toISOString(),
    summary: `${targetPersonName}님과의 모닝 전략 교류 티타임`,
  });

  result.push({
    id: 'slot_opt_3',
    dateTimeLabel: formatSlotLabel(slot3Date, '금요일 위크엔드 프리뷰'),
    startIso: slot3Date.toISOString(),
    endIso: slot3End.toISOString(),
    summary: `${targetPersonName}님과의 여유로운 주말 전 환담`,
  });

  return result;
}

/**
 * 정중하고 따뜻한 C-Level 티타임 제안 서신 포맷팅
 */
export function formatTeaTimeProposalLetter(
  targetPersonName: string,
  targetCompany: string,
  topic: string,
  slots: TimeSlotOption[],
  location?: MeetingLocationGuide
): string {
  const greeting = `${targetCompany ? `${targetCompany} ` : ''}${targetPersonName}님, 안녕하십니까.`;
  const locationDesc = location
    ? `\n장소는 조용하고 대화 나누기 편안한 [${location.placeName}](${location.address})을 우선 고려하고 있으나, 편하신 다른 장소가 있으시다면 얼마든지 맞추겠습니다.`
    : '\n장소는 편하신 거점이나 조용한 라운지 어디든 대표님/이사님의 일정에 맞추겠습니다.';

  const slotsList = slots
    .map((s, idx) => `  ${idx + 1}) ${s.dateTimeLabel}`)
    .join('\n');

  return `${greeting}

최근 전해주신 소식과 함께 ${topic ? `[${topic}] 관련하여` : '관련하여'} 여러 인사이트를 뜻깊게 지켜보았습니다.

일정 조율에 번거로움을 드리지 않고자, 제가 가능한 시간대 3가지를 먼저 여쭙습니다. 혹시 이 중 편하신 일정이 있으실지 조심스럽게 여쭙니다.

${slotsList}
${locationDesc}

혹 위 시간대가 모두 빠듯하시다면, 대표님께서 가장 편하신 일정과 장소를 말씀해 주시면 제가 그에 맞추어 찾아뵙겠습니다. 바쁘신 일정 중 편안하실 때 회신 부탁드립니다.

감사합니다.
ConnectWe 드림`;
}

/**
 * RFC 5545 표준 캘린더 (.ics) 파일 데이터 생성
 */
export function generateIcsCalendarFile(data: {
  title: string;
  description: string;
  location: string;
  startIso: string;
  endIso: string;
  organizerName?: string;
  organizerEmail?: string;
}): IcsExportData {
  const formatIcsDate = (isoStr: string): string => {
    const d = new Date(isoStr);
    return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const dtStart = formatIcsDate(data.startIso);
  const dtEnd = formatIcsDate(data.endIso);
  const dtStamp = formatIcsDate(new Date().toISOString());
  const uid = `cw-teatime-${Date.now()}@connectwe.local`;

  // Escape special chars for ICS text fields
  const cleanText = (str: string) =>
    str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const safeTitle = cleanText(data.title);
  const safeDesc = cleanText(data.description);
  const safeLoc = cleanText(data.location);

  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ConnectWe//Executive Elegance Scheduler v1.0//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${safeTitle}`,
    `DESCRIPTION:${safeDesc}`,
    `LOCATION:${safeLoc}`,
    'STATUS:CONFIRMED',
    'TRANSP:OPAQUE',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const icsString = icsLines.join('\r\n');
  const filename = `meeting_${data.title.replace(/[^a-zA-Z0-9가-힣_]/g, '_').slice(0, 20)}_${dtStart.slice(0, 8)}.ics`;

  return {
    icsString,
    filename,
    meetingTitle: data.title,
    location: data.location,
  };
}

// ==========================================
// 2. 글로벌 출장 & 지방 외근 지능형 인맥 레이더
// ==========================================

export const GLOBAL_CITY_CLUSTERS: GlobalCityCluster[] = [
  {
    id: 'san_francisco',
    name: '샌프란시스코 / 실리콘밸리',
    country: '미국 (USA)',
    timezoneLabel: 'PST / PDT (UTC-8)',
    flagEmoji: '🇺🇸',
    keyHubs: ['Palo Alto', 'Mountain View', 'SoMa', 'Sand Hill Road'],
  },
  {
    id: 'tokyo',
    name: '도쿄 / 롯폰기·마루노우치',
    country: '일본 (Japan)',
    timezoneLabel: 'JST (UTC+9)',
    flagEmoji: '🇯🇵',
    keyHubs: ['Roppongi Hills', 'Marunouchi Financial Hub', 'Shibuya Bit Valley'],
  },
  {
    id: 'singapore',
    name: '싱가포르 / 원노스·마리나베이',
    country: '싱가포르 (Singapore)',
    timezoneLabel: 'SGT (UTC+8)',
    flagEmoji: '🇸🇬',
    keyHubs: ['Marina Bay Financial Centre', 'One-North Tech City', 'Raffles Place'],
  },
  {
    id: 'pangyo',
    name: '판교 테크노밸리',
    country: '대한민국 (Korea)',
    timezoneLabel: 'KST (UTC+9)',
    flagEmoji: '🇰🇷',
    keyHubs: ['H스퀘어', '판교 알파돔', '제2테크노밸리 R&D센터'],
  },
  {
    id: 'gangnam',
    name: '강남 / 테헤란로 스타트업 밸리',
    country: '대한민국 (Korea)',
    timezoneLabel: 'KST (UTC+9)',
    flagEmoji: '🇰🇷',
    keyHubs: ['역삼 센터필드', '선릉 테헤란로 VC 클러스터', '신논현 교보타워'],
  },
  {
    id: 'yeouido',
    name: '여의도 금융·핀테크 허브',
    country: '대한민국 (Korea)',
    timezoneLabel: 'KST (UTC+9)',
    flagEmoji: '🇰🇷',
    keyHubs: ['IFC 서울', '파크원', '한국거래소 금융특구'],
  },
  {
    id: 'daedeok_rnd',
    name: '대전 대덕 R&D 특구',
    country: '대한민국 (Korea)',
    timezoneLabel: 'KST (UTC+9)',
    flagEmoji: '🇰🇷',
    keyHubs: ['KAIST 본원', 'ETRI', '정부출연연구소 협력단지'],
  },
  {
    id: 'busan_centum',
    name: '부산 센텀시티 & 블록체인 규제자유특구',
    country: '대한민국 (Korea)',
    timezoneLabel: 'KST (UTC+9)',
    flagEmoji: '🇰🇷',
    keyHubs: ['BEXCO', '센텀스카이비즈', '영화의전당 문화·ICT 밸리'],
  },
];

export function getGlobalCityClusters(): GlobalCityCluster[] {
  return [...GLOBAL_CITY_CLUSTERS];
}

/**
 * 출장 목적지에 위치한 현지 인맥 및 알럼나이 매칭 도출
 */
export function findLocalReunionMatches(
  cityId: GlobalCityId,
  people: Person[] = []
): LocalReunionMatch[] {
  const cluster = GLOBAL_CITY_CLUSTERS.find((c) => c.id === cityId) || GLOBAL_CITY_CLUSTERS[0];
  const cityName = cluster.name;

  // 도시별 연관 키워드 맵
  const cityKeywords: Record<GlobalCityId, string[]> = {
    san_francisco: ['san francisco', 'sf', 'silicon valley', '구글', 'google', 'meta', 'apple', '미국', '글로벌'],
    tokyo: ['tokyo', '도쿄', '일본', 'line', 'softbank', '라쿠텐'],
    singapore: ['singapore', '싱가포르', 'sea', 'grab', '동남아'],
    pangyo: ['판교', '카카오', 'kakao', '네이버', 'naver', '엔씨', '크래프톤'],
    gangnam: ['강남', '테헤란로', '역삼', '선릉', '스타트업', 'toss', '토스', 'vc'],
    yeouido: ['여의도', 'ifc', '증권', '투자', '핀테크', '금융', 'kb', '신한'],
    daedeok_rnd: ['대전', '대덕', 'kaist', '카이스트', 'etri', '연구원', '딥테크'],
    busan_centum: ['부산', '센텀', 'bexco', '해운대', '블록체인', '동남권'],
  };

  const keywords = cityKeywords[cityId] || [];

  // 매칭 검색
  const matchedPeople = people.filter((p) => {
    const textCorpus = `${p.name} ${p.currentCompany || ''} ${p.currentDepartment || ''} ${p.currentTitle || ''} ${p.primaryDomain || ''} ${(p.skills || []).join(' ')} ${p.memo || ''}`.toLowerCase();
    return keywords.some((kw) => textCorpus.includes(kw.toLowerCase()));
  });

  // 매칭 결과가 적을 경우 일반 풀에서 신뢰도가 높은 인맥을 거점 협업 파트너로 스마트 제안
  const candidates = matchedPeople.length > 0 ? matchedPeople : people.slice(0, 3);

  return candidates.map((person) => {
    const closeness = person.closeness || 4;
    const isDirectMatch = matchedPeople.includes(person);

    const reunionReason = isDirectMatch
      ? `${cityName} 지역 비즈니스 및 이전 협업 도메인([${person.currentCompany || '파트너사'}])과의 높은 시너지`
      : `${cityName} 거점 일정 간 현지 네트워크 교류 및 새로운 파트너십 기회 공유`;

    const letter = `안녕하세요 ${person.name}님,
늘 따뜻한 소식 감사드립니다.

이번에 비즈니스 일정으로 [${cityName}] 거점을 방문하게 되었습니다.
${person.currentCompany ? `${person.currentCompany}에서의 다양한 활동` : '최근의 뜻깊은 행보'}을 뵈며 현지에서 가볍게 커피 한 잔 나누며 반갑게 인사드리고 싶어 연락드렸습니다.

현지 일정 중 혹시 30분 정도 편안한 티타임이 가능하신 타이밍이 있으실지요?
바쁘신 일정에 부담 드리지 않도록 계신 곳 근처로 제가 편히 찾아뵙겠습니다.

감사합니다.`;

    return {
      person,
      cityId,
      cityName,
      currentCompany: person.currentCompany || '글로벌 테크 파트너',
      currentTitle: person.currentTitle || '비즈니스 파트너',
      closeness,
      reunionReason,
      invitationLetterTemplate: letter,
    };
  });
}

/**
 * 출장 일정 저장 및 로드
 */
export function getSavedBusinessTrips(): BusinessTripItinerary[] {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_TRIPS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveBusinessTrip(trip: BusinessTripItinerary): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
  try {
    const trips = getSavedBusinessTrips();
    const filtered = trips.filter((t) => t.id !== trip.id);
    filtered.unshift(trip);
    window.localStorage.setItem(STORAGE_TRIPS_KEY, JSON.stringify(filtered));
  } catch {
    // Graceful degradation
  }
}

// ==========================================
// 3. 소소한 감동 메모 캡슐 & 스몰톡 큐카드
// ==========================================

const DEFAULT_MEMORY_CAPSULES: Record<string, ThoughtfulMemoryCapsule> = {
  default_capsule: {
    personId: 'default',
    personName: '소중한 비즈니스 파트너',
    coffeePreference: '산미가 적고 고소한 다크 로스트 핸드드립 커피, 오후 미팅 시에는 디카페인 또는 따뜻한 루이보스티 선호',
    weekendHobby: '주말 10km 한강 러닝 크루 활동, 주말 아침 가족과 함께하는 근교 브런치 투어',
    favoriteDiscussionTopic: 'AI 에이전트 오케스트레이션 자동화, 장기적 지속가능성(ESG)과 테크 조직 문화',
    familyMilestone: '올해 자녀 초등학교 입학, 최근 가족 제주도 여행 준비 중',
    recentGiftRecommendation: {
      giftName: '프리미엄 싱글오리진 디카페인 원두 & 티 바스켓',
      brand: '테라로사 / 오설록 프리미엄',
      priceRange: '3만 ~ 5만 원선',
      reason: '부담스럽지 않으면서도 오후 작업 시 향긋하게 즐기실 수 있는 품격 있는 감동 선물',
    },
    lastUpdated: new Date().toISOString().slice(0, 10),
  },
};

export function getThoughtfulCapsule(
  personId: string,
  personName: string = '비즈니스 파트너'
): ThoughtfulMemoryCapsule {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_CAPSULES_KEY);
      if (raw) {
        const capsules: Record<string, ThoughtfulMemoryCapsule> = JSON.parse(raw);
        if (capsules[personId]) {
          return capsules[personId];
        }
      }
    } catch {
      // Graceful fallback
    }
  }

  // 기본 생성 템플릿
  return {
    ...DEFAULT_MEMORY_CAPSULES.default_capsule,
    personId,
    personName,
  };
}

export function saveThoughtfulCapsule(capsule: ThoughtfulMemoryCapsule): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
  try {
    const raw = window.localStorage.getItem(STORAGE_CAPSULES_KEY);
    const capsules: Record<string, ThoughtfulMemoryCapsule> = raw ? JSON.parse(raw) : {};
    capsules[capsule.personId] = {
      ...capsule,
      lastUpdated: new Date().toISOString().slice(0, 10),
    };
    window.localStorage.setItem(STORAGE_CAPSULES_KEY, JSON.stringify(capsules));
  } catch {
    // Graceful degradation
  }
}

/**
 * 미팅 5분 전 어색함 없는 3대 스몰톡 큐카드 생성
 */
export function generateSmallTalkCueCards(
  capsule: ThoughtfulMemoryCapsule
): SmallTalkCueCard[] {
  return [
    {
      id: 'cue_coffee',
      category: 'coffee',
      categoryLabel: '☕ 취향 존중',
      icebreakerQuestion: `"${capsule.personName}님, 요즘도 ${capsule.coffeePreference.includes('디카페인') ? '디카페인이나 차를 즐겨 드시나요?' : '핸드드립을 즐겨 찾으시나요?'} 오늘 메뉴 고르실 때 추천해 드릴까요?"`,
      tip: '상대방의 세심한 기호를 기억하고 있음을 보여주어 즉각적인 친밀감과 존중감을 형성합니다.',
    },
    {
      id: 'cue_hobby',
      category: 'hobby',
      categoryLabel: '🏃 라이프스타일',
      icebreakerQuestion: `"${capsule.weekendHobby ? `${capsule.weekendHobby.split(',')[0]} 활동은 요즘도 꾸준히 하고 계신지요?` : '주말에 특별히 리프레시하시는 취미가 있으신지요?'}"`,
      tip: '업무 이야기로 급하게 들어가기 전, 상대방이 미소 지을 수 있는 주말 이야기를 먼저 여쭙습니다.',
    },
    {
      id: 'cue_industry',
      category: 'industry',
      categoryLabel: '💡 공통 관심사',
      icebreakerQuestion: `"${capsule.personName}님께서 예전에 말씀해 주셨던 [${capsule.favoriteDiscussionTopic.split(',')[0]}], 최근 업계 흐름을 보며 문득 대표님 생각이 났습니다."`,
      tip: '상대방의 지적 통찰력을 존중하며 자연스럽게 비즈니스 대화의 본론으로 연결합니다.',
    },
    {
      id: 'cue_milestone',
      category: 'milestone',
      categoryLabel: '🎉 가족 & 기념일',
      icebreakerQuestion: capsule.familyMilestone
        ? `"${capsule.familyMilestone} 소식을 전에 들었는데, 가족분들과 좋은 시간 보내고 계신지요?"`
        : `"${capsule.personName}님, 이번 시즌에 특별히 기억에 남는 반가운 경사나 소식이 있으셨나요?"`,
      tip: '지나치게 사적인 경계를 침범하지 않으면서도 따뜻한 안부를 묻는 성숙한 C-Level 에티켓입니다.',
    },
  ];
}

// ==========================================
// 4. 내 프로덕트 & 프로젝트 레퍼런스 쇼케이스
// ==========================================

export const INITIAL_PRODUCT_SHOWCASES: ProductShowcaseItem[] = [
  {
    id: 'prod_connectwe_graph',
    title: 'ConnectWe 실시간 인맥 인텔리전스 그래프 엔진',
    tagline: 'C-Level 비즈니스 관계망 및 DART 공시 기반 지능형 연결 가속 솔루션',
    category: 'b2b_saas',
    categoryLabel: 'B2B SaaS / 엔터프라이즈',
    productionUrl: 'https://connectwe.app',
    keyChallengeSolved: '관계 데이터의 단편화와 영업 은어의 불쾌함을 걷어내고, 인간 중심의 품격 있는 파트너십 협업 룸 제공',
    architectureHighlights: [
      'IndexedDB 기반 E2E 암호화 로컬 퍼스트 볼트 설계',
      'RFC 5545 표준 준수 캘린더 생성 및 DART 지배구조 연계',
      'TypeScript Strict 계약 기반 무결점 상태 관리',
    ],
    metricsSummary: '엔터프라이즈 임원진 미팅 성사율 42% 향상, 관계 리스크 사전 감지율 98%',
    techStack: ['React 18', 'TypeScript', 'Tailwind CSS', 'Vite', 'Lucide Icons'],
    contributors: [
      { name: '김민준', role: 'Chief Product Architect', isVerified: true },
      { name: '이지원', role: 'Principal Design Lead', isVerified: true },
    ],
    endorsementCount: 38,
  },
  {
    id: 'prod_query_acceleration',
    title: '분산 그래프 캐싱 및 1-Page 브리프 생성 파이프라인',
    tagline: '미팅 5분 전 실전 맥락과 스몰톡 큐카드를 실시간 번들링하는 고성능 엔진',
    category: 'ai_deeptech',
    categoryLabel: 'AI & 딥테크 인프라',
    keyChallengeSolved: '대규모 인맥 노드 탐색 시 발생하는 클라이언트 연산 병목을 LRU 캐싱과 벡터 인덱스로 최적화',
    architectureHighlights: [
      '웹 워커 백그라운드 지능형 매칭 파이프라인',
      '글로벌 8대 전략 거점(SF, 도쿄, 싱가포르 등) 클러스터링 알고리즘',
    ],
    metricsSummary: '10,000+ 인맥 그래프 탐색 레이턴시 85% 단축 (15ms 이내)',
    techStack: ['Web Workers', 'Web Crypto API', 'Tailwind', 'Vitest'],
    contributors: [
      { name: '박서현', role: 'Staff Backend Engineer', isVerified: true },
    ],
    endorsementCount: 24,
  },
  {
    id: 'prod_cw_design_system',
    title: 'CW_TOKENS 비즈니스 품격 디자인 시스템',
    tagline: '인간 존중과 C-Level 시각적 편안함을 구현하는 통일된 디자인 토큰 체계',
    category: 'design_system',
    categoryLabel: '디자인 시스템 & UX',
    keyChallengeSolved: '시각적 노이즈를 배제하고 4pt/8pt 픽셀 리듬과 4대 화면 상태(Loading, Empty, Error, Active) 완벽 준수',
    architectureHighlights: [
      'Slate/Emerald/Indigo 조화 팔레트 및 다크/라이트 완벽 대비',
      '스크린 리더 및 키보드 네비게이션 접근성 100% 보장',
    ],
    metricsSummary: '일관된 컴포넌트 재사용률 94%, UI 결함 0건 달성',
    techStack: ['Tailwind CSS', 'Storybook', 'Figma Tokens'],
    contributors: [
      { name: '이지원', role: 'Principal Design Lead', isVerified: true },
    ],
    endorsementCount: 45,
  },
];

export function getProductShowcases(): ProductShowcaseItem[] {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
    return [...INITIAL_PRODUCT_SHOWCASES];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_SHOWCASES_KEY);
    if (raw) {
      const items: ProductShowcaseItem[] = JSON.parse(raw);
      if (Array.isArray(items) && items.length > 0) {
        return items;
      }
    }
  } catch {
    // Graceful degradation
  }
  return [...INITIAL_PRODUCT_SHOWCASES];
}

export function saveProductShowcases(items: ProductShowcaseItem[]): void {
  if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_SHOWCASES_KEY, JSON.stringify(items));
  } catch {
    // Graceful degradation
  }
}

/**
 * 파트너 및 투자자에게 원클릭으로 공유 가능한 1-Page 포트폴리오 브리프 텍스트
 */
export function formatPortfolioBrief(item: ProductShowcaseItem): string {
  const highlights = item.architectureHighlights.map((h) => `- ${h}`).join('\n');
  const stack = item.techStack.join(', ');
  const contributors = item.contributors
    .map((c) => `${c.name} (${c.role})${c.isVerified ? ' [검증 완료]' : ''}`)
    .join(', ');

  return `[프로덕트 쇼케이스 1-Page 브리프]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 프로덕트명: ${item.title}
■ 카테고리: ${item.categoryLabel}
■ 한 줄 요약: ${item.tagline}
${item.productionUrl ? `■ 라이브 데모: ${item.productionUrl}\n` : ''}
■ 핵심 해결 과제:
  ${item.keyChallengeSolved}

■ 주요 아키텍처 및 구현 성과:
${highlights}

■ 정량적 임팩트 / 실측 성과:
  ${item.metricsSummary}

■ 기술 스택: ${stack}
■ 핵심 기여자: ${contributors}
■ 동료 실전 검증 수: ${item.endorsementCount}회
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
자료 제공: ConnectWe Executive Showcase Studio`;
}
