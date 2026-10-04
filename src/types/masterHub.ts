/**
 * ConnectWe Enterprise Master Hubs Type Contracts
 * 3대 엔터프라이즈 마스터 허브 (경영 거버넌스, 실무 인재 생태계, 미팅 라이프사이클) 상태 및 탭 인터페이스
 */

import { Person } from './network';

export type MasterHubType = 'governance' | 'talent' | 'meeting' | null;

// Hub 1: Executive Governance & Strategy Master Hub Tabs
export type GovernanceHubTab = 'governance' | 'disclosures' | 'succession' | 'intelligence';

// Hub 2: Talent & Career Ecosystem Master Hub Tabs
export type TalentHubTab = 'squad' | 'venture' | 'trust_card' | 'knowledge_guild' | 'sos_desk';

// Hub 3: Meeting & Relationship Lifecycle Master Hub Tabs
export type MeetingHubTab = 'schedule' | 'brief' | 'meetup' | 'debrief' | 'followup';

export type MasterHubTab = GovernanceHubTab | TalentHubTab | MeetingHubTab;

export interface MasterHubState {
  activeHub: MasterHubType;
  initialTab?: MasterHubTab | string;
  contextPerson?: Person | null;
  contextCorp?: string;
  metadata?: Record<string, unknown>;
}
