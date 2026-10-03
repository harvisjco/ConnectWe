/**
 * ConnectWe Network Vitality & Meetup Hub Studio Types
 * 관계 생명력 레이더, 현장 밋업 룸, 글로벌 바이링구얼 미팅, 실무 SOS 헬프데스크 타입 계약
 */

import { Person } from './network';

// ==========================================
// 1. 관계 생명력 & 안부 레이더 (Vitality Radar)
// ==========================================

export type VitalityLevel = 
  | 'active'     // 🟢 활발한 교류 (30일 이내)
  | 'stable'     // 🟡 안정적 (90일 이내)
  | 'needs_care' // 🟠 안부 권장 (180일 이내)
  | 'at_risk';   // ⚪ 자연 소멸 위험 (180일 초과)

export interface VitalityPersonInfo {
  person: Person;
  daysSinceLastContact: number;
  vitalityLevel: VitalityLevel;
  vitalityScore: number; // 0 ~ 100
  recentGoodNews?: string; // 최근 회사 좋은 소식 (예: 신규 투자 유치, 신제품 론칭)
  recommendedCadenceDays: number;
  lastContactDate: string;
}

export type SeasonGreetingType = 
  | 'CHANGE_OF_SEASON' // 환절기 건강 안부
  | 'QUARTER_END'      // 분기 마무리 격려
  | 'HOLIDAY_NEW_YEAR' // 명절 및 신년 덕담
  | 'CASUAL_COFFEE';   // 부담 없는 가벼운 커피 제안

export interface SeasonGreetingPreset {
  type: SeasonGreetingType;
  label: string;
  description: string;
}

// ==========================================
// 2. 현장 밋업 & 컨퍼런스 네트워킹 룸 (Meetup Room)
// ==========================================

export interface MeetupParticipant {
  id: string;
  name: string;
  company: string;
  title: string;
  role: 'developer' | 'designer' | 'pm' | 'executive' | 'founder';
  roleLabel: string;
  skills: string[];
  seekingTopics: string[];
  checkedInAt: string;
  vCardAvailable: boolean;
}

export interface MeetupRoom {
  id: string;
  roomCode: string; // 6자리 코드 (예: 'DEV2026')
  title: string;
  hostName: string;
  location: string;
  createdAt: string;
  participants: MeetupParticipant[];
  recommendedMatches: {
    participantA: MeetupParticipant;
    participantB: MeetupParticipant;
    commonTopics: string[];
    icebreaker: string;
  }[];
}

// ==========================================
// 3. 글로벌 바이링구얼 미팅 인텔리전스 (Bilingual Meeting)
// ==========================================

export interface BilingualMeetingSummary {
  id: string;
  meetingTitle: string;
  partnerName: string;
  partnerCompany: string;
  partnerTimezone: string; // 예: 'America/Los_Angeles (PST)'
  meetingDate: string;
  koreanBrief: {
    keyAgreements: string[];
    productSpecs: string[];
    actionItems: string[];
  };
  englishFollowUpEmail: {
    subject: string;
    body: string;
  };
  suggestedNextMeetingTime: {
    koreanTime: string;
    partnerTime: string;
  };
}

// ==========================================
// 4. 크로스 컴퍼니 실무 난제 SOS 헬프데스크 (Peer SOS)
// ==========================================

export type ProblemCategory = 
  | 'infra_cloud'    // 클라우드/인프라/비용
  | 'frontend_ux'    // 프론트엔드/디자인시스템
  | 'ai_data'        // AI/LLM/데이터
  | 'growth_biz';    // 과금/수수료/성장

export interface PeerProblemTicket {
  id: string;
  title: string;
  category: ProblemCategory;
  categoryLabel: string;
  description: string;
  confidentialMasked: boolean;
  status: 'OPEN' | 'IN_DISCUSSION' | 'RESOLVED';
  createdAt: string;
  matchedAdvisors: {
    personId: string;
    name: string;
    company: string;
    title: string;
    provenExperience: string;
    closeness: number;
    adviceLetterTemplate: string;
  }[];
}
