/**
 * ConnectWe Peer Trust & Career Acceleration Studio Types
 * 실무 인재(개발자/디자이너/PM/기획자) 신뢰 보증 및 커리어 도약 스튜디오 타입 계약
 */

// ==========================================
// 1. 피어 실무 보증 & 신뢰 뱃지
// ==========================================

export type StrengthCategory = 'technical' | 'product' | 'collaboration' | 'leadership';

export interface EndorsementStrengthTag {
  id: string;
  label: string;
  category: StrengthCategory;
  categoryLabel: string;
  description: string;
}

export interface PeerEndorsement {
  id: string;
  targetPersonId: string;
  targetPersonName: string;
  endorserPersonId: string;
  endorserName: string;
  endorserTitle: string;
  endorserCompany: string;
  relationship: string; // 예: '프로젝트 공동 개발 동료', '스쿼드 협업 파트너'
  selectedStrengths: string[]; // 3대 실무 강점 태그 ID
  memo: string; // 정성적 3줄 실무 추천 메모
  createdAt: string;
  thankYouNoteSent: boolean;
}

export interface EndorsementSummary {
  personId: string;
  personName: string;
  totalEndorsements: number;
  topStrengths: { tagId: string; label: string; count: number }[];
  recentEndorsements: PeerEndorsement[];
  isPeerVerified: boolean;
}

// ==========================================
// 2. 모바일 1-Page 디지털 실무 명함 & QR vCard
// ==========================================

export interface DigitalCardProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  department: string;
  phone: string;
  email: string;
  githubUrl?: string;
  portfolioUrl?: string;
  productionStack: string[];
  currentFocusProject: string;
  consultingTopics: string[]; // 자문 가능한 3대 주제
  shortBio: string;
  isPublicMasked?: boolean;
}

export interface VCardExportData {
  vcfString: string;
  qrPayload: string;
  maskedPhone: string;
  maskedEmail: string;
}

// ==========================================
// 3. 크로스 직무 1:1 캐주얼 커피챗 룰렛
// ==========================================

export type RouletteRole = 'frontend' | 'backend' | 'designer' | 'pm' | 'marketing' | 'data';

export interface RouletteParticipant {
  id: string;
  name: string;
  role: RouletteRole;
  roleLabel: string;
  company: string;
  title: string;
  closeness: number;
  topicsOfInterest: string[];
  recentHighlight: string;
}

export interface CoffeeRouletteMatch {
  id: string;
  partner: RouletteParticipant;
  matchedTopics: string[];
  icebreakerQuestions: string[]; // 3대 아이스브레이킹 대화 의제
  suggestedSchedule: string;
  invitationMessage: string;
  isScheduled: boolean;
}

// ==========================================
// 4. 커리어 패스 & 스킬 갭 멘토 매칭
// ==========================================

export interface CareerGoalTrack {
  id: string;
  targetRole: string;
  category: string;
  description: string;
  typicalTenure: string; // 예: '시니어 5년+ 이상 단계'
  requiredCompetencies: string[];
  recommendedRoadmapSteps: string[];
}

export interface SkillGapItem {
  skill: string;
  category: string;
  importance: 'high' | 'medium';
  mentorCount: number;
  isAcquired: boolean;
}

export interface CareerMentorMatch {
  personId: string;
  name: string;
  title: string;
  company: string;
  closeness: number;
  expertInSkills: string[];
  adviceTopic: string;
  introNoteTemplate: string;
}

export interface CareerPathAnalysis {
  goal: CareerGoalTrack;
  acquiredSkills: string[];
  skillGaps: SkillGapItem[];
  matchedMentors: CareerMentorMatch[];
  readinessScore: number; // 0 ~ 100
}
