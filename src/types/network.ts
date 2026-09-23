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
