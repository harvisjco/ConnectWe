import { ReferralPosition } from '../types/network';

export const MOCK_REFERRAL_POSITIONS: ReferralPosition[] = [
  {
    id: 'pos-001',
    title: 'CTO / 인프라플랫폼 본부 총괄',
    clientCompany: '(주)하이퍼클라우드',
    industry: '클라우드 / 분산 시스템 / AI 인프라',
    department: '기술개발 총괄본부',
    salaryRange: '2억 2,000만 ~ 2억 8,000만원 + 스톡옵션',
    location: '서울 강남구 테헤란로 (선릉역 인근)',
    targetExperienceYears: '15년 이상',
    targetAgeGroup: ['40s'],
    targetAlumniCompanies: ['네이버', '카카오', '삼성전자', '쿠팡'],
    keyRequirements: [
      '대규모 분산 클라우드 아키텍처 설계 및 100명 이상 개발조직 리딩 경험',
      'Kubernetes, 온프레미스-멀티클라우드 하이브리드 환경 총괄 경험',
      'C-Level 또는 VP급 리더십 역량'
    ],
    rewards: {
      coffeeChatReward: 50000,
      interviewReward: 200000,
      hireSuccessBounty: 4500000,
      probationBounty: 1000000
    },
    urgentBadge: '🔥 C-Level 급구',
    description: '시리즈 C 700억원 투자 유치 완료 기업으로, 엔터프라이즈 AI 클라우드 사업 확장을 이끌 최고기술책임자를 모십니다.',
    deadline: '2024-11-30',
    isOpen: true
  },
  {
    id: 'pos-002',
    title: 'AI R&D 연구소장 (의료영상 파운데이션 모델)',
    clientCompany: '넥스트비전 AI',
    industry: '의료 AI / 헬스케어 / Computer Vision',
    department: 'Core AI 리서치 센터',
    salaryRange: '1억 8,000만 ~ 2억 4,000만원 + 성과급',
    location: '경기 성남시 분당구 판교 유스페이스',
    targetExperienceYears: '10년 이상 (박사 우대)',
    targetAgeGroup: ['30s', '40s'],
    targetAlumniCompanies: ['네이버', '카카오', 'LG AI연구원', '삼성전자'],
    keyRequirements: [
      '의료영상/Vision-Language 모델 논문(CVPR, ICCV, MICCAI) 게재 실적',
      '파운데이션 모델 사전학습(Pre-training) 및 도메인 파인튜닝 파이프라인 구축 경험',
      'AI 리서처 팀 리딩 역량'
    ],
    rewards: {
      coffeeChatReward: 50000,
      interviewReward: 200000,
      hireSuccessBounty: 3500000,
      probationBounty: 500000
    },
    urgentBadge: '⚡ 예비유니콘',
    description: '미국 FDA 승인 파이프라인을 보유한 의료 AI 선도기업으로 생성형 의료 AI 연구개발 총괄자를 영입합니다.',
    deadline: '2024-12-15',
    isOpen: true
  },
  {
    id: 'pos-003',
    title: 'Principal / 테크 딥테크 투자심사역 (VP)',
    clientCompany: '알토스캐피탈 파트너스',
    industry: 'VC / PE / 사모펀드',
    department: '글로벌 벤처투자본부',
    salaryRange: '1억 5,000만 ~ 2억 2,000만원 + Carried Interest',
    location: '서울 강남구 역삼로 마루180',
    targetExperienceYears: '8년 이상',
    targetAgeGroup: ['30s', '40s'],
    targetAlumniCompanies: ['맥킨지', '베인', 'BCG', '삼성전자', '알토스'],
    keyRequirements: [
      'AI, 반도체, SaaS 등 딥테크 분야 시리즈 A~C 리드 투자 및 사후관리 경험',
      '글로벌 네트워크 및 크로스보더 딜 소싱 역량',
      '전략 컨설팅펌 또는 유니콘 전략기획 출신 우대'
    ],
    rewards: {
      coffeeChatReward: 50000,
      interviewReward: 200000,
      hireSuccessBounty: 4000000,
      probationBounty: 1000000
    },
    urgentBadge: '💼 Top-Tier VC',
    description: '누적 운용자산(AUM) 1조원 이상의 글로벌 탑티어 벤처캐피탈에서 국내외 딥테크 투자를 이끌 심사역을 영입합니다.',
    deadline: '2024-11-20',
    isOpen: true
  },
  {
    id: 'pos-004',
    title: 'Head of Global IR & CFO (상장 준비 총괄)',
    clientCompany: '루닛 (Lunit)',
    industry: 'KOSDAQ 상장사 / 바이오 테크',
    department: '재무전략실',
    salaryRange: '2억 ~ 2억 7,000만원',
    location: '서울 강남구 논현동',
    targetExperienceYears: '15년 이상',
    targetAgeGroup: ['40s', '50s_plus'],
    targetAlumniCompanies: ['삼일PwC', '삼정KPMG', '골드만삭스', '미래에셋'],
    keyRequirements: [
      '글로벌 기관투자자 대상 영문 IR 및 나스닥/국내 대형 공모 유상증자 경험',
      'DART 공시 및 K-IFRS 회계기준 완전 통달 (CPA 우대)',
      '해외 M&A 및 라이선싱 딜 구조화 경험'
    ],
    rewards: {
      coffeeChatReward: 50000,
      interviewReward: 200000,
      hireSuccessBounty: 5000000,
      probationBounty: 1000000
    },
    urgentBadge: '🏛️ DART 공시 상장사',
    description: '글로벌 확장을 가속화하고 있는 KOSDAQ 바이오테크 상장사에서 해외 IR 및 재무전략을 총괄할 리더를 영입합니다.',
    deadline: '2024-12-31',
    isOpen: true
  }
];
