import { TeamMember, TeamSharedContact } from '../types/teamNetwork';

/**
 * 사내 팀 멤버 시뮬레이션 데이터
 */
export const MOCK_TEAM_MEMBERS: TeamMember[] = [
  { 
    id: 'tm-1', 
    name: '김태호', 
    department: '전략기획실', 
    role: '전략이사', 
    avatarColor: 'bg-indigo-600', 
    contactCount: 42 
  },
  { 
    id: 'tm-2', 
    name: '이지은', 
    department: '투자심사본부', 
    role: '수석심사역', 
    avatarColor: 'bg-purple-600', 
    contactCount: 38 
  },
  { 
    id: 'tm-3', 
    name: '박준혁', 
    department: 'HR·피플팀', 
    role: '탤런트리드', 
    avatarColor: 'bg-emerald-600', 
    contactCount: 51 
  },
  { 
    id: 'tm-4', 
    name: '정현우', 
    department: '기술연구소', 
    role: '엔지니어링 리드', 
    avatarColor: 'bg-sky-600', 
    contactCount: 45 
  }
];

/**
 * 사내 동료들이 보유한 공유 2촌 실무 인재 풀 (PII 마스킹 보호 적용)
 */
export const MOCK_PEER_SHARED_CONTACTS: TeamSharedContact[] = [
  {
    id: 'shared-peer-infra-1',
    ownerMemberId: 'tm-4',
    ownerMemberName: '정현우 엔지니어링 리드',
    ownerDepartment: '기술연구소',
    targetName: '강동원',
    targetCompany: '메가클라우드 시스템즈',
    targetTitle: '클라우드 인프라 & DevOps 수석 아키텍트',
    maskedMobile: '010-****-8821',
    maskedEmail: 'd***@megacloud.io',
    relationshipStrength: 'STRONG',
    lastInteractedAt: '2026-09-18',
    isDartExecutive: false,
    skills: ['AWS', 'Kubernetes', 'Docker', 'Go', 'PostgreSQL', 'MSA', 'Terraform'],
    primaryDomain: '클라우드 인프라'
  },
  {
    id: 'shared-peer-frontend-1',
    ownerMemberId: 'tm-4',
    ownerMemberName: '정현우 엔지니어링 리드',
    ownerDepartment: '기술연구소',
    targetName: '윤서진',
    targetCompany: '넥스트웹 인터랙티브',
    targetTitle: '시니어 프론트엔드 테크리드',
    maskedMobile: '010-****-3392',
    maskedEmail: 's***@nextweb.kr',
    relationshipStrength: 'STRONG',
    lastInteractedAt: '2026-09-25',
    isDartExecutive: false,
    skills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS', 'Web Performance'],
    primaryDomain: '웹/모바일 플랫폼'
  },
  {
    id: 'shared-peer-ai-1',
    ownerMemberId: 'tm-2',
    ownerMemberName: '이지은 수석심사역',
    ownerDepartment: '투자심사본부',
    targetName: '문성호',
    targetCompany: '딥코어 인공지능연구소',
    targetTitle: 'LLM 파이프라인 수석 연구원',
    maskedMobile: '010-****-7104',
    maskedEmail: 's***@deepcore.ai',
    relationshipStrength: 'STRONG',
    lastInteractedAt: '2026-08-30',
    isDartExecutive: false,
    skills: ['Python', 'AI', 'LLM', 'PyTorch', 'LangChain', 'Deep Learning'],
    primaryDomain: 'AI/LLM'
  },
  {
    id: 'shared-peer-design-1',
    ownerMemberId: 'tm-3',
    ownerMemberName: '박준혁 탤런트리드',
    ownerDepartment: 'HR·피플팀',
    targetName: '송하은',
    targetCompany: '미니멀디자인 스튜디오',
    targetTitle: '프로덕트 디자인 디렉터',
    maskedMobile: '010-****-5520',
    maskedEmail: 'h***@minimaldesign.co',
    relationshipStrength: 'STRONG',
    lastInteractedAt: '2026-09-10',
    isDartExecutive: false,
    skills: ['Figma', 'UI/UX', 'Design System', 'Prototyping', 'User Testing'],
    primaryDomain: 'UI/UX 디자인'
  },
  {
    id: 'shared-peer-growth-1',
    ownerMemberId: 'tm-1',
    ownerMemberName: '김태호 전략이사',
    ownerDepartment: '전략기획실',
    targetName: '장민수',
    targetCompany: '스케일업 파트너스',
    targetTitle: 'B2B 엔터프라이즈 사업개발 팀장',
    maskedMobile: '010-****-9912',
    maskedEmail: 'm***@scaleup.biz',
    relationshipStrength: 'STRONG',
    lastInteractedAt: '2026-09-05',
    isDartExecutive: false,
    skills: ['B2B Sales', 'Partnership', 'Growth Hacking', 'GTM Strategy'],
    primaryDomain: '사업개발'
  },
  {
    id: 'shared-peer-pm-1',
    ownerMemberId: 'tm-3',
    ownerMemberName: '박준혁 탤런트리드',
    ownerDepartment: 'HR·피플팀',
    targetName: '배유진',
    targetCompany: '에자일프로덕트 랩',
    targetTitle: '리드 프로덕트 매니저 (PO)',
    maskedMobile: '010-****-4431',
    maskedEmail: 'y***@agilelab.com',
    relationshipStrength: 'MEDIUM',
    lastInteractedAt: '2026-07-22',
    isDartExecutive: false,
    skills: ['PM', 'Agile', 'Product Strategy', 'Roadmapping', 'Data Analysis'],
    primaryDomain: 'SaaS 플랫폼'
  },
  {
    id: 'shared-peer-app-1',
    ownerMemberId: 'tm-4',
    ownerMemberName: '정현우 엔지니어링 리드',
    ownerDepartment: '기술연구소',
    targetName: '임재원',
    targetCompany: '모빌리티X 테크',
    targetTitle: '크로스플랫폼 모바일 앱 수석 개발자',
    maskedMobile: '010-****-6678',
    maskedEmail: 'j***@mobilityx.io',
    relationshipStrength: 'STRONG',
    lastInteractedAt: '2026-09-14',
    isDartExecutive: false,
    skills: ['Flutter', 'iOS', 'Android', 'React Native', 'TypeScript'],
    primaryDomain: '모바일 앱'
  },
  {
    id: 'shared-peer-exec-1',
    ownerMemberId: 'tm-1',
    ownerMemberName: '김태호 전략이사',
    ownerDepartment: '전략기획실',
    targetName: '이해진',
    targetCompany: 'NAVER',
    targetTitle: '글로벌투자책임자(GIO) / 이사회 의장',
    maskedMobile: '010-****-1999',
    maskedEmail: 'h***@navercorp.com',
    relationshipStrength: 'STRONG',
    lastInteractedAt: '2026-05-12',
    isDartExecutive: true,
    skills: ['글로벌 투자', '경영 전략'],
    primaryDomain: '플랫폼'
  }
];
