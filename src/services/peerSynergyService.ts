/**
 * ConnectWe Peer Talent Synergy & Growth Studio Service
 * 실무 인재(개발자/디자이너/PM/기획자) 중심 테크 스택, 사내 추천, 스터디 길드, 커피챗 인사이트 통합 서비스
 */

import { Person } from '../types/network';
import { 
  TechSkillNode, 
  TechExpertMatch,
  WarmReferralJob,
  ReferralLetterPreset,
  StudyGuildPod,
  GuildProposalDocument,
  CoffeeChatInsightNote,
  GratitudeCardPreset
} from '../types/peerSynergy';

const STORAGE_KEY_GUILDS = 'cw_peer_study_guilds_v1';
const STORAGE_KEY_INSIGHT_NOTES = 'cw_peer_coffee_insight_notes_v1';

// ==========================================
// 1. 테크 스택 & 도메인 랜드스케이프
// ==========================================

export const TECH_SKILL_NODES: TechSkillNode[] = [
  {
    id: 'tech-react-next',
    name: 'React 19 & Next.js App Router',
    category: 'frontend',
    categoryLabel: '프론트엔드 & UI',
    verifiedInProduction: true,
    expertCount: 4,
    tags: ['Server Actions', 'RSC', 'Web Vitals', 'SSR/SSG'],
    description: '대규모 트래픽 서비스의 SSR 성능 최적화 및 최신 리액트 아키텍처 실무 도입 경험'
  },
  {
    id: 'tech-design-systems',
    name: 'Figma Tokens & Design System',
    category: 'frontend',
    categoryLabel: '프론트엔드 & UI',
    verifiedInProduction: true,
    expertCount: 3,
    tags: ['Tailwind CSS', 'Figma Tokens', 'Storybook', 'WCAG 접근성'],
    description: '크로스 플랫폼 UI 일관성 유지 및 디자이너-엔지니어 간 무결점 핸드오프 시스템 구축'
  },
  {
    id: 'tech-k8s-cloud',
    name: 'Kubernetes & FinOps (AWS/GCP)',
    category: 'cloud_devops',
    categoryLabel: '클라우드 & 인프라',
    verifiedInProduction: true,
    expertCount: 3,
    tags: ['EKS', 'ArgoCD', 'Terraform', '클라우드 비용 35% 절감'],
    description: '멀티 클러스터 무중단 배포 파이프라인 및 엔터프라이즈 클라우드 비용 효율화'
  },
  {
    id: 'tech-ai-slm',
    name: 'On-Device SLM & Vector RAG',
    category: 'ai_data',
    categoryLabel: 'AI & 데이터',
    verifiedInProduction: true,
    expertCount: 3,
    tags: ['LangGraph', 'Qdrant/Pinecone', 'vLLM', '프라이빗 AI'],
    description: '사내 보안 데이터를 외부 유출 없이 로컬 경량 모델과 벡터 검색으로 지능화'
  },
  {
    id: 'tech-backend-go-node',
    name: 'High-Concurrency Go & Node.js',
    category: 'backend',
    categoryLabel: '백엔드 & 분산 아키텍처',
    verifiedInProduction: true,
    expertCount: 5,
    tags: ['gRPC', 'Kafka', 'Redis Sentinel', '분산 트랜잭션'],
    description: '초당 수만 건 TPS 환경의 금융/커머스 분산 트랜잭션 안정성 설계'
  },
  {
    id: 'tech-saas-billing',
    name: 'B2B SaaS Pricing & Product Ops',
    category: 'product_growth',
    categoryLabel: '프로덕트 & 비즈니스',
    verifiedInProduction: true,
    expertCount: 4,
    tags: ['Usage-based Billing', 'Stripe/토스페이먼츠', 'PLG 퍼널', 'MRR 성장'],
    description: '글로벌 엔터프라이즈 종량제 과금 엔진 및 데이터 기반 온보딩 퍼널 최적화'
  }
];

/**
 * 특정 기술 스택의 실무 경험자 매핑 (1촌 및 2촌 통합)
 */
export function getExpertsForTechSkill(skillId: string, people: Person[]): TechExpertMatch[] {
  const node = TECH_SKILL_NODES.find(n => n.id === skillId);
  if (!node) return [];

  const matches: TechExpertMatch[] = [];

  // 1촌 주소록 인맥 매핑
  people.forEach(p => {
    const isMatched = p.skills.some(s => node.tags.some(t => s.toLowerCase().includes(t.toLowerCase()))) ||
      p.primaryDomain.toLowerCase().includes(node.category.toLowerCase()) ||
      p.currentTitle.toLowerCase().includes('frontend') || p.currentTitle.toLowerCase().includes('개발') ||
      p.currentTitle.toLowerCase().includes('engineer') || p.currentTitle.toLowerCase().includes('디자이너');

    if (isMatched) {
      matches.push({
        personId: p.id,
        name: p.name,
        currentCompany: p.currentCompany,
        currentTitle: p.currentTitle,
        closeness: p.closeness,
        experienceHighlight: `${p.currentCompany}에서 ${node.name} 기반 실서비스 아키텍처 설계 및 프로덕션 안정화 주도`,
        productionStack: [node.name, ...p.skills.slice(0, 3)],
        sampleDiscussionTopics: [
          `${node.name} 도입 시 마주쳤던 가장 큰 트레이드오프 및 극복기`,
          '실제 배포 운영 시 체감한 성능 및 유지보수성 변화',
          '주니어 및 팀원 온보딩 시 겪었던 베스트 프랙티스'
        ]
      });
    }
  });

  // 2촌 동료 실무자 보강 (사내 협업 네트워크)
  matches.push({
    personId: 'peer_ext_1',
    name: '강동원',
    currentCompany: '넥스트비전 AI',
    currentTitle: 'DevOps & FinOps Lead',
    closeness: 2,
    experienceHighlight: 'K8s 기반 EKS 클러스터 비용 40% 절감 및 ArgoCD GitOps 구축',
    productionStack: ['Kubernetes', 'Terraform', 'AWS EKS', 'Prometheus'],
    sampleDiscussionTopics: [
      '쿠버네티스 리소스 Request/Limit 튜닝 노하우',
      '스팟 인스턴스 무중단 장애 복구 파이프라인'
    ]
  });

  matches.push({
    personId: 'peer_ext_2',
    name: '송하은',
    currentCompany: '비바리퍼블리카',
    currentTitle: 'Design System Architect',
    closeness: 2,
    experienceHighlight: '디자인 토큰 자동화 및 30+ 제품 스쿼드 공통 컴포넌트 라이브러리 운영',
    productionStack: ['Figma Tokens', 'React', 'Tailwind CSS', 'Storybook'],
    sampleDiscussionTopics: [
      '디자이너와 프론트엔드 간 Single Source of Truth 맞추기',
      '접근성(A11y) 기준을 준수하는 디자인 컴포넌트 설계'
    ]
  });

  return matches;
}

/**
 * 기술 스택 도입 자문용 정중한 커피챗 서신 생성
 */
export function generateTechAdviceLetter(skill: TechSkillNode, expert: TechExpertMatch): string {
  return `안녕하세요, ${expert.name} 님!
${expert.currentCompany}에서의 멋진 기술적 성과와 프로덕트 여정을 항상 인상 깊게 응원해 오고 있습니다.

다름이 아니라, 저희 팀에서 최근 [${skill.name}] 실서비스 도입 및 아키텍처 최적화를 심도 있게 검토하고 있어, 이미 프로덕션에서 수많은 고민과 성공을 이끌어오신 ${expert.name} 님의 귀한 경험을 여쭙고자 조심스럽게 연락을 드립니다.

바쁘신 일정 중이시라면 편하신 시간대(온라인 20분 또는 회사 인근 캐주얼 티타임)에 따뜻한 커피 한 잔 모시며 가볍게 이야기 나누고 싶습니다.
(감사의 마음을 담아 즐겨드시는 커피 기프티콘을 먼저 보내드립니다!)

혹시 가능하신 일정이나 시간대가 있으시다면 편안히 말씀해 주시면 제가 맞춰서 찾아뵙겠습니다. 감사합니다.

[자문 희망 핵심 질문 3선]
1. ${skill.name} 프로덕션 도입 시 가장 신중하게 고려해야 할 트레이드오프
2. 장애 대응 및 모니터링 시 가장 유용했던 도구 및 패턴
3. 팀원들의 학습 곡선을 단축했던 실무적 온보딩 팁`;
}

// ==========================================
// 2. 따뜻한 사내 채용 추천 (Warm Referral)
// ==========================================

export const MOCK_WARM_REFERRAL_JOBS: WarmReferralJob[] = [
  {
    id: 'job-toss-core',
    title: 'Core Banking / FinTech 분산 시스템 백엔드 엔지니어',
    company: '토스 (비바리퍼블리카)',
    department: 'Core Banking Platform Tribe',
    location: '서울 역삼동 (하이브리드 근무)',
    requiredSkills: ['Java/Kotlin', 'Spring Boot', 'Kafka', '대규모 트래픽 분산 트랜잭션'],
    jobLevel: 'Senior (5년~10년)',
    internalReferrer: {
      personId: 'ref-toss-1',
      name: '이수진',
      title: 'Platform Lead (동문 1촌)',
      closeness: 1
    },
    referralReward: '합격 입사 시 추천 감사 리워드 150만원 지원',
    teamCultureHighlights: [
      '자율과 책임 중심의 사내 문화, 불필요한 결재선 제로',
      '전사 분산 시스템 아키텍처 토론 매주 활발',
      '최고 사양 장비 및 연간 자기계발비 전액 지원'
    ],
    isOpen: true
  },
  {
    id: 'job-naver-ai',
    title: 'Search AI & 엔터프라이즈 RAG 솔루션 엔지니어',
    company: '네이버 (NAVER)',
    department: 'Search & LLM Studio',
    location: '경기 성남 분당 그린팩토리',
    requiredSkills: ['Python', 'PyTorch', 'Vector DB', 'LangChain/LangGraph'],
    jobLevel: 'Lead / Principal (7년+)',
    internalReferrer: {
      personId: 'ref-naver-1',
      name: '문성호',
      title: 'AI Lab 수석 연구원 (사내 동료 2촌)',
      closeness: 2
    },
    referralReward: '합격 입사 시 추천 감사 리워드 200만원 지원',
    teamCultureHighlights: [
      '국내 최대 규모 GPU 클러스터 및 자체 인프라 자율 활용',
      '글로벌 AI 학회 논문 발표 및 오픈소스 기여 적극 장려',
      '유연근무제 및 리모트 근무 선택권 보장'
    ],
    isOpen: true
  },
  {
    id: 'job-hypercloud-infra',
    title: 'Cloud Native & FinOps 플랫폼 아키텍트',
    company: '하이퍼클라우드',
    department: 'Cloud Platform Engineering',
    location: '서울 강남구 테헤란로',
    requiredSkills: ['Kubernetes', 'Go', 'AWS/GCP Multi-cloud', 'Terraform'],
    jobLevel: 'Staff Engineer (6년+)',
    internalReferrer: {
      personId: 'ref-hyper-1',
      name: '강동원',
      title: 'Infra Lead (알럼나이 1촌)',
      closeness: 1
    },
    referralReward: '합격 입사 시 추천 감사 리워드 100만원 지원',
    teamCultureHighlights: [
      'GitOps 기반 100% 자동화 인프라 파이프라인',
      '클라우드 비용 절감 성과에 따른 분기별 인센티브',
      '기술 주도권 100% 엔지니어링 조직'
    ],
    isOpen: true
  }
];

export function generateWarmReferralLetter(
  job: WarmReferralJob, 
  presetType: ReferralLetterPreset['type'],
  applicantName: string = '홍길동'
): ReferralLetterPreset {
  if (presetType === 'TEA_CHAT_CULTURE') {
    return {
      type: 'TEA_CHAT_CULTURE',
      title: '사내 문화 & 실무 가벼운 커피챗 요청 서신',
      description: '지원 전 재직 지인에게 팀 분위기와 실무 상황을 가볍게 여쭤보는 정중한 서신',
      content: `안녕하세요, ${job.internalReferrer.name} 님! 오랜만에 인사드립니다.
항상 ${job.company}에서 멋진 행보를 펼치시는 모습을 지켜보며 많은 영감을 받고 있습니다.

다름이 아니라, 최근 ${job.company}의 [${job.title}] 포지션을 보며 평소 제가 집중해 온 기술 도메인과 지향하는 방향성에 매우 잘 맞아 깊은 관심을 갖게 되었습니다.

지원하기에 앞서, 실제로 현업에서 계신 ${job.internalReferrer.name} 님께 조직의 실무 분위기나 팀의 현재 집중 과제에 대해 가볍게 여쭤보고 싶습니다.
시간 되실 때 온/오프라인으로 15분 정도 짧은 티타임이 가능하실지 조심스럽게 여쭙니다.

따뜻한 차 한 잔 모시겠습니다. 편안하게 답장 주시면 감사하겠습니다!`
    };
  }

  if (presetType === 'INTERNAL_REFERRAL_ASK') {
    return {
      type: 'INTERNAL_REFERRAL_ASK',
      title: '정중한 사내 추천(Internal Referral) 부탁 서신',
      description: '사내 추천 제도를 통해 지원 의사를 전하고 내부 추천을 부탁하는 격조 있는 서신',
      content: `안녕하세요, ${job.internalReferrer.name} 님.
${job.company}에서 활약하고 계신 모습을 늘 응원하고 있습니다.

이번에 공고된 [${job.department} - ${job.title}] 포지션에 제 강점을 바탕으로 적극적으로 도전해보고자 준비하고 있습니다.

저의 상세 이력서와 주요 포트폴리오를 첨부해 드립니다. ${job.internalReferrer.name} 님께서 살펴보시고, ${job.company}의 사내 추천(Employee Referral) 전형으로 정중히 전달해 주실 수 있다면 더없이 큰 영광이겠습니다.

추천해 주시는 분의 명성에 누가 되지 않도록 인터뷰 과정에 최고의 진정성으로 임하겠습니다. 소중한 시간 내어 검토해 주셔서 진심으로 감사드립니다.`
    };
  }

  return {
    type: 'PEER_RECOMMENDATION',
    title: '사내 추천서 (지인 추천 멘트 초안)',
    description: '추천인이 사내 채용 시스템에 지원자를 보증하며 입력할 수 있는 1-Page 추천서',
    content: `[사내 인재 추천서 - ${applicantName} 님]

1. 지원자와의 인연 및 신뢰 관계:
${applicantName} 님은 이전 프로젝트 및 기술 커뮤니티에서 함께 호흡을 맞추며, 주도적인 문제 해결력과 탄탄한 엔지니어링 기본기를 깊이 검증한 신뢰도 높은 동료입니다.

2. 추천 사유 및 핵심 역량:
[${job.title}] 포지션에서 요구하는 ${job.requiredSkills.slice(0, 2).join(', ')} 분야의 실무 감각이 매우 뛰어나며, 무엇보다 새로운 도메인에 대한 빠른 학습력과 팀원들과의 부드러운 협업 에너지를 보유하고 있습니다.

3. 조직 적합도 (Culture Fit):
${job.company}의 자율성과 실행력을 상호 보완해 줄 최고의 실무 인재임을 확신하며, 본 포지션의 인터뷰 대상자로 적극 추천합니다.`
  };
}

// ==========================================
// 3. 스터디 & 사이드 프로젝트 길드
// ==========================================

export const INITIAL_STUDY_GUILDS: StudyGuildPod[] = [
  {
    id: 'guild-ai-agent',
    title: 'Next.js 15 & AI Agent 풀스택 토이 프로젝트 팟',
    category: 'AI_AGENT',
    categoryLabel: 'AI & 풀스택 프로젝트',
    goal: 'LangGraph와 Supabase Vector를 결합하여 실제 동작하는 C-Level 비즈니스 인텔리전스 데모 앱 제작',
    leaderName: '윤서진',
    leaderCompany: '카카오모빌리티',
    leaderTitle: 'Full-stack Architect',
    requiredRoles: ['Frontend (Next.js)', 'Python AI Agent', 'Product Designer'],
    currentMembers: [
      { id: 'gm-1', name: '윤서진', role: 'Full-stack Lead', company: '카카오모빌리티', joinedAt: '2026-09-20' },
      { id: 'gm-2', name: '김동우', role: 'Backend Engineer', company: '하이퍼클라우드', joinedAt: '2026-09-25' }
    ],
    maxMembers: 5,
    meetingSchedule: '격주 화요일 밤 9:00 (온라인 Discord / 6주 완성)',
    techStacks: ['Next.js 15', 'TypeScript', 'LangGraph', 'Supabase Vector', 'Tailwind'],
    status: 'RECRUITING'
  },
  {
    id: 'guild-design-system',
    title: 'B2B SaaS 피그마 토큰 & 리액트 디자인 시스템 리팩토링 스터디',
    category: 'DESIGN_SYSTEM',
    categoryLabel: '디자인 시스템 & UI',
    goal: '다크모드 완벽 대응, WCAG AAA 접근성 컴포넌트 30종 오픈소스 라이브러리 패키징',
    leaderName: '송하은',
    leaderCompany: '비바리퍼블리카',
    leaderTitle: 'Design System Lead',
    requiredRoles: ['Product Designer', 'Frontend Engineer (2명)'],
    currentMembers: [
      { id: 'gm-3', name: '송하은', role: 'Design Lead', company: '비바리퍼블리카', joinedAt: '2026-09-22' }
    ],
    maxMembers: 4,
    meetingSchedule: '매주 목요일 저녁 8:30 (온라인 Zoom)',
    techStacks: ['Figma Tokens', 'React', 'Storybook', 'Radix UI', 'CSS Modules'],
    status: 'RECRUITING'
  },
  {
    id: 'guild-devops-finops',
    title: '스타트업을 위한 AWS FinOps & K8s 경량 인프라 구축 스터디',
    category: 'DEVOPS_FINOPS',
    categoryLabel: 'DevOps & FinOps',
    goal: '월 인프라 비용 50만원 이하로 운영하는 멀티 클러스터 및 모니터링 템플릿 완성',
    leaderName: '강동원',
    leaderCompany: '넥스트비전 AI',
    leaderTitle: 'DevOps Lead',
    requiredRoles: ['Backend Developer', 'Infra Enthusiast'],
    currentMembers: [
      { id: 'gm-4', name: '강동원', role: 'Infra Lead', company: '넥스트비전 AI', joinedAt: '2026-09-18' },
      { id: 'gm-5', name: '장민수', role: 'Backend Developer', company: '토스', joinedAt: '2026-09-28' }
    ],
    maxMembers: 4,
    meetingSchedule: '격주 일요일 오전 10:30 (강남역 인근 오프라인 티타임)',
    techStacks: ['AWS EKS', 'Terraform', 'Prometheus', 'Grafana', 'Docker'],
    status: 'RECRUITING'
  }
];

export function loadStudyGuilds(): StudyGuildPod[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GUILDS);
    if (!raw) {
      saveStudyGuilds(INITIAL_STUDY_GUILDS);
      return INITIAL_STUDY_GUILDS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_STUDY_GUILDS;
  }
}

export function saveStudyGuilds(guilds: StudyGuildPod[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_GUILDS, JSON.stringify(guilds));
  } catch (e) {
    console.error('Failed to save study guilds:', e);
  }
}

export function toggleJoinGuild(guildId: string, applicant: { name: string; role: string; company: string }): StudyGuildPod[] {
  const list = loadStudyGuilds();
  const updated = list.map(g => {
    if (g.id === guildId) {
      const already = g.currentMembers.some(m => m.name === applicant.name);
      let nextMembers = g.currentMembers;
      if (already) {
        nextMembers = g.currentMembers.filter(m => m.name !== applicant.name);
      } else {
        if (g.currentMembers.length < g.maxMembers) {
          nextMembers = [
            ...g.currentMembers,
            {
              id: `gm-${Date.now()}`,
              name: applicant.name,
              role: applicant.role,
              company: applicant.company,
              joinedAt: new Date().toISOString().split('T')[0]
            }
          ];
        }
      }
      return {
        ...g,
        currentMembers: nextMembers,
        status: (nextMembers.length >= g.maxMembers ? 'IN_PROGRESS' : 'RECRUITING') as StudyGuildPod['status']
      };
    }
    return g;
  });

  saveStudyGuilds(updated);
  return updated;
}

export function generateGuildShareProposal(guild: StudyGuildPod): GuildProposalDocument {
  const shareTitle = `[실무 스터디 팟 모집] ${guild.title}`;
  const shareBody = `🚀 함께할 멋진 동료를 찾습니다!

📌 스터디 목표:
${guild.goal}

👥 리더: ${guild.leaderName} (${guild.leaderCompany} / ${guild.leaderTitle})
🎯 모집 포지션: ${guild.requiredRoles.join(', ')}
⏰ 정기 일정: ${guild.meetingSchedule}
🛠 기술 스택: ${guild.techStacks.join(', ')}
현재 참가 인원: ${guild.currentMembers.length}/${guild.maxMembers}명

실무 지식을 나누고 포트폴리오를 함께 완성하고 싶으신 분은 편하게 연락 주세요! ConnectWe에서 참가 신청하실 수 있습니다.`;

  return {
    guildId: guild.id,
    shareTitle,
    shareBody
  };
}

// ==========================================
// 4. 커피챗 인사이트 & 상호 회고 노트 볼트
// ==========================================

export const INITIAL_INSIGHT_NOTES: CoffeeChatInsightNote[] = [
  {
    id: 'note-1',
    personId: 'p_tech_1',
    personName: '강동원',
    company: '넥스트비전 AI',
    title: 'DevOps & FinOps Lead',
    metAt: '2026-09-28',
    discussionTheme: 'EKS 멀티 클러스터 비용 30% 절감 노하우 & Spot 인스턴스 전략',
    keyTakeaways: [
      'Karpenter를 활용한 동적 프로비저닝으로 노드 유휴 비용 28% 즉시 절감',
      '상태 없는(Stateless) 워커 노드는 스팟 인스턴스 80% 혼합 구성이 안정적',
      'Datadog 대신 오픈소스 Grafana LGTM 스택 전환으로 SaaS 비용 대폭 압축'
    ],
    recommendedTools: ['Karpenter', 'ArgoCD', 'Grafana Mimir', 'AWS Cost Explorer API'],
    nextAction: '다음 주 스프린트에 Karpenter 프로비저너 테스트 클러스터 배포 후 실측치 확인',
    gratitudeSent: true,
    createdAt: '2026-09-28 17:30'
  }
];

export function loadCoffeeChatNotes(): CoffeeChatInsightNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_INSIGHT_NOTES);
    if (!raw) {
      saveCoffeeChatNotes(INITIAL_INSIGHT_NOTES);
      return INITIAL_INSIGHT_NOTES;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_INSIGHT_NOTES;
  }
}

export function saveCoffeeChatNotes(notes: CoffeeChatInsightNote[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_INSIGHT_NOTES, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to save coffee chat notes:', e);
  }
}

export function addCoffeeChatNote(note: Omit<CoffeeChatInsightNote, 'id' | 'createdAt'>): CoffeeChatInsightNote[] {
  const current = loadCoffeeChatNotes();
  const newNote: CoffeeChatInsightNote = {
    ...note,
    id: `note-${Date.now()}`,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
  };
  const updated = [newNote, ...current];
  saveCoffeeChatNotes(updated);
  return updated;
}

export function markGratitudeSent(noteId: string): CoffeeChatInsightNote[] {
  const current = loadCoffeeChatNotes();
  const updated = current.map(n => n.id === noteId ? { ...n, gratitudeSent: true } : n);
  saveCoffeeChatNotes(updated);
  return updated;
}

export function generateGratitudeFeedbackCard(note: CoffeeChatInsightNote): GratitudeCardPreset {
  return {
    title: `[${note.personName} 님께 보내는] 따뜻한 커피챗 감사 서신 카드`,
    content: `${note.personName} 님, 안녕하세요!
오늘 바쁘신 일정 중에도 귀한 시간을 내어주셔서 진심으로 감사드립니다.

특히 나누어 주셨던 말씀 중:
"${note.keyTakeaways[0] || note.discussionTheme}"
부분은 저희 팀의 다음 기술적 방향성을 정립하는 데 정말 결정적인 인사이트가 되었습니다.

조언해 주신 [${note.recommendedTools.slice(0, 2).join(', ')}] 도입 팁도 잘 검토하여 실무에 멋지게 적용해 보겠습니다.
멋진 영감을 주셔서 다시 한번 깊이 감사드리며, 다음번에는 제가 더 유익한 소식과 맛있는 식사 대접하겠습니다.

늘 건강하시고 즐거운 한 주 되세요!`
  };
}
