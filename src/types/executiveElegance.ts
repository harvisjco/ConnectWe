/**
 * ConnectWe Executive Elegance & Global Showcase Studio Types
 * 비즈니스 품격 일정 조율기, 글로벌 출장 인맥 레이더, 감동 메모 캡슐, 프로덕트 쇼케이스 타입 계약
 */

import { Person } from './network';

// ==========================================
// 1. 비즈니스 품격 일정 조율기 & .ICS 번들러
// ==========================================

export interface TimeSlotOption {
  id: string;
  dateTimeLabel: string; // 예: '다음 주 화요일 (10/20) 오후 3:00'
  startIso: string;
  endIso: string;
  summary: string;
}

export interface MeetingLocationGuide {
  id: string;
  zone: 'pangyo' | 'gangnam' | 'yeouido' | 'gwanghwamun';
  zoneLabel: string;
  placeName: string;
  address: string;
  atmosphereBadge: string; // 예: '조용하고 프라이빗한 비즈니스 미팅'
  parkingAvailable: boolean;
}

export interface IcsExportData {
  icsString: string;
  filename: string;
  meetingTitle: string;
  location: string;
}

// ==========================================
// 2. 글로벌 출장 & 지방 외근 지능형 인맥 레이더
// ==========================================

export type GlobalCityId = 
  | 'san_francisco'
  | 'tokyo'
  | 'singapore'
  | 'pangyo'
  | 'gangnam'
  | 'yeouido'
  | 'daedeok_rnd'
  | 'busan_centum';

export interface GlobalCityCluster {
  id: GlobalCityId;
  name: string;
  country: string;
  timezoneLabel: string;
  flagEmoji: string;
  keyHubs: string[];
}

export interface BusinessTripItinerary {
  id: string;
  destinationCity: GlobalCityId;
  startDate: string;
  endDate: string;
  tripPurpose: string;
  meetingFocus: string;
}

export interface LocalReunionMatch {
  person: Person;
  cityId: GlobalCityId;
  cityName: string;
  currentCompany: string;
  currentTitle: string;
  closeness: number;
  reunionReason: string;
  invitationLetterTemplate: string;
}

// ==========================================
// 3. 소소한 감동 메모 캡슐 & 스몰톡 큐카드
// ==========================================

export interface ThoughtfulMemoryCapsule {
  personId: string;
  personName: string;
  coffeePreference: string; // 예: '산미 적고 고소한 다크 로스트 핸드드립, 디카페인 선호'
  weekendHobby: string;     // 예: '주말 10km 러닝 크루, 테니스 레슨'
  favoriteDiscussionTopic: string; // 예: '오프그리드 캠핑, AI 에이전트 자동화'
  familyMilestone?: string; // 예: '올해 첫째 아이 초등학교 입학'
  recentGiftRecommendation: {
    giftName: string;
    priceRange: string;
    brand: string;
    reason: string;
  };
  keyMoments?: string[];
  lastUpdated: string;
}

export interface SmallTalkCueCard {
  id: string;
  category: 'hobby' | 'coffee' | 'milestone' | 'industry';
  categoryLabel: string;
  icebreakerQuestion: string;
  tip: string;
}

// ==========================================
// 4. 내 프로덕트 & 프로젝트 레퍼런스 쇼케이스
// ==========================================

export interface ProductShowcaseItem {
  id: string;
  title: string;
  tagline: string;
  category: 'b2b_saas' | 'infrastructure' | 'ai_deeptech' | 'design_system';
  categoryLabel: string;
  productionUrl?: string;
  githubUrl?: string;
  keyChallengeSolved: string;
  architectureHighlights: string[];
  metricsSummary: string; // 예: '월간 API 호출 4,000만 건 무중단, 클라우드 비용 38% 절감'
  techStack: string[];
  contributors: {
    name: string;
    role: string;
    isVerified: boolean;
  }[];
  endorsementCount: number;
}
