// ConnectWe Core Graph & Network Type Definitions
// Fact-grounded Provenance & Multi-dimensional Person Intelligence

export type DataSourceType = 'DART_FACT' | 'SOURCE_DATA' | 'ESTIMATED';

export type AgeGroup = '20s' | '30s' | '40s' | '50s_plus';

export type CompanyTier = 'bigtech' | 'unicorn' | 'finance_vc' | 'enterprise' | 'startup';

export interface CareerHistory {
  id: string;
  companyName: string;
  department?: string;
  title: string;
  startYear: number;
  endYear?: number;
  isCurrent: boolean;
  isAlumniTarget?: boolean; // 네이버, 삼성전자, 맥킨지, 카카오 등 주요 알럼나이 추적
  source: DataSourceType;
}

export interface AcademicBackground {
  schoolName: string;
  degree?: string;
  major?: string;
  graduationYear?: number;
  source: DataSourceType;
}

export interface DartFactInfo {
  corpCode: string;
  stockName: string;
  isPublicDirector: boolean;
  registeredRole: string; // 예: 사내이사, 미등기임원, 대표이사
  registeredTerm?: string;
  verifiedAt: string;
  ownershipShares?: number;
  rceptNo?: string;
  remuneration?: string;
  reportLabel?: string;
}

export type ActivityLogType = 'call' | 'meeting' | 'email' | 'note';

export interface ActivityLog {
  id: string;
  personId: string;
  type: ActivityLogType;
  title: string;
  content?: string;
  loggedAt: string; // YYYY-MM-DD HH:mm
}

export interface Person {
  id: string;
  name: string;
  currentCompany: string;
  currentDepartment: string;
  currentTitle: string;
  mobile: string;
  email: string;
  directPhone?: string;
  birthYear?: number;
  estimatedAgeGroup: AgeGroup;
  isAgeEstimated: boolean;
  primaryDomain: string; // 예: 'AI/LLM', '클라우드 인프라', 'VC 투자', '반도체 설계', 'M&A/재무'
  skills: string[];
  careers: CareerHistory[];
  academics: AcademicBackground[];
  sourceType: DataSourceType;
  dartInfo?: DartFactInfo;
  closeness: 1 | 2 | 3 | 4 | 5; // 1: Me, 2: 절친/핵심 1촌, 3: 일반 1촌(명함), 4: 2촌 접점, 5: 잠재 풀
  connectionChannel: 'remember' | 'vcard' | 'business_card' | 'dart' | 'manual';
  lastContactDate?: string;
  isStale: boolean; // 6개월 이상 소통 단절
  memo?: string;
  activityLogs?: ActivityLog[];
  address?: string;
  website?: string;
}

export interface CompanySummary {
  id: string;
  name: string;
  tier: CompanyTier;
  isListed: boolean;
  stockCode?: string;
  currentEmployees: Person[];
  alumniEmployees: Person[];
}

export interface GraphNode {
  id: string;
  label: string;
  subLabel?: string;
  type: 'me' | 'person' | 'company' | 'school' | 'domain';
  category?: string;
  closeness?: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  rawPerson?: Person;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: 'WORKS_AT' | 'WORKED_AT' | 'ALUMNI_OF' | 'KNOWS' | 'COLLEAGUE_WITH';
  label: string;
  dashed?: boolean;
  color?: string;
}

export interface GraphQueryResult {
  query: string;
  matchedPeople: Person[];
  reasoning: string;
  highlightNodeIds: string[];
  relatedCompanies: string[];
  filterTags: string[];
}

// --------------------------------------------------
// 인맥 기반 채용 추천 & 베네핏(Referral Bounty) 시스템
// --------------------------------------------------

export interface ReferralRewardStructure {
  coffeeChatReward: number;   // 1단계: 커피챗 수락 보상 (원, 예: 50,000)
  interviewReward: number;    // 2단계: 1차 면접 진행 보상 (원, 예: 200,000)
  hireSuccessBounty: number;  // 3단계: 최종 입사 성공 바운티 (원, 예: 3,000,000)
  probationBounty?: number;   // 4단계: 수습(3개월) 통과 보너스 (원, 예: 1,000,000)
}

export interface ReferralPosition {
  id: string;
  title: string;
  clientCompany: string;
  industry: string;
  department: string;
  salaryRange: string;
  location: string;
  targetExperienceYears: string;
  targetAgeGroup?: AgeGroup[];
  targetAlumniCompanies?: string[]; // 선호 알럼나이 (예: 네이버, 삼성전자, 쿠팡 등)
  keyRequirements: string[];
  rewards: ReferralRewardStructure;
  urgentBadge?: string;
  description: string;
  deadline?: string;
  isOpen: boolean;
}

export interface ReferralCandidateMatch {
  person: Person;
  positionId: string;
  matchScore: number; // 0 ~ 100
  matchReasons: string[];
  alumniMatchCompany?: string;
  isRecommended: boolean;
}

export type ReferralStatus = 
  | 'draft'                  // 추천서 작성 중
  | 'invitation_sent'        // 지인에게 비공개 타진 전달
  | 'coffee_chat_accepted'   // 지인이 커피챗 수락 (1단계 리워드 확정)
  | 'interviewing'           // 공식 면접 진행 중 (2단계 리워드 확정)
  | 'hired_placed'           // 최종 입사 성공 (3단계 대형 바운티 확정)
  | 'completed'              // 수습 통과 및 전액 정산 완료
  | 'rejected'               // 불합격 또는 포기
  | 'declined_by_candidate'; // 지인의 정중한 거절

export interface ReferralSubmission {
  id: string;
  positionId: string;
  positionTitle: string;
  clientCompany: string;
  personId: string;
  candidateName: string;
  candidateTitle: string;
  candidateCompany: string;
  status: ReferralStatus;
  recommendationNote: string;
  submittedAt: string;
  updatedAt: string;
  earnedRewards: {
    coffeeChatPaid: boolean;
    interviewPaid: boolean;
    hirePaid: boolean;
    totalAmount: number;
  };
}

