import { ReferralPosition } from '../types/network';

export const mockReferralPositions: ReferralPosition[] = [
  {
    id: 'pos-1',
    title: '생성형 AI & LLM 선행연구소장 (VP급)',
    clientCompany: '하이퍼AI랩 (시리즈C 유니콘)',
    industry: '인공지능 / 빅테크',
    department: 'AI Research Division',
    salaryRange: '2.5억 ~ 3.5억 + RSU 스톡옵션',
    location: '서울 강남구 테헤란로',
    targetExperienceYears: '12년 이상',
    targetAgeGroup: ['40s', '50s_plus'],
    targetAlumniCompanies: ['네이버', '카카오', '삼성전자', 'LG전자', 'SK텔레콤'],
    keyRequirements: [
      '대규모 거대언어모델(LLM) 파인튜닝 및 분산학습 인프라 리딩 경험',
      '국내외 유수 빅테크 AI Lab 연구팀 리딩 5년 이상',
      'NeurIPS, ICML 등 최상위 학회 논문 등재 및 산학 네트워크 우대'
    ],
    rewards: {
      coffeeChatReward: 100000,
      interviewReward: 500000,
      hireSuccessBounty: 7000000,
      probationBounty: 3000000
    },
    urgentBadge: '바운티 1,000만원 (급구)',
    description: '글로벌 엔터프라이즈용 파운데이션 모델을 자체 구축하는 유니콘 기업의 핵심 선행연구 총괄 포지션입니다.',
    deadline: '2026-10-31',
    isOpen: true
  },
  {
    id: 'pos-2',
    title: '클라우드 플랫폼 인프라 수석 아키텍트',
    clientCompany: '클라우드웨이브 코리아',
    industry: '클라우드 / SaaS',
    department: 'Platform Engineering',
    salaryRange: '1.4억 ~ 1.9억 + 인센티브',
    location: '경기 성남시 판교',
    targetExperienceYears: '8년 ~ 15년',
    targetAgeGroup: ['30s', '40s'],
    targetAlumniCompanies: ['쿠팡', '우아한형제들', '당근', '토스', '네이버'],
    keyRequirements: [
      'Kubernetes 기반 MSA 대규모 트래픽 처리 설계 경험',
      'AWS / GCP 멀티클라우드 환경 무중단 마이그레이션 주도 경험',
      'FinOps 관점의 클라우드 비용 30% 이상 절감 프로젝트 성공자'
    ],
    rewards: {
      coffeeChatReward: 50000,
      interviewReward: 200000,
      hireSuccessBounty: 3500000,
      probationBounty: 1500000
    },
    urgentBadge: '면접비 20만원 지원',
    description: '월간 트래픽 5,000만 건 이상을 처리하는 엔터프라이즈 인프라 혁신을 총괄할 아키텍트를 모십니다.',
    deadline: '2026-11-15',
    isOpen: true
  },
  {
    id: 'pos-3',
    title: 'CFO / 재무총괄 이사 (상장 추진 준비)',
    clientCompany: '넥스트모빌리티',
    industry: '모빌리티 / 자율주행',
    department: '경영지원본부',
    salaryRange: '1.8억 ~ 2.4억 + 지분 참여',
    location: '서울 영등포구 여의도',
    targetExperienceYears: '15년 이상',
    targetAgeGroup: ['40s', '50s_plus'],
    targetAlumniCompanies: ['삼일PwC', '삼정KPMG', '미래에셋증권', '한국투자증권', '현대자동차'],
    keyRequirements: [
      '코스닥/코스피 IPO 상장 주관 및 증권신고서 제출 실무 총괄 경험',
      '글로벌 기관투자자(PE/VC) 대규모 라운드 IR 및 투자 유치 성공 트랙레코드',
      'DART 공시 및 내부회계관리제도 구축 전문성 보유자'
    ],
    rewards: {
      coffeeChatReward: 100000,
      interviewReward: 400000,
      hireSuccessBounty: 5000000,
      probationBounty: 2000000
    },
    urgentBadge: 'IPO 지분 스톡옵션 별도',
    description: '시리즈 C를 완료하고 2027년 코스닥 기술특례 상장을 준비 중인 자율주행 모빌리티의 재무 컨트롤타워 포지션입니다.',
    deadline: '2026-10-15',
    isOpen: true
  },
  {
    id: 'pos-4',
    title: '바이오·헬스케어 투자총괄 파트너 / 상무',
    clientCompany: '파트너스인베스트먼트',
    industry: '벤처캐피탈(VC) / 사모펀드',
    department: 'Bio & Healthcare Team',
    salaryRange: '협의 (기본급 + 업계 최고 캐리 펀드배분)',
    location: '서울 강남구 역삼동',
    targetExperienceYears: '10년 이상',
    targetAgeGroup: ['30s', '40s', '50s_plus'],
    targetAlumniCompanies: ['유한양행', '한미약품', '셀트리온', '삼성바이오로직스', 'KB인베스트먼트'],
    keyRequirements: [
      '신약 개발 파이프라인 또는 첨단 의료기기 분야 직접 발굴 및 회수(Exit) 실적',
      '약학/생명공학 박사 학위 또는 의사 면허(MD) 보유자 우대',
      '국내외 바이오텍 창업자 네트워크 및 병원 임상 네트워크 보유'
    ],
    rewards: {
      coffeeChatReward: 100000,
      interviewReward: 300000,
      hireSuccessBounty: 4500000,
      probationBounty: 1500000
    },
    description: '1,500억 규모 신규 바이오 전문 블라인드 펀드 결성에 따른 핵심 운용역 포지션입니다.',
    deadline: '2026-12-31',
    isOpen: true
  }
];
