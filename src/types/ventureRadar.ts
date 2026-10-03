import { SquadRoleId } from '../services/projectSquadBuilderService';

export type VentureRole = 
  | 'FOUNDER_CEO' 
  | 'CO_FOUNDER_CTO' 
  | 'FOUNDING_MEMBER' 
  | 'STEALTH_BUILDER';

export type FundingStage = 
  | 'STEALTH' 
  | 'BOOTSTRAPPED' 
  | 'PRE_SEED' 
  | 'SEED_TIPS' 
  | 'SERIES_A';

export type VentureSignalType = 
  | 'CORP_REGISTRATION' 
  | 'TIPS_SELECTION' 
  | 'PRE_SEED_ROUND' 
  | 'GITHUB_ORG_LAUNCH' 
  | 'PRODUCT_HUNT_TOP';

export interface EarlyStageVentureSignal {
  id: string;
  personId: string;
  personName: string;
  companyName: string;
  ventureRole: VentureRole;
  fundingStage: FundingStage;
  signalType: VentureSignalType;
  techFocus: string;
  pitchSummary: string;
  missingRoles: SquadRoleId[];
  detectedDate: string; // YYYY-MM-DD
  isCongratulated: boolean;
  congratulatedAt?: string;
}

export interface VentureSummaryStats {
  totalSignals: number;
  stealthCount: number;
  seedTipsCount: number;
  seriesACount: number;
  congratulatedCount: number;
}
