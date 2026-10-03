export type SuperpowerCategory = 
  | 'ENGINEERING' 
  | 'PRODUCT_AI' 
  | 'GROWTH_BIZ' 
  | 'DESIGN_SYSTEM';

export interface SuperpowerTopic {
  id: string;
  title: string;
  category: SuperpowerCategory;
  tags: string[];
}

export interface ExpertMentorProfile {
  id: string;
  personId: string;
  personName: string;
  companyName: string;
  currentTitle: string;
  primaryTopic: SuperpowerTopic;
  solvedCaseSummary: string; // 팩트 기반 실무 해결 경험
  availability: 'COFFEE_CHAT_OPEN' | 'CASUAL_CALL_ONLY' | 'BUSY';
  degree: 1 | 2; // 1촌(내 주소록) | 2촌(사내 동료 공유 인맥)
  bridgeColleagueName?: string; // 2촌인 경우 가교 동료명
  bridgeDepartment?: string;
  recommendedAgenda: [string, string, string]; // 3대 추천 자문 의제
  hasConsulted?: boolean;
  consultedAt?: string;
}

export interface KnowledgeSummaryStats {
  totalTopics: number;
  firstDegreeCount: number;
  secondDegreeCount: number;
  consultedCount: number;
}
