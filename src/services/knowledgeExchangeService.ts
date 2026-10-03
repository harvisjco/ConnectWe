import { Person } from '../types/network';
import { 
  ExpertMentorProfile, 
  KnowledgeSummaryStats, 
  SuperpowerCategory 
} from '../types/knowledgeExchange';

const STORAGE_KNOWLEDGE_KEY = 'connectwe_knowledge_profiles_v1';

/**
 * 기본 전문가 프로필 목 데이터 생성 (1촌 + 2촌 동료 공유 인맥 결합)
 */
function createDefaultExpertProfiles(people: Person[]): ExpertMentorProfile[] {
  const findPerson = (nameKeyword: string): Person | undefined => {
    return people.find(p => p.name.includes(nameKeyword));
  };

  const p1 = findPerson('서진') || people[0];
  const p2 = findPerson('민석') || people[1] || people[0];

  return [
    {
      id: 'k-prof-1',
      personId: 'peer-c-1',
      personName: '강동원',
      companyName: '메가클라우드 시스템즈',
      currentTitle: '클라우드 인프라 아키텍트',
      primaryTopic: {
        id: 'top-k8s-finops',
        title: 'Kubernetes 대규모 트래픽 비용 70% 절감 & 멀티리전 FinOps',
        category: 'ENGINEERING',
        tags: ['AWS', 'Kubernetes', 'FinOps', 'Terraform', 'EKS']
      },
      solvedCaseSummary: '일 트래픽 5,000만 건 규모의 쿠버네티스 클러스터에서 스팟 인스턴스 자동 스케일링으로 월 인프라 비용 7,000만 원 절감 달성',
      availability: 'COFFEE_CHAT_OPEN',
      degree: 2,
      bridgeColleagueName: '강민석',
      bridgeDepartment: '인프라챕터',
      recommendedAgenda: [
        'EKS/GKE 스팟 인스턴스 무중단 전환 시 파드 배출(Drain) 전략',
        'Karpenter 기반 실시간 오토스케일링 튜닝 노하우',
        'FinOps 대시보드를 통한 비효율 리소스 탐지 및 격리 프로세스'
      ],
      hasConsulted: false
    },
    {
      id: 'k-prof-2',
      personId: 'peer-c-3',
      personName: '문성호',
      companyName: '뉴럴브레인 테크',
      currentTitle: '시니어 LLM 연구원',
      primaryTopic: {
        id: 'top-slm-rag',
        title: '온디바이스 소형언어모델(SLM) 양자화 & 모바일 RAG 구축',
        category: 'PRODUCT_AI',
        tags: ['LLM', 'SLM', 'PyTorch', 'RAG', 'Quantization', 'On-Device']
      },
      solvedCaseSummary: '모바일 디바이스에서 3초 내 구동되는 4-bit 양자화 온디바이스 벡터 검색 파이프라인 개발 및 상용화',
      availability: 'COFFEE_CHAT_OPEN',
      degree: 2,
      bridgeColleagueName: '정현우',
      bridgeDepartment: '기술연구소',
      recommendedAgenda: [
        '모바일 환경에서 로컬 임베딩과 디바이스 배터리 최적화 기법',
        '사내 폐쇄망 환경을 위한 하이브리드 RAG 라우팅 아키텍처',
        '양자화(Quantization) 과정에서 발생하는 한국어 할루시네이션 완화 전략'
      ],
      hasConsulted: false
    },
    {
      id: 'k-prof-3',
      personId: 'peer-c-4',
      personName: '송하은',
      companyName: '스튜디오 크래프트',
      currentTitle: '프로덕트 디자인 리드',
      primaryTopic: {
        id: 'top-design-tokens',
        title: 'Figma Tokens 기반 엔터프라이즈 디자인 시스템 자동화',
        category: 'DESIGN_SYSTEM',
        tags: ['Figma', 'Design System', 'UI/UX', 'Tailwind', 'Tokens']
      },
      solvedCaseSummary: '개발-디자인 간 디자인 토큰 동기화 파이프라인 구축으로 신규 피처 UI 배포 주기 40% 단축',
      availability: 'COFFEE_CHAT_OPEN',
      degree: 2,
      bridgeColleagueName: '이수민',
      bridgeDepartment: '프로덕트본부',
      recommendedAgenda: [
        'Figma Tokens와 Tailwind CSS 테마 자동 빌드 파이프라인',
        '다크모드 및 접근성(A11y) 기준 통과를 위한 토큰 체계',
        '디자이너와 엔지니어 간의 디자인 QA 리드타임 단축 노하우'
      ],
      hasConsulted: false
    },
    {
      id: 'k-prof-4',
      personId: 'peer-c-5',
      personName: '장민수',
      companyName: '넥스트세일즈 솔루션즈',
      currentTitle: 'B2B 사업개발 총괄',
      primaryTopic: {
        id: 'top-b2b-saas-pricing',
        title: 'B2B SaaS 셀프서브 과금 모델 설계 & 엔터프라이즈 업셀링',
        category: 'GROWTH_BIZ',
        tags: ['B2B Sales', 'Pricing', 'PLG', 'Enterprise', 'GTM']
      },
      solvedCaseSummary: 'PLG(제품 주도 성장) 도입 후 ACV(연간 계약 가치) 2.5배 성장 및 엔터프라이즈 POC 전환율 35% 달성',
      availability: 'CASUAL_CALL_ONLY',
      degree: 2,
      bridgeColleagueName: '박지훈',
      bridgeDepartment: '사업기획팀',
      recommendedAgenda: [
        '무료 티어(Free Tier) 기능 제한과 유료 전환 트리거 설계',
        '엔터프라이즈 보안 감사(SOC2/ISO) 요구사항 대응 및 계약 구조화',
        '세일즈 주도 파이프라인과 인바운드 마케팅의 정렬 전략'
      ],
      hasConsulted: true,
      consultedAt: '2026-03-25T14:00:00Z'
    },
    {
      id: 'k-prof-5',
      personId: p1?.id || 'p-1',
      personName: p1?.name || '윤서진',
      companyName: p1?.currentCompany || '하이퍼플로우 랩스',
      currentTitle: p1?.currentTitle || 'Lead Builder',
      primaryTopic: {
        id: 'top-canvas-engine',
        title: 'Next.js 15 Server Actions & 대규모 실시간 캔버스 최적화',
        category: 'ENGINEERING',
        tags: ['React', 'Next.js', 'Canvas', 'WebGL', 'TypeScript']
      },
      solvedCaseSummary: '동시 접속 1만 명 환경에서 초당 60fps를 유지하는 WebGL/Canvas 가상 렌더링 엔진 구축',
      availability: 'COFFEE_CHAT_OPEN',
      degree: 1,
      recommendedAgenda: [
        'React 19 Server Actions를 활용한 상태 동기화 병목 해소',
        '대규모 캔버스 물리 인터랙션 메모리 누수 방지 기법',
        '웹소켓 재연결 및 오프라인 상태 낙관적 업데이트(Optimistic Update) 패턴'
      ],
      hasConsulted: false
    },
    {
      id: 'k-prof-6',
      personId: p2?.id || 'p-2',
      personName: p2?.name || '강민석',
      companyName: p2?.currentCompany || '핀스케일',
      currentTitle: p2?.currentTitle || 'CTO',
      primaryTopic: {
        id: 'top-fintech-distributed',
        title: '무중단 금융 결제 트랜잭션 멱등성(Idempotency) 아키텍처',
        category: 'ENGINEERING',
        tags: ['Fintech', 'Distributed Systems', 'Kafka', 'Go', 'RDBMS']
      },
      solvedCaseSummary: '초당 3,000건의 실시간 결제 요청 시 네트워크 유실 상황에서도 결제 중복을 0건으로 보장하는 분산 멱등성 락 엔진 구축',
      availability: 'COFFEE_CHAT_OPEN',
      degree: 1,
      recommendedAgenda: [
        '분산 환경에서 Redis/DB 복합 분산 락 구현 시 엣지 케이스 방어',
        'Kafka 이벤트 순서 보장과 결제 트랜잭션 분리 패턴',
        '금융 보안 감사 준수를 위한 암호화 감사 로그 설계'
      ],
      hasConsulted: false
    }
  ];
}

let inMemoryExpertProfiles: ExpertMentorProfile[] | null = null;

/**
 * 전문가 멘토 프로필 목록 로드 (인메모리 및 로컬스토리지 영속화)
 */
export function loadExpertMentorProfiles(people: Person[]): ExpertMentorProfile[] {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_KNOWLEDGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemoryExpertProfiles = parsed;
          return parsed;
        }
      }
    } catch {
      // 로컬스토리지 파싱 에러 방어
    }
  }

  if (inMemoryExpertProfiles && inMemoryExpertProfiles.length > 0) {
    return inMemoryExpertProfiles;
  }

  const defaults = createDefaultExpertProfiles(people);
  inMemoryExpertProfiles = defaults;
  saveExpertMentorProfiles(defaults);
  return defaults;
}

/**
 * 전문가 멘토 프로필 목록 저장
 */
export function saveExpertMentorProfiles(profiles: ExpertMentorProfile[]): void {
  inMemoryExpertProfiles = profiles;
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KNOWLEDGE_KEY, JSON.stringify(profiles));
    } catch {
      // 로컬스토리지 에러 방어
    }
  }
}

/**
 * 카테고리 및 검색어 필터링
 */
export function filterExpertProfiles(
  profiles: ExpertMentorProfile[],
  categoryFilter: 'ALL' | SuperpowerCategory,
  searchQuery: string = ''
): ExpertMentorProfile[] {
  return profiles.filter(profile => {
    // 카테고리 필터
    if (categoryFilter !== 'ALL' && profile.primaryTopic.category !== categoryFilter) {
      return false;
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = profile.personName.toLowerCase().includes(q);
      const matchCompany = profile.companyName.toLowerCase().includes(q);
      const matchTitle = profile.primaryTopic.title.toLowerCase().includes(q);
      const matchSummary = profile.solvedCaseSummary.toLowerCase().includes(q);
      const matchTags = profile.primaryTopic.tags.some(tag => tag.toLowerCase().includes(q));

      if (!matchName && !matchCompany && !matchTitle && !matchSummary && !matchTags) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 전문성을 존중하는 1:1 실무 자문 티타임 서신 자동 합성
 */
export function generateKnowledgeCoffeeChatLetter(
  expert: ExpertMentorProfile,
  requesterName: string = '동료',
  customNote?: string
): string {
  const introGreeting = expert.degree === 2 && expert.bridgeColleagueName
    ? `안녕하세요, ${expert.personName} 님! ${expert.bridgeColleagueName} 님 소개로 인사드리게 된 ${requesterName}입니다.`
    : `안녕하세요, ${expert.personName} 님! ${requesterName}입니다. 오랜만에 연락드립니다.`;

  const agendaLines = expert.recommendedAgenda
    .map((item, idx) => `  ${idx + 1}) ${item}`)
    .join('\n');

  return `${introGreeting}

최근 ${expert.companyName}에서 이뤄내신 [${expert.primaryTopic.title}] 관련 탁월한 실무 성과와 문제 해결 사례를 인상 깊게 접했습니다.

현재 저희 팀에서도 유사한 도메인 과제를 고도화하고 있어, 해당 분야에서 실제 검증된 경험을 보유하신 ${expert.personName} 님의 고견을 조심스럽게 여쭙고자 연락을 드립니다.

【 30분 자문 요청 핵심 의제 】
${agendaLines}
${customNote ? `\n【 추가 문의 사항 】\n${customNote}\n` : ''}
바쁘신 실무 일정에 결례가 되지 않도록, 부담 없는 30분 캐주얼 모닝 커피나 편하신 온라인 티타임(Zoom/Meet)으로 모시고자 합니다. 

소중한 시간을 내어주시는 만큼 감사의 마음을 담아 작은 커피 기프티콘을 준비해 두었습니다. 편하신 일정이나 장소를 말씀해 주시면 제가 맞춰서 준비하겠습니다.

감사합니다.

- ${requesterName} 드림`;
}

/**
 * 자문 요청 완료 처리
 */
export function markConsultationSent(
  profileId: string,
  profiles: ExpertMentorProfile[]
): ExpertMentorProfile[] {
  const updated = profiles.map(p => {
    if (p.id === profileId) {
      return {
        ...p,
        hasConsulted: true,
        consultedAt: new Date().toISOString()
      };
    }
    return p;
  });

  saveExpertMentorProfiles(updated);
  return updated;
}

/**
 * 지식 교환 요약 통계 산출
 */
export function getKnowledgeSummaryStats(profiles: ExpertMentorProfile[]): KnowledgeSummaryStats {
  let firstDegreeCount = 0;
  let secondDegreeCount = 0;
  let consultedCount = 0;

  for (const p of profiles) {
    if (p.degree === 1) {
      firstDegreeCount++;
    } else {
      secondDegreeCount++;
    }

    if (p.hasConsulted) {
      consultedCount++;
    }
  }

  return {
    totalTopics: profiles.length,
    firstDegreeCount,
    secondDegreeCount,
    consultedCount
  };
}
