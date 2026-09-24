import { Person } from './network';

export type HierarchyLevel = 
  | 'CHAIR'          // 이사회 의장 / Founder / 회장
  | 'CEO'            // 대표이사 / 부회장 / 총괄사장
  | 'C_LEVEL'        // C-Level (CTO, CFO, COO, CPO) / 부문장 / 부사장
  | 'DIRECTOR'       // 본부장 / 실장 / 전무 / 상무
  | 'LEADER'         // 팀장 / 그룹장 / 리더 / 이사
  | 'OUTSIDE_AUDIT'; // 사외이사 / 감사

export interface OrgNode {
  id: string;
  corpCode: string;
  corpName: string;
  name: string;
  position: string;
  level: HierarchyLevel;
  chargeJob?: string;
  department?: string;
  isRegistered: boolean;
  registrationType?: string;
  birthYearMonth?: string;
  age?: number;
  remuneration?: string;
  serviceYears?: string;
  termEndDate?: string;
  disclosureDate?: string;
  rceptNo?: string;
  dartUrl?: string; // DART 전자공시 보고서 원문 링크

  // 연도별 시계열 변동 (Diff Tracker)
  diffStatus?: 'NEW' | 'PROMOTED' | 'RETAINED';

  // 내 인맥 연결성 (Network Overlay)
  networkMatch?: {
    degree: 1 | 2; // 1촌 직통 또는 2촌 소개
    matchedPerson: Person;
    bridgePerson?: Person; // 2촌일 경우 경유하는 1촌 지인
    trustScore?: number;   // 2촌 신뢰도 (50~99%)
  };

  // 하위 직속 보고 라인 (자식 노드)
  reports: OrgNode[];
}

export interface CorporateOrgChart {
  corpCode: string;
  corpName: string;
  stockCode?: string;
  industry?: string;
  marketType?: string;
  year: number; // 2026, 2025, 2024, 2023
  basisDate: string; // 기준일
  reportLabel: string;
  stats: {
    totalExecutives: number;
    registeredCount: number;
    unregisteredCount: number;
    firstDegreeCount: number;
    secondDegreeCount: number;
    cLevelCount: number;
  };
  hierarchy: {
    chairpersons: OrgNode[];
    ceos: OrgNode[];
    cLevels: OrgNode[];
    directors: OrgNode[];
    leaders: OrgNode[];
    auditors: OrgNode[];
  };
}

export interface OrgYearComparison {
  year: number;
  label: string;
  ceoNames: string[];
  totalExecutives: number;
  keyChanges?: string[]; // 'OOO 대표이사 신규 선임', 'OOO 부문장 승진' 등
}
