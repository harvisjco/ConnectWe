/**
 * ConnectWe Peer Trust & Career Acceleration Studio Service
 * 실무 인재(개발자/디자이너/PM/기획자) 신뢰 보증 및 커리어 도약 스튜디오 서비스
 */

import {
  EndorsementStrengthTag,
  PeerEndorsement,
  EndorsementSummary,
  DigitalCardProfile,
  VCardExportData,
  RouletteRole,
  RouletteParticipant,
  CoffeeRouletteMatch,
  CareerGoalTrack,
  SkillGapItem,
  CareerMentorMatch,
  CareerPathAnalysis
} from '../types/peerTrustCareer';

const STORAGE_KEY_ENDORSEMENTS = 'cw_peer_endorsements_vault_v1';
const STORAGE_KEY_DIGITAL_PROFILE = 'cw_my_digital_card_profile_v1';

// ==========================================
// 1. 피어 실무 보증 태그 & 초기 마스터 데이터
// ==========================================

export const ENDORSEMENT_STRENGTH_TAGS: EndorsementStrengthTag[] = [
  // 기술 & 엔지니어링
  {
    id: 'str-traffic-bottleneck',
    label: '대규모 트래픽 병목 해결',
    category: 'technical',
    categoryLabel: '기술 & 엔지니어링',
    description: '고부하 환경에서 쿼리 및 네트워크 레이턴시를 획기적으로 개선하는 엔지니어링 역량'
  },
  {
    id: 'str-clean-architecture',
    label: '타입 안전성 & 클린 아키텍처',
    category: 'technical',
    categoryLabel: '기술 & 엔지니어링',
    description: '유지보수하기 쉽고 결합도가 낮은 확장성 높은 프런트/백엔드 아키텍처 구축'
  },
  {
    id: 'str-test-automation',
    label: '테스트 자동화 & 무결점 배포',
    category: 'technical',
    categoryLabel: '기술 & 엔지니어링',
    description: 'E2E 및 단위 테스트 커버리지를 통해 배포 후 장애율 0건을 지향하는 꼼꼼함'
  },
  // 프로덕트 & UX
  {
    id: 'str-data-hypothesis',
    label: '데이터 기반 제품 가설 검증',
    category: 'product',
    categoryLabel: '프로덕트 & 기획',
    description: 'A/B 테스트 및 정량 로그 지표를 바탕으로 비즈니스 전환율을 증명하는 역량'
  },
  {
    id: 'str-intuitive-ux',
    label: '직관적인 UX 플로우 설계',
    category: 'product',
    categoryLabel: '프로덕트 & 기획',
    description: '복잡한 비즈니스 로직을 사용자가 손쉽게 이해하도록 돕는 유려한 인터페이스 구현'
  },
  {
    id: 'str-speed-iteration',
    label: '빠른 MVP 이터레이션 & 배포',
    category: 'product',
    categoryLabel: '프로덕트 & 기획',
    description: '아이디어를 빠르게 실제 동작하는 소프트웨어로 전환하여 시장 반응을 신속 확인'
  },
  // 협업 & 소통
  {
    id: 'str-pleasant-comm',
    label: '명확하고 기분 좋은 커뮤니케이션',
    category: 'collaboration',
    categoryLabel: '협업 & 소통',
    description: '이견이 발생하는 상황에서도 상대를 배려하며 최적의 합의점을 도출하는 소통 태도'
  },
  {
    id: 'str-psych-safety',
    label: '팀원 심리적 안정감 조성',
    category: 'collaboration',
    categoryLabel: '협업 & 소통',
    description: '동료가 실패나 실수에 두려움 없이 과감히 도전할 수 있는 따뜻한 팀 문화 지향'
  },
  {
    id: 'str-cross-alignment',
    label: '개발-디자인-기획 가교 역할',
    category: 'collaboration',
    categoryLabel: '협업 & 소통',
    description: '서로 다른 전문 직무 간의 언어 차이를 좁히고 하나의 프로덕트 목표로 정렬'
  },
  // 리더십 & 성장
  {
    id: 'str-warm-mentoring',
    label: '주니어 동료 따뜻한 멘토링',
    category: 'leadership',
    categoryLabel: '리더십 & 성장',
    description: '코드 리뷰와 지식 공유를 통해 팀 전체의 엔지니어링/기획 역량을 함께 끌어올림'
  },
  {
    id: 'str-tech-debt-killer',
    label: '기술 부채 선제적 해결 집념',
    category: 'leadership',
    categoryLabel: '리더십 & 성장',
    description: '당장의 납기에 매몰되지 않고 미래 유지보수 비용을 낮추는 리팩토링 추진력'
  }
];

export const INITIAL_PEER_ENDORSEMENTS: PeerEndorsement[] = [
  {
    id: 'endorse-001',
    targetPersonId: 'p-001', // 김지원 (프론트엔드 리드)
    targetPersonName: '김지원',
    endorserPersonId: 'p-002',
    endorserName: '박서현',
    endorserTitle: '프로덕트 디자이너',
    endorserCompany: '토스',
    relationship: '디자인 시스템 구축 프로젝트 협업 동료',
    selectedStrengths: ['str-clean-architecture', 'str-intuitive-ux', 'str-cross-alignment'],
    memo: '김지원 님은 디자이너의 의도를 1픽셀의 오차도 없이 코드로 승화시키는 최고의 파트너입니다. 복잡한 인터랙션도 기분 좋게 상의하며 완성도 높은 프로덕트를 만들었습니다.',
    createdAt: '2026-09-20',
    thankYouNoteSent: true
  },
  {
    id: 'endorse-002',
    targetPersonId: 'p-001',
    targetPersonName: '김지원',
    endorserPersonId: 'p-003',
    endorserName: '이동훈',
    endorserTitle: '백엔드 아키텍트',
    endorserCompany: '당근마켓',
    relationship: 'MSA 마이크로서비스 전환 스쿼드 동료',
    selectedStrengths: ['str-traffic-bottleneck', 'str-pleasant-comm', 'str-tech-debt-killer'],
    memo: '대규모 트래픽 장애가 발생했을 때 차분하게 클라이언트 캐싱과 네트워크 병목을 짚어내어 함께 해결했습니다. 기술적 깊이와 인성을 겸비한 든든한 동료입니다.',
    createdAt: '2026-09-28',
    thankYouNoteSent: false
  },
  {
    id: 'endorse-003',
    targetPersonId: 'p-002',
    targetPersonName: '박서현',
    endorserPersonId: 'p-001',
    endorserName: '김지원',
    endorserTitle: '프론트엔드 리드',
    endorserCompany: '네이버',
    relationship: '디자인 시스템 토큰 공동 설계',
    selectedStrengths: ['str-intuitive-ux', 'str-pleasant-comm', 'str-psych-safety'],
    memo: '개발자가 개발하기 가장 편안한 토큰 규격을 선제적으로 제안해주셨습니다. 덕분에 개발 생산성이 2배 이상 올랐습니다.',
    createdAt: '2026-09-22',
    thankYouNoteSent: true
  }
];

// ==========================================
// 2. 모바일 디지털 실무 명함 기본 프로필
// ==========================================

export const DEFAULT_MY_DIGITAL_PROFILE: DigitalCardProfile = {
  id: 'my-profile-001',
  name: '김성우',
  title: '프론트엔드 & AI 테크 리드',
  company: 'ConnectWe Core Labs',
  department: 'Product Engineering Team',
  phone: '010-8921-3412',
  email: 'sungwoo.kim@connectwe.net',
  githubUrl: 'https://github.com/sungwoo-kim',
  portfolioUrl: 'https://connectwe.net/@sungwoo',
  productionStack: ['TypeScript', 'React 19', 'Next.js App Router', 'Tailwind CSS', 'Vite', 'GraphQL'],
  currentFocusProject: 'C-Level 의사결정 인텔리전스 및 피어 신뢰 스튜디오 고도화',
  consultingTopics: [
    '대규모 B2B 엔터프라이즈 프런트엔드 아키텍처 설계',
    '디자인 시스템 토큰화 및 크로스 직무 핸드오프',
    'AI 에이전트 기반 테스트 자동화 및 E2E 파이프라인'
  ],
  shortBio: '사용자 경험의 디테일과 시스템의 타입 무결성을 동시에 추구하는 10년 차 엔지니어입니다. 언제든 편안한 기술 티타임 환영합니다.',
  isPublicMasked: false
};

// ==========================================
// 3. 크로스 직무 커피챗 룰렛 참여자 풀
// ==========================================

export const ROULETTE_PARTICIPANTS: RouletteParticipant[] = [
  {
    id: 'roulette-user-1',
    name: '최민서',
    role: 'designer',
    roleLabel: '프로덕트 디자이너',
    company: '우아한형제들',
    title: '디자인 시스템 리드',
    closeness: 1,
    topicsOfInterest: ['Figma Variables', '디자인 시스템 거버넌스', '디자이너-엔지니어 소통'],
    recentHighlight: '전사 60개 서비스 공통 디자인 시스템 토큰 통합 완료'
  },
  {
    id: 'roulette-user-2',
    name: '정현우',
    role: 'pm',
    roleLabel: '프로덕트 매니저 (PO)',
    company: '토스뱅크',
    title: '그로스 PO',
    closeness: 2,
    topicsOfInterest: ['A/B 테스트 가설 수립', '온보딩 퍼널 최적화', '데이터 리터러시'],
    recentHighlight: '계좌 개설 전환율 18% 개선 및 실험 문화 정착'
  },
  {
    id: 'roulette-user-3',
    name: '한지수',
    role: 'backend',
    roleLabel: '백엔드 엔지니어',
    company: '카카오페이',
    title: '시니어 분산시스템 개발자',
    closeness: 1,
    topicsOfInterest: ['Kafka 이벤트 드리븐', '결제 트랜잭션 무결성', 'Go 마이크로서비스'],
    recentHighlight: '초당 3만 건 결제 트래픽 무중단 처리 파이프라인 설계'
  },
  {
    id: 'roulette-user-4',
    name: '오세훈',
    role: 'data',
    roleLabel: '데이터 엔지니어 / AI 리서처',
    company: '업스테이지',
    title: 'LLM RAG 엔지니어',
    closeness: 2,
    topicsOfInterest: ['Local Vector Search', '파인튜닝 vs RAG', 'AI 에이전트 파이프라인'],
    recentHighlight: '온디바이스 소형 언어모델 기반 기업 사내 검색 RAG 구축'
  },
  {
    id: 'roulette-user-5',
    name: '배유진',
    role: 'marketing',
    roleLabel: '그로스 마케터',
    company: '리멤버',
    title: 'B2B 퍼포먼스 마케팅 리드',
    closeness: 2,
    topicsOfInterest: ['B2B 리드 제너레이션', '콘텐츠 바이럴 루프', 'LTV/CAC 최적화'],
    recentHighlight: '엔터프라이즈 의사결정권자 타깃 세미나 유치 300% 달성'
  }
];

// ==========================================
// 4. 커리어 트랙 & 스킬 갭 멘토 마스터 데이터
// ==========================================

export const CAREER_GOAL_TRACKS: CareerGoalTrack[] = [
  {
    id: 'track-tech-lead',
    targetRole: '테크 리드 & 엔지니어링 매니저 (Tech Lead & EM)',
    category: '엔지니어링 리더십',
    description: '코딩 실무를 넘어 비즈니스 전략과 기술 로드맵을 일치시키고 팀원의 성장을 견인하는 엔지니어링 리더',
    typicalTenure: '시니어 6년~10년 차 도약 단계',
    requiredCompetencies: [
      '대규모 분산 아키텍처 설계',
      '기술 부채와 비즈니스 기능 간의 우선순위 조율',
      '1:1 면담 기반 팀원 멘토링 & 심리적 안정감 구축',
      '장애 대응 포스트모템(Post-mortem) 문화 정착',
      '엔지니어링 채용 및 온보딩 파이프라인 수립'
    ],
    recommendedRoadmapSteps: [
      '1단계: 팀 내 소규모 프로젝트 테크 스펙 오너십 주도',
      '2단계: 엔지니어링 KPI(DORA 지표, 배포 빈도, MTTR) 측정 및 개선',
      '3단계: 현직 EM과의 월간 커피챗을 통한 리더십 코칭 체득'
    ]
  },
  {
    id: 'track-principal-ai',
    targetRole: 'AI 프로덕트 수석 아키텍트 (Principal AI Solutions Architect)',
    category: '최첨단 딥테크 아키텍처',
    description: '최신 LLM/SLM 모델과 엔터프라이즈 비즈니스 파이프라인을 결합하여 고부가가치 솔루션을 창출하는 기술 권위자',
    typicalTenure: '아키텍트 8년+ 이상 단계',
    requiredCompetencies: [
      'Vector DB & 하이브리드 RAG 파이프라인 최적화',
      '온디바이스 경량 모델(SLM) 서빙 및 레이턴시 튜닝',
      'AI 에이전트 오케스트레이션 (LangChain, LlamaIndex, MCP)',
      '엔터프라이즈 프라이버시 및 환각(Hallucination) 방어 거버넌스',
      '고객사 맞춤형 AI ROI 실증 PoC 리드'
    ],
    recommendedRoadmapSteps: [
      '1단계: 사내 서비스에 벡터 검색 기반 Q&A 챗봇 실프로덕션 배포',
      '2단계: GPU 인프라 비용 40% 절감을 위한 vLLM/Ollama 최적화 검증',
      '3단계: AI 딥테크 선도 기업 실무 리더와의 지식 교류 및 자문'
    ]
  },
  {
    id: 'track-cpo-founder',
    targetRole: '프로덕트 총괄 디렉터 & 창업 파트너 (CPO & Co-Founder)',
    category: '비즈니스 & 프로덕트 총괄',
    description: '기술에 대한 깊은 이해를 바탕으로 고객 페인포인트를 해결하고 수익 모델을 창출하는 C-Level 프로덕트 리더',
    typicalTenure: '리드 7년+ 이상 단계',
    requiredCompetencies: [
      'PMF(Product-Market Fit) 검증 및 가격 정책 설계',
      'B2B 엔터프라이즈 계약 협상 및 고객사 온보딩 플로우',
      '크로스 펑셔널 스쿼드(개발/디자인/마케팅) 목표 정렬 (OKR)',
      '투자 유치 IR 테크 스토리라인 구성',
      '고객 인터뷰 기반의 집요한 제품 로드맵 피벗'
    ],
    recommendedRoadmapSteps: [
      '1단계: 신규 기능 론칭 시 유료 전환율 실험 직접 설계 및 측정',
      '2단계: 초기 고객 10곳 심층 인터뷰 및 VOC 데이터화',
      '3단계: 시드/시리즈 A 스타트업 CPO 및 창업자와의 실전 멘토링'
    ]
  }
];

export const CAREER_MENTOR_DATABASE: CareerMentorMatch[] = [
  {
    personId: 'mentor-001',
    name: '강태웅',
    title: 'VP of Engineering / 전 네이버 테크 리드',
    company: '몰로코',
    closeness: 1,
    expertInSkills: ['대규모 분산 아키텍처 설계', '엔지니어링 채용 및 온보딩 파이프라인 수립', '기술 부채와 비즈니스 기능 간의 우선순위 조율'],
    adviceTopic: '스타트업 스케일업 단계에서 테크 리드가 겪는 조직 관리와 아키텍처 딜레마 극복법',
    introNoteTemplate: '강태웅 멘토님, 안녕하세요. 성우입니다! 팀의 성장에 따라 테크 리드로서 조직 관리와 기술적 의사결정을 조율하는 과정에서 조언을 여쭙고자 연락드렸습니다.'
  },
  {
    personId: 'mentor-002',
    name: '신소라',
    title: 'Lead AI Engineer / 전 하이퍼클로바 팀',
    company: '업스테이지',
    closeness: 2,
    expertInSkills: ['Vector DB & 하이브리드 RAG 파이프라인 최적화', '온디바이스 경량 모델(SLM) 서빙 및 레이턴시 튜닝', '엔터프라이즈 프라이버시 및 환각(Hallucination) 방어 거버넌스'],
    adviceTopic: '실프로덕션에 SLM과 하이브리드 RAG를 안정적으로 서빙하기 위한 실무 레이턴시 노하우',
    introNoteTemplate: '신소라 멘토님, 안녕하세요. 최근 사내에 RAG 파이프라인을 실프로덕션에 올리면서 마주한 환각 방어와 비용 최적화 이슈에 대해 짧은 커피챗으로 조언을 청하고 싶습니다.'
  },
  {
    personId: 'mentor-003',
    name: '윤상혁',
    title: 'CPO & Co-Founder / 연쇄 창업가',
    company: '센드버드',
    closeness: 1,
    expertInSkills: ['PMF(Product-Market Fit) 검증 및 가격 정책 설계', 'B2B 엔터프라이즈 계약 협상 및 고객사 온보딩 플로우', '크로스 펑셔널 스쿼드(개발/디자인/마케팅) 목표 정렬 (OKR)'],
    adviceTopic: 'B2B SaaS 제품의 초기 가격 책정(Pricing)과 엔터프라이즈 고객의 VOC를 제품 로드맵에 녹이는 법',
    introNoteTemplate: '윤상혁 대표님, 오랜만에 인사드립니다. 엔지니어링 관점에서 프로덕트 디렉터로 역량을 확장하는 과정에서 PMF 검증과 가격 모델 설계에 대한 대표님의 혜안을 여쭙고 싶습니다.'
  }
];

// ==========================================
// 5. 서비스 클래스 구현 (단일 진실 공급원)
// ==========================================

class PeerTrustCareerService {
  // ----------------------------------------
  // 1) 피어 실무 보증 (Peer Endorsement)
  // ----------------------------------------

  public getEndorsements(): PeerEndorsement[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY_ENDORSEMENTS);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // 로컬스토리지 예외 시 초기 데이터 유지
    }
    return INITIAL_PEER_ENDORSEMENTS;
  }

  public getEndorsementsForPerson(personId: string): PeerEndorsement[] {
    const list = this.getEndorsements();
    return list.filter(item => item.targetPersonId === personId);
  }

  public getEndorsementSummary(personId: string, personName: string): EndorsementSummary {
    const endorsements = this.getEndorsementsForPerson(personId);
    const tagCountMap: Record<string, number> = {};

    endorsements.forEach(item => {
      item.selectedStrengths.forEach(tagId => {
        tagCountMap[tagId] = (tagCountMap[tagId] || 0) + 1;
      });
    });

    const topStrengths = Object.entries(tagCountMap)
      .map(([tagId, count]) => {
        const tagDef = ENDORSEMENT_STRENGTH_TAGS.find(t => t.id === tagId);
        return {
          tagId,
          label: tagDef ? tagDef.label : tagId,
          count
        };
      })
      .sort((a, b) => b.count - a.count);

    return {
      personId,
      personName,
      totalEndorsements: endorsements.length,
      topStrengths,
      recentEndorsements: endorsements,
      isPeerVerified: endorsements.length >= 2 // 2명 이상 실무 동료 보증 시 공인 뱃지 부여
    };
  }

  public addEndorsement(newEndorsement: Omit<PeerEndorsement, 'id' | 'createdAt' | 'thankYouNoteSent'>): PeerEndorsement {
    const fullEndorsement: PeerEndorsement = {
      ...newEndorsement,
      id: `endorse-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      thankYouNoteSent: false
    };

    const currentList = this.getEndorsements();
    const updatedList = [fullEndorsement, ...currentList];
    try {
      localStorage.setItem(STORAGE_KEY_ENDORSEMENTS, JSON.stringify(updatedList));
    } catch {
      // ignore
    }
    return fullEndorsement;
  }

  public markThankYouNoteSent(endorsementId: string): boolean {
    const currentList = this.getEndorsements();
    let found = false;
    const updated = currentList.map(item => {
      if (item.id === endorsementId) {
        found = true;
        return { ...item, thankYouNoteSent: true };
      }
      return item;
    });

    if (found) {
      try {
        localStorage.setItem(STORAGE_KEY_ENDORSEMENTS, JSON.stringify(updated));
      } catch {
        // ignore
      }
    }
    return found;
  }

  public generateThankYouNote(endorsement: PeerEndorsement): string {
    const strengthLabels = endorsement.selectedStrengths
      .map(id => ENDORSEMENT_STRENGTH_TAGS.find(t => t.id === id)?.label)
      .filter(Boolean)
      .join(', ');

    return `안녕하세요, ${endorsement.endorserName}님!\n\n` +
      `바쁘신 일정 중에도 ConnectWe에서 저의 실무 역량(${strengthLabels})에 대해 따뜻하고 진솔한 보증 메모를 남겨주셔서 진심으로 감사드립니다.\n\n` +
      `"${endorsement.memo}"라는 ${endorsement.endorserName}님의 말씀은 앞으로의 커리어와 프로젝트에 큰 힘과 용기가 됩니다. 함께 일하며 배운 점이 참 많았는데, 이렇게 든든한 응원을 받으니 정말 기쁩니다.\n\n` +
      `조만간 편하신 시간에 따뜻한 커피 한잔 대접해 드리고 싶습니다. 언제든 편하게 말씀 부탁드립니다. 늘 건강하시고 좋은 일 가득하시길 바랍니다!\n\n` +
      `- ${endorsement.targetPersonName} 드림`;
  }

  // ----------------------------------------
  // 2) 디지털 실무 명함 (Digital Business Card)
  // ----------------------------------------

  public getMyDigitalProfile(): DigitalCardProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEY_DIGITAL_PROFILE);
      if (data) {
        return JSON.parse(data);
      }
    } catch {
      // ignore
    }
    return DEFAULT_MY_DIGITAL_PROFILE;
  }

  public saveMyDigitalProfile(profile: DigitalCardProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY_DIGITAL_PROFILE, JSON.stringify(profile));
    } catch {
      // ignore
    }
  }

  public generateVCard(profile: DigitalCardProfile, masked: boolean = false): VCardExportData {
    const phone = masked ? this.maskPhone(profile.phone) : profile.phone;
    const email = masked ? this.maskEmail(profile.email) : profile.email;

    // RFC 6350 vCard 4.0 표준 형식
    const vcfString = [
      'BEGIN:VCARD',
      'VERSION:4.0',
      `FN:${profile.name}`,
      `N:${profile.name};;;;`,
      `TITLE:${profile.title}`,
      `ORG:${profile.company};${profile.department}`,
      `TEL;TYPE=cell,voice:${phone}`,
      `EMAIL;TYPE=work:${email}`,
      profile.portfolioUrl ? `URL:${profile.portfolioUrl}` : '',
      `NOTE:${profile.shortBio.replace(/\n/g, ' ')} | 프로덕션 스택: ${profile.productionStack.join(', ')}`,
      'END:VCARD'
    ].filter(Boolean).join('\r\n');

    // QR 코드에 담길 데이터 (표준 vCard 텍스트 포맷)
    const qrPayload = vcfString;

    return {
      vcfString,
      qrPayload,
      maskedPhone: this.maskPhone(profile.phone),
      maskedEmail: this.maskEmail(profile.email)
    };
  }

  private maskPhone(phone: string): string {
    const parts = phone.split('-');
    if (parts.length === 3) {
      return `${parts[0]}-****-${parts[2]}`;
    }
    return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1-****-$2');
  }

  private maskEmail(email: string): string {
    const [user, domain] = email.split('@');
    if (!domain) return email;
    if (user.length <= 2) return `${user[0]}*@${domain}`;
    return `${user.slice(0, 2)}***@${domain}`;
  }

  // ----------------------------------------
  // 3) 크로스 직무 1:1 캐주얼 커피챗 룰렛 (Coffee Roulette)
  // ----------------------------------------

  public getRouletteParticipants(): RouletteParticipant[] {
    return ROULETTE_PARTICIPANTS;
  }

  public spinCoffeeRoulette(myRole: RouletteRole, preferredTopic?: string): CoffeeRouletteMatch {
    // 본인 직무를 제외한 크로스 직무 동료 중 매칭
    let pool = ROULETTE_PARTICIPANTS.filter(p => p.role !== myRole);
    if (pool.length === 0) {
      pool = ROULETTE_PARTICIPANTS;
    }

    let partner: RouletteParticipant;
    if (preferredTopic) {
      const topicMatches = pool.filter(p => 
        p.topicsOfInterest.some(t => t.toLowerCase().includes(preferredTopic.toLowerCase()))
      );
      partner = topicMatches.length > 0 
        ? topicMatches[Math.floor(Math.random() * topicMatches.length)]
        : pool[Math.floor(Math.random() * pool.length)];
    } else {
      partner = pool[Math.floor(Math.random() * pool.length)];
    }

    const icebreakerQuestions = this.getIcebreakerQuestions(partner.role, partner.name);
    const suggestedSchedule = '다음 주 화요일 오후 4:00 (온라인 Zoom 20분 또는 사내 라운지)';
    const invitationMessage = 
      `안녕하세요 ${partner.name}님!\n\n` +
      `ConnectWe 크로스 직무 커피챗 룰렛을 통해 ${partner.name}님과 연결되었습니다. 평소 ${partner.name}님의 "${partner.recentHighlight}" 소식을 인상 깊게 보아왔습니다.\n\n` +
      `이번 기회에 [${partner.topicsOfInterest.join(', ')}] 관련하여 편안하게 20분 정도 캐주얼 티타임을 나누며 인사 나누고 싶습니다. 제안드리는 일정(${suggestedSchedule}) 괜찮으실까요? 편하신 다른 일정이 있으시면 언제든 맞춰드리겠습니다!\n\n` +
      `좋은 하루 보내세요!`;

    const match: CoffeeRouletteMatch = {
      id: `roulette-match-${Date.now()}`,
      partner,
      matchedTopics: partner.topicsOfInterest,
      icebreakerQuestions,
      suggestedSchedule,
      invitationMessage,
      isScheduled: false
    };

    return match;
  }

  private getIcebreakerQuestions(role: RouletteRole, name: string): string[] {
    switch (role) {
      case 'designer':
        return [
          `${name}님이 생각하시는 최근 가장 완성도 높은 프로덕트 UI/UX 인터랙션은 무엇인가요?`,
          '디자인 시스템 토큰 관리 시 개발자와의 싱크를 맞출 때 겪은 가장 기억에 남는 에피소드는?',
          '피그마에서 프로덕션 코드로 넘어갈 때 가장 개선되었으면 하는 지점은 무엇인가요?'
        ];
      case 'pm':
        return [
          `${name}님은 제품의 비즈니스 목표와 실무진의 기술적 완성도 사이의 균형을 어떻게 잡으시나요?`,
          '최근 진행한 실험 중 가장 예상 밖의 인사이트를 주었던 A/B 테스트 결과는 무엇이었나요?',
          '엔지니어링 팀과 소통할 때 가장 신뢰가 형성되었던 순간은 언제였나요?'
        ];
      case 'backend':
      case 'data':
        return [
          `${name}님이 최근 기술 부채를 해결하거나 아키텍처를 최적화하며 느낀 가장 큰 카타르시스는?`,
          '대규모 트래픽이나 데이터 파이프라인에서 장애를 예방하기 위해 가장 신경 쓰는 방어책은?',
          '클라이언트나 프론트엔드 팀과 API 스펙을 협의할 때 가장 선호하는 방식은 무엇인가요?'
        ];
      default:
        return [
          `${name}님이 요즘 가장 흥미롭게 몰입하고 계신 사이드 프로젝트나 기술 트렌드는 무엇인가요?`,
          '서로 다른 전문 분야의 동료와 협업할 때 가장 중요하게 생각하시는 원칙 하나를 꼽는다면?',
          '올해 안에 꼭 달성해보고 싶은 커리어 마일스톤이나 학습 목표가 있으신가요?'
        ];
    }
  }

  // ----------------------------------------
  // 4) 커리어 패스 & 스킬 갭 멘토 매칭 (Career Path Explorer)
  // ----------------------------------------

  public getCareerGoalTracks(): CareerGoalTrack[] {
    return CAREER_GOAL_TRACKS;
  }

  public getCareerGoalTrackById(trackId: string): CareerGoalTrack | undefined {
    return CAREER_GOAL_TRACKS.find(t => t.id === trackId);
  }

  public analyzeCareerPath(trackId: string, currentSkills: string[]): CareerPathAnalysis {
    const goal = this.getCareerGoalTrackById(trackId) || CAREER_GOAL_TRACKS[0];
    
    // 현재 보유 스킬과 목표 요구 역량 비교
    const skillGaps: SkillGapItem[] = goal.requiredCompetencies.map((comp, idx) => {
      const isAcquired = currentSkills.some(skill => 
        comp.toLowerCase().includes(skill.toLowerCase()) || skill.toLowerCase().includes(comp.toLowerCase())
      );
      return {
        skill: comp,
        category: goal.category,
        importance: idx < 2 ? 'high' : 'medium',
        mentorCount: CAREER_MENTOR_DATABASE.filter(m => m.expertInSkills.includes(comp)).length,
        isAcquired
      };
    });

    const acquiredCount = skillGaps.filter(s => s.isAcquired).length;
    const readinessScore = Math.round((acquiredCount / goal.requiredCompetencies.length) * 100);

    // 부족한 스킬을 보유한 멘토 필터링 및 매칭
    const missingSkills = skillGaps.filter(s => !s.isAcquired).map(s => s.skill);
    const matchedMentors = CAREER_MENTOR_DATABASE.filter(mentor =>
      mentor.expertInSkills.some(expSkill => missingSkills.includes(expSkill))
    );

    return {
      goal,
      acquiredSkills: skillGaps.filter(s => s.isAcquired).map(s => s.skill),
      skillGaps,
      matchedMentors: matchedMentors.length > 0 ? matchedMentors : CAREER_MENTOR_DATABASE.slice(0, 2),
      readinessScore
    };
  }

  public generateMentorAdviceRequest(mentor: CareerMentorMatch, targetGoalRole: string, focusSkill: string): string {
    return `안녕하세요, ${mentor.name} 멘토님!\n\n` +
      `ConnectWe 네트워크를 통해 평소 ${mentor.name}님의 깊이 있는 실무 이력과 혜안을 존경해 온 김성우입니다.\n\n` +
      `현재 저는 [${targetGoalRole}]로의 커리어 확장을 준비하고 있으며, 특히 실무에서 중요한 "${focusSkill}" 역량을 기르고자 깊이 고민하고 있습니다.\n\n` +
      `${mentor.name}님께서 경험하신 [${mentor.adviceTopic}]에 대해, 20분 정도 온/오프라인으로 따뜻한 조언과 현장의 노하우를 청해 듣고 싶습니다.\n\n` +
      `바쁘신 일정에 큰 부담이 되지 않도록 멘토님께서 편하신 일시와 방식으로 전적으로 조율하겠습니다. 가능하신 시간대를 편히 말씀해 주시면 감사하겠습니다!\n\n` +
      `- 김성우 올림`;
  }
}

export const peerTrustCareerService = new PeerTrustCareerService();
