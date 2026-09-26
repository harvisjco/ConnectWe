import { GeoClusterId } from '../services/geoProximityService';
import { TalentClusterId } from '../services/talentClusterEngine';

export interface PrivateSalonSession {
  id: string;
  title: string;
  clusterId: GeoClusterId;
  topic: string;
  scheduledAt: string; // ISO date-time or formatted string
  locationName: string;
  targetTalentClusterIds: TalentClusterId[];
  curatedGuestIds: string[];
  confirmedGuestIds: string[];
  chathamHouseRule: boolean;
  notes?: string;
  status: 'PLANNED' | 'COMPLETED' | 'CANCELLED';
  createdAt: string;
}
