/**
 * ConnectWe Peer Talent Synergy & Growth Studio Data Types
 * 실무 인재(개발자/디자이너/PM/기획자) 중심 상호 성장 및 협업 허브 타입 계약
 */

// ==========================================
// 1. 테크 스택 & 도메인 랜드스케이프
// ==========================================

export type TechClusterCategory = 
  | 'frontend' 
  | 'backend' 
  | 'ai_data' 
  | 'cloud_devops' 
  | 'product_growth';

export interface TechSkillNode {
  id: string;
  name: string;
  category: TechClusterCategory;
  categoryLabel: string;
  verifiedInProduction: boolean;
  expertCount: number;
  tags: string[];
  description: string;
}

export interface TechExpertMatch {
  personId: string;
  name: string;
  currentCompany: string;
  currentTitle: string;
  closeness: number; // 1 or 2
  experienceHighlight: string;
  productionStack: string[];
  sampleDiscussionTopics: string[];
}

// ==========================================
// 2. 따뜻한 사내 채용 추천 (Warm Referral)
// ==========================================

export interface WarmReferralJob {
  id: string;
  title: string;
  company: string;
  department: string;
  location: string;
  requiredSkills: string[];
  jobLevel: string; // 예: 'Senior (5년+)', 'Lead/Architect (8년+)'
  internalReferrer: {
    personId: string;
    name: string;
    title: string;
    closeness: number;
  };
  referralReward: string; // 예: '합격 시 추천 감사 100만원 지원'
  teamCultureHighlights: string[];
  isOpen: boolean;
}

export interface ReferralLetterPreset {
  type: 'TEA_CHAT_CULTURE' | 'INTERNAL_REFERRAL_ASK' | 'PEER_RECOMMENDATION';
  title: string;
  description: string;
  content: string;
}

// ==========================================
// 3. 스터디 & 사이드 프로젝트 길드
// ==========================================

export type GuildCategory = 
  | 'AI_AGENT' 
  | 'FULLSTACK_TOY' 
  | 'DESIGN_SYSTEM' 
  | 'DEVOPS_FINOPS';

export interface GuildMember {
  id: string;
  name: string;
  role: string;
  company: string;
  joinedAt: string;
}

export interface StudyGuildPod {
  id: string;
  title: string;
  category: GuildCategory;
  categoryLabel: string;
  goal: string;
  leaderName: string;
  leaderCompany: string;
  leaderTitle: string;
  requiredRoles: string[];
  currentMembers: GuildMember[];
  maxMembers: number;
  meetingSchedule: string; // 예: '격주 수요일 밤 9시 (온라인)'
  techStacks: string[];
  status: 'RECRUITING' | 'IN_PROGRESS' | 'COMPLETED';
}

export interface GuildProposalDocument {
  guildId: string;
  shareTitle: string;
  shareBody: string;
}

// ==========================================
// 4. 커피챗 인사이트 & 상호 회고 노트 볼트
// ==========================================

export interface CoffeeChatInsightNote {
  id: string;
  personId: string;
  personName: string;
  company: string;
  title: string;
  metAt: string;
  discussionTheme: string;
  keyTakeaways: string[]; // 3대 실무 배운 점
  recommendedTools: string[]; // 추천 도구/라이브러리
  nextAction: string; // 다음 실행 액션
  gratitudeSent: boolean;
  createdAt: string;
}

export interface GratitudeCardPreset {
  title: string;
  content: string;
}
