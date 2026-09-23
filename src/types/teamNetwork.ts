export interface TeamMember {
  id: string;
  name: string;
  department: string;
  role: string;
  avatarColor: string;
  contactCount: number;
}

export interface TeamSharedContact {
  id: string;
  ownerMemberId: string;
  ownerMemberName: string;
  ownerDepartment: string;
  targetName: string;
  targetCompany: string;
  targetTitle: string;
  maskedMobile: string; // 010-****-1234 (개인정보 보호 마스킹)
  maskedEmail: string;  // k***@navercorp.com
  relationshipStrength: 'STRONG' | 'MEDIUM' | 'LIGHT';
  lastInteractedAt?: string;
  isDartExecutive?: boolean;
}
