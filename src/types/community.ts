// ConnectWe 일반 회원 전용 동문 네트워크 & 소모임 커뮤니티 데이터 모델

export type EducationCategory = 
  | 'elementary' 
  | 'middle' 
  | 'high' 
  | 'university' 
  | 'grad_school' 
  | 'major' 
  | 'club' 
  | 'company';

export interface AlumniGroup {
  id: string;
  category: EducationCategory;
  categoryLabel: string;
  name: string;
  description: string;
  iconName: string;
  memberCount: number;
  memberIds: string[];
}

export interface GatheringAttendee {
  personId: string;
  name: string;
  company: string;
  title: string;
  joinedAt: string;
}

export interface Gathering {
  id: string;
  groupId?: string;
  groupName: string;
  title: string;
  category: '동문회' | '정기모임' | '번개티타임' | '골프/운동' | '세미나/스터디' | '축하모임';
  dateTime: string; // YYYY-MM-DD HH:mm
  location: string;
  maxAttendees: number;
  fee?: string; // 예: "1/N (약 3만원)" 또는 "무료"
  organizerName: string;
  organizerContact?: string;
  description: string;
  attendees: GatheringAttendee[];
  status: 'RECRUITING' | 'CLOSED' | 'COMPLETED';
}

export interface BirthdayContact {
  id: string;
  name: string;
  company: string;
  title: string;
  birthday: string; // MM-DD
  daysUntil: number; // 0: 오늘, 1: 내일, etc.
  isToday: boolean;
  mobile: string;
  hasCongratulated: boolean;
}
