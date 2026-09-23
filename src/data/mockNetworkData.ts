import { Person } from '../types/network';

export const INITIAL_PEOPLE_SEED: Person[] = [
  // 1. 네이버 알럼나이 -> 현재 AI 스타트업
  {
    id: 'p_1',
    name: '김서연',
    currentCompany: '넥스트비전 AI',
    currentDepartment: '의료영상 연구소',
    currentTitle: 'VP of AI / 연구총괄',
    mobile: '010-8821-4432',
    email: 'sy.kim@nextvision.ai',
    birthYear: 1982,
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: 'AI/LLM & Data',
    skills: ['Medical Vision AI', 'PyTorch', 'LLM 파인튜닝', '전략 기획'],
    careers: [
      {
        id: 'c_1_1',
        companyName: '넥스트비전 AI',
        department: '의료영상 연구소',
        title: 'VP of AI / 연구총괄',
        startYear: 2022,
        isCurrent: true,
        source: 'SOURCE_DATA'
      },
      {
        id: 'c_1_2',
        companyName: '네이버 (NAVER)',
        department: 'Clova AI Lab',
        title: '책임연구원 (Lead)',
        startYear: 2014,
        endYear: 2021,
        isCurrent: false,
        isAlumniTarget: true,
        source: 'SOURCE_DATA'
      }
    ],
    academics: [
      {
        schoolName: 'KAIST',
        degree: '박사',
        major: '전산학부 인공지능 전공',
        graduationYear: 2013,
        source: 'SOURCE_DATA'
      }
    ],
    sourceType: 'SOURCE_DATA',
    closeness: 2,
    connectionChannel: 'remember',
    lastContactDate: '2024-02-10',
    isStale: false,
    memo: '2024 테크 콘퍼런스 키노트 스피커. 네이버 클로바 초기 멤버로 LLM 및 영상 AI 최고 전문가.'
  },

  // 2. 네이버 알럼나이 -> 상장사 CTO (DART 실공시 팩트)
  {
    id: 'p_2',
    name: '한동훈',
    currentCompany: '(주)하이퍼클라우드',
    currentDepartment: '기술총괄본부',
    currentTitle: 'CTO / 사내이사',
    mobile: '010-3849-2910',
    email: 'dh.han@hypercloud.io',
    birthYear: 1978,
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: '클라우드 & 인프라',
    skills: ['Kubernetes', '대규모 분산시스템', 'FinOps', 'IPO 기술실사'],
    careers: [
      {
        id: 'c_2_1',
        companyName: '(주)하이퍼클라우드',
        department: '기술총괄본부',
        title: 'CTO / 사내이사',
        startYear: 2020,
        isCurrent: true,
        source: 'DART_FACT'
      },
      {
        id: 'c_2_2',
        companyName: '네이버 (NAVER)',
        department: 'NBP 인프라플랫폼',
        title: '기술이사 / 수석엔지니어',
        startYear: 2010,
        endYear: 2019,
        isCurrent: false,
        isAlumniTarget: true,
        source: 'DART_FACT'
      }
    ],
    academics: [
      {
        schoolName: '서울대학교',
        degree: '석사',
        major: '컴퓨터공학',
        graduationYear: 2004,
        source: 'DART_FACT'
      }
    ],
    sourceType: 'DART_FACT',
    dartInfo: {
      corpCode: '00293810',
      stockName: '하이퍼클라우드(코스닥)',
      isPublicDirector: true,
      registeredRole: '사내이사 / 기술총괄(CTO)',
      registeredTerm: '2023.03 ~ 2026.03 (재선임)',
      verifiedAt: '2024-03-20',
      ownershipShares: 125000
    },
    closeness: 2,
    connectionChannel: 'dart',
    lastContactDate: '2023-08-15',
    isStale: true, // 6개월 이상 소통 단절
    memo: '🏛️ 금융감독원 정기공시 확인 완료. 네이버 10년 재직 후 코스닥 상장사 사내이사 재직 중.'
  },

  // 3. 삼성전자 알럼나이 -> 반도체 팹리스 대표이사 (DART 실공시 팩트)
  {
    id: 'p_3',
    name: '이진혁',
    currentCompany: '퓨처웨이브 반도체',
    currentDepartment: '경영총괄',
    currentTitle: '대표이사 (CEO)',
    mobile: '010-7712-3094',
    email: 'jh.lee@futurewave-semi.com',
    birthYear: 1971,
    estimatedAgeGroup: '50s_plus',
    isAgeEstimated: false,
    primaryDomain: '반도체/HW',
    skills: ['NPU 설계', 'ASIC', 'Foundry 협업', '글로벌 M&A'],
    careers: [
      {
        id: 'c_3_1',
        companyName: '퓨처웨이브 반도체',
        title: '대표이사',
        startYear: 2019,
        isCurrent: true,
        source: 'DART_FACT'
      },
      {
        id: 'c_3_2',
        companyName: '삼성전자 (Samsung)',
        department: 'DS부문 System LSI사업부',
        title: '상무 / 설계팀장',
        startYear: 2002,
        endYear: 2018,
        isCurrent: false,
        isAlumniTarget: true,
        source: 'DART_FACT'
      }
    ],
    academics: [
      {
        schoolName: 'KAIST',
        degree: '학사/석사/박사',
        major: '전기및전자공학부',
        graduationYear: 2001,
        source: 'DART_FACT'
      }
    ],
    sourceType: 'DART_FACT',
    dartInfo: {
      corpCode: '00182744',
      stockName: '퓨처웨이브반도체(코스닥)',
      isPublicDirector: true,
      registeredRole: '대표이사',
      registeredTerm: '2022.03 ~ 2025.03',
      verifiedAt: '2024-03-15',
      ownershipShares: 840000
    },
    closeness: 3,
    connectionChannel: 'remember',
    lastContactDate: '2024-01-20',
    isStale: false,
    memo: '삼성전자 DS 출신 대표적 테크 CEO. AI 가속기 칩 양산 성공.'
  },

  // 4. 삼성전자 알럼나이 -> 토스 계열 CPO
  {
    id: 'p_4',
    name: '최민우',
    currentCompany: '비바리퍼블리카 (토스)',
    currentDepartment: '페이먼츠 프로덕트 본부',
    currentTitle: 'Head of Product (CPO)',
    mobile: '010-9943-1288',
    email: 'mw.choi@toss.im',
    birthYear: 1985,
    estimatedAgeGroup: '30s',
    isAgeEstimated: false,
    primaryDomain: '비즈니스 & 프로덕트',
    skills: ['Product Strategy', 'Fintech UX', '데이터 드리븐 성장', '조직 빌딩'],
    careers: [
      {
        id: 'c_4_1',
        companyName: '비바리퍼블리카 (토스)',
        department: '프로덕트 본부',
        title: 'Head of Product',
        startYear: 2021,
        isCurrent: true,
        source: 'SOURCE_DATA'
      },
      {
        id: 'c_4_2',
        companyName: '삼성전자 (Samsung)',
        department: '무선사업부 서비스기획',
        title: '책임프로덕트매니저',
        startYear: 2012,
        endYear: 2020,
        isCurrent: false,
        isAlumniTarget: true,
        source: 'SOURCE_DATA'
      }
    ],
    academics: [
      {
        schoolName: '연세대학교',
        degree: '학사',
        major: '경영학 / 컴퓨터과학 복수전공',
        graduationYear: 2011,
        source: 'SOURCE_DATA'
      }
    ],
    sourceType: 'SOURCE_DATA',
    closeness: 2,
    connectionChannel: 'vcard',
    lastContactDate: '2023-09-01',
    isStale: true,
    memo: '스마트폰 주소록 연동 1촌. 토스 페이먼츠 고속 성장 주도.'
  },

  // 5. VC 파트너 (알토스캐피탈)
  {
    id: 'p_5',
    name: '김도현',
    currentCompany: '알토스캐피탈 파트너스',
    currentDepartment: '글로벌 투자심사본부',
    currentTitle: '파트너 / 수석심사역 (VP)',
    mobile: '010-5211-9034',
    email: 'dh.kim@altospartners.com',
    birthYear: 1980,
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: 'VC/PE 투자',
    skills: ['초기 스타트업 발굴', '시리즈 B/C 리드', 'SaaS 밸류에이션', 'M&A Exit'],
    careers: [
      {
        id: 'c_5_1',
        companyName: '알토스캐피탈 파트너스',
        title: '파트너 (VP)',
        startYear: 2018,
        isCurrent: true,
        source: 'SOURCE_DATA'
      },
      {
        id: 'c_5_2',
        companyName: '맥킨지앤컴퍼니 (McKinsey)',
        title: 'Senior Engagement Manager',
        startYear: 2008,
        endYear: 2017,
        isCurrent: false,
        isAlumniTarget: true,
        source: 'SOURCE_DATA'
      }
    ],
    academics: [
      {
        schoolName: '서울대학교',
        degree: '학사',
        major: '전기공학부',
        graduationYear: 2005,
        source: 'SOURCE_DATA'
      },
      {
        schoolName: '스탠포드 대학교',
        degree: 'MBA',
        graduationYear: 2008,
        source: 'SOURCE_DATA'
      }
    ],
    sourceType: 'SOURCE_DATA',
    closeness: 2,
    connectionChannel: 'remember',
    lastContactDate: '2024-03-02',
    isStale: false,
    memo: '한국 및 실리콘밸리 테크 스타트업 리드 투자자. 정기 분기 미팅 진행.'
  },

  // 6. 카카오 알럼나이 -> 생성형 AI 스타트업 창업자 (30대)
  {
    id: 'p_6',
    name: '정유라',
    currentCompany: '오픈소버린 AI',
    currentDepartment: '대표실',
    currentTitle: '창업자 & CEO',
    mobile: '010-4491-0923',
    email: 'yr.jung@opensovereign.ai',
    birthYear: 1989,
    estimatedAgeGroup: '30s',
    isAgeEstimated: false,
    primaryDomain: 'AI/LLM & Data',
    skills: ['한국어 LLM 파운데이션', '오픈소스 AI', 'MLOps', 'IR 피칭'],
    careers: [
      {
        id: 'c_6_1',
        companyName: '오픈소버린 AI',
        title: '창업자 & 대표이사',
        startYear: 2023,
        isCurrent: true,
        source: 'SOURCE_DATA'
      },
      {
        id: 'c_6_2',
        companyName: '카카오 (Kakao)',
        department: 'AI 연구조직 카카오브레인',
        title: '테크 리드',
        startYear: 2017,
        endYear: 2022,
        isCurrent: false,
        isAlumniTarget: true,
        source: 'SOURCE_DATA'
      }
    ],
    academics: [
      {
        schoolName: 'KAIST',
        degree: '석사',
        major: '전산학',
        graduationYear: 2016,
        source: 'SOURCE_DATA'
      }
    ],
    sourceType: 'SOURCE_DATA',
    closeness: 2,
    connectionChannel: 'business_card',
    lastContactDate: '2024-02-28',
    isStale: false,
    memo: '카카오브레인 언어모델 리드 출신으로 2023년 창업 후 Pre-A 50억 유치 성공.'
  },

  // 7. 대기업 상장사 재무총괄 (DART 실공시 팩트, 50대+)
  {
    id: 'p_7',
    name: '박종훈',
    currentCompany: '케이테크홀딩스(유가증권)',
    currentDepartment: '재무전략본부',
    currentTitle: '전무 / 최고재무책임자(CFO)',
    mobile: '010-2199-8801',
    email: 'jh.park@ktech-holdings.co.kr',
    birthYear: 1968,
    estimatedAgeGroup: '50s_plus',
    isAgeEstimated: false,
    primaryDomain: '재무 & 전략/M&A',
    skills: ['기업 분할/합병', '공모채 발행', 'IR/공시 총괄', '회계 감사 대응'],
    careers: [
      {
        id: 'c_7_1',
        companyName: '케이테크홀딩스(유가증권)',
        title: '전무 / CFO',
        startYear: 2018,
        isCurrent: true,
        source: 'DART_FACT'
      },
      {
        id: 'c_7_2',
        companyName: '삼일회계법인 (PwC)',
        title: '시니어 파트너 (공인회계사)',
        startYear: 1995,
        endYear: 2017,
        isCurrent: false,
        isAlumniTarget: true,
        source: 'DART_FACT'
      }
    ],
    academics: [
      {
        schoolName: '고려대학교',
        degree: '학사',
        major: '경영학과',
        graduationYear: 1993,
        source: 'DART_FACT'
      }
    ],
    sourceType: 'DART_FACT',
    dartInfo: {
      corpCode: '00109923',
      stockName: '케이테크홀딩스(코스피)',
      isPublicDirector: true,
      registeredRole: '사내이사 / 재무전략본부장(CFO)',
      registeredTerm: '2021.03 ~ 2027.03',
      verifiedAt: '2024-03-22',
      ownershipShares: 45000
    },
    closeness: 3,
    connectionChannel: 'dart',
    lastContactDate: '2023-06-11',
    isStale: true,
    memo: '🏛️ 유가증권 상장사 사내이사 실공시 팩트. 공인회계사(KICPA) 자격 보유.'
  },

  // 8. 20대 촉망받는 AI 프론티어 개발자 (추정 나이대)
  {
    id: 'p_8',
    name: '오지훈',
    currentCompany: '오픈소버린 AI',
    currentDepartment: '코어 인프라팀',
    currentTitle: 'AI 리서치 엔지니어',
    mobile: '010-6674-1290',
    email: 'jh.oh@opensovereign.ai',
    estimatedAgeGroup: '20s',
    isAgeEstimated: true,
    birthYear: 1998,
    primaryDomain: 'AI/LLM & Data',
    skills: ['CUDA 최적화', 'vLLM', 'TensorRT-LLM', 'Rust'],
    careers: [
      {
        id: 'c_8_1',
        companyName: '오픈소버린 AI',
        title: 'AI 엔지니어',
        startYear: 2023,
        isCurrent: true,
        source: 'SOURCE_DATA'
      }
    ],
    academics: [
      {
        schoolName: 'KAIST',
        degree: '학사',
        major: '전산학부',
        graduationYear: 2023,
        source: 'SOURCE_DATA'
      }
    ],
    sourceType: 'SOURCE_DATA',
    closeness: 3,
    connectionChannel: 'business_card',
    lastContactDate: '2024-03-10',
    isStale: false,
    memo: '⚡ 카이스트 졸업 후 즉시 AI 스타트업 합류. 오픈소스 vLLM 컨트리뷰터.'
  },

  // 9. 쿠팡 알럼나이 -> 이커머스 풀필먼트 테크 본부장 (40대)
  {
    id: 'p_9',
    name: '송지은',
    currentCompany: '로지스넥스트',
    currentDepartment: '풀필먼트 자동화 본부',
    currentTitle: '본부장 (VP)',
    mobile: '010-3329-8471',
    email: 'je.song@logisnext.io',
    birthYear: 1981,
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: '클라우드 & 인프라',
    skills: ['WMS 시스템', 'Robotics AI', 'SCM 최적화', '대규모 트래픽'],
    careers: [
      {
        id: 'c_9_1',
        companyName: '로지스넥스트',
        title: '본부장 (VP)',
        startYear: 2022,
        isCurrent: true,
        source: 'SOURCE_DATA'
      },
      {
        id: 'c_9_2',
        companyName: '쿠팡 (Coupang)',
        department: 'CFS 기술조직',
        title: 'Senior Director',
        startYear: 2015,
        endYear: 2021,
        isCurrent: false,
        isAlumniTarget: true,
        source: 'SOURCE_DATA'
      }
    ],
    academics: [
      {
        schoolName: '서울대학교',
        degree: '학사/석사',
        major: '산업공학',
        graduationYear: 2007,
        source: 'SOURCE_DATA'
      }
    ],
    sourceType: 'SOURCE_DATA',
    closeness: 3,
    connectionChannel: 'remember',
    lastContactDate: '2024-01-05',
    isStale: false,
    memo: '쿠팡 나스닥 상장 시점 CFS 자동화 시스템 이끈 주역.'
  },

  // 10. 피플 & HR 리더 (네이버 -> 유니콘 CPO/CHRO)
  {
    id: 'p_10',
    name: '윤아름',
    currentCompany: '넥스트비전 AI',
    currentDepartment: '피플앤컬처 본부',
    currentTitle: '최고인사책임자 (CHRO)',
    mobile: '010-8192-3340',
    email: 'ar.yoon@nextvision.ai',
    birthYear: 1983,
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: '피플 & HR',
    skills: ['Executive Recruiting', 'RSU 보상설계', '엔지니어링 평가제도', '조직문화'],
    careers: [
      {
        id: 'c_10_1',
        companyName: '넥스트비전 AI',
        title: 'CHRO / 전무',
        startYear: 2021,
        isCurrent: true,
        source: 'SOURCE_DATA'
      },
      {
        id: 'c_10_2',
        companyName: '네이버 (NAVER)',
        department: '인재개발혁신팀',
        title: '팀장 / 수석HR매니저',
        startYear: 2011,
        endYear: 2020,
        isCurrent: false,
        isAlumniTarget: true,
        source: 'SOURCE_DATA'
      }
    ],
    academics: [
      {
        schoolName: '고려대학교',
        degree: '학사',
        major: '심리학 / 경영학',
        graduationYear: 2006,
        source: 'SOURCE_DATA'
      }
    ],
    sourceType: 'SOURCE_DATA',
    closeness: 2,
    connectionChannel: 'remember',
    lastContactDate: '2023-07-20',
    isStale: true,
    memo: '네이버 테크 인재 영입 및 평가제도 기틀 마련. 현재 AI 유니콘 HR 총괄.'
  }
];
