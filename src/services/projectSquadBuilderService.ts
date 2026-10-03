import { Person } from '../types/network';

export type SquadRoleId = 
  | 'PRODUCT_LEAD'
  | 'TECH_LEAD_AI'
  | 'FRONTEND_DEV'
  | 'BACKEND_INFRA'
  | 'PRODUCT_DESIGN'
  | 'BUSINESS_GROWTH';

export interface SquadRoleDefinition {
  id: SquadRoleId;
  label: string;
  category: 'PRODUCT' | 'ENGINEERING' | 'DESIGN' | 'BUSINESS';
  recommendedSkills: string[];
  targetTitles: string[];
  targetDomains: string[];
  description: string;
  badgeColor: string;
}

export interface SquadTemplate {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  iconName: string;
  roles: SquadRoleId[];
}

export interface CandidateMatch {
  person: Person;
  score: number; // 0 ~ 100
  matchLevel: 'EXCELLENT' | 'HIGH' | 'GOOD' | 'MODERATE';
  matchedSkills: string[];
  missingRecommendedSkills: string[];
  highlightReason: string;
}

export interface SquadGapAnalysis {
  readinessScore: number; // 0 ~ 100
  totalSlots: number;
  filledSlots: number;
  unfilledRoleIds: SquadRoleId[];
  coveredSkills: string[];
  missingSkills: string[];
  recommendation: string;
}

/**
 * 6대 표준 실무 역할(Squad Roles) 정의
 */
export const SQUAD_ROLES: Record<SquadRoleId, SquadRoleDefinition> = {
  PRODUCT_LEAD: {
    id: 'PRODUCT_LEAD',
    label: '프로덕트 리드 (PO/PM)',
    category: 'PRODUCT',
    recommendedSkills: ['PM', 'Agile', 'Product Strategy', 'Roadmapping', 'User Research', 'Data Analysis'],
    targetTitles: ['pm', 'po', 'product manager', 'product owner', '기획', '프로덕트매니저', '팀장', '디렉터'],
    targetDomains: ['플랫폼', '모바일', 'saas', '이커머스', 'ai/llm', 'fintech'],
    description: '프로덕트 비전 수립, 사용자 요구사항 분석 및 로드맵 실행을 총괄하는 기획 리더',
    badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30'
  },
  TECH_LEAD_AI: {
    id: 'TECH_LEAD_AI',
    label: 'AI & 테크 리드 (AI/ML Lead)',
    category: 'ENGINEERING',
    recommendedSkills: ['Python', 'AI', 'LLM', 'PyTorch', 'LangChain', 'Deep Learning', 'MLOps'],
    targetTitles: ['ai', 'ml', '연구원', 'researcher', 'lead', '테크리드', 'cto', '아키텍트', '개발자'],
    targetDomains: ['ai/llm', '인공지능', '딥테크', '반도체', '머신러닝'],
    description: 'AI 모델링, 최신 알고리즘 파이프라인 구축 및 핵심 기술 난제를 돌파하는 엔지니어링 리더',
    badgeColor: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30'
  },
  FRONTEND_DEV: {
    id: 'FRONTEND_DEV',
    label: '프론트엔드 엔지니어 (Frontend/App)',
    category: 'ENGINEERING',
    recommendedSkills: ['React', 'TypeScript', 'Next.js', 'TailwindCSS', 'Flutter', 'iOS', 'Web Performance'],
    targetTitles: ['프론트', 'frontend', '웹개발', '앱개발', 'ios', 'android', '개발자', '엔지니어', 'software engineer'],
    targetDomains: ['웹', '모바일', 'saas', '플랫폼', '인터페이스'],
    description: '반응형 UI/UX를 빠르고 미려하게 구현하며 클라이언트 성능과 인터랙션을 책임지는 실무 엔지니어',
    badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
  },
  BACKEND_INFRA: {
    id: 'BACKEND_INFRA',
    label: '백엔드 & 클라우드 아키텍트 (Backend/Infra)',
    category: 'ENGINEERING',
    recommendedSkills: ['Node.js', 'Go', 'Python', 'AWS', 'Kubernetes', 'Docker', 'MSA', 'PostgreSQL', 'Redis'],
    targetTitles: ['백엔드', 'backend', '인프라', 'devops', 'cloud', '서버개발', '아키텍트', '엔지니어'],
    targetDomains: ['클라우드 인프라', '서버', '핀테크', '엔터프라이즈', '보안'],
    description: '안정적인 분산 시스템 설계, 대규모 트래픽 처리 API 및 무중단 클라우드 인프라를 구축하는 백엔드 전문가',
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/15 dark:text-blue-300 dark:border-blue-500/30'
  },
  PRODUCT_DESIGN: {
    id: 'PRODUCT_DESIGN',
    label: '프로덕트 디자이너 (UI/UX Designer)',
    category: 'DESIGN',
    recommendedSkills: ['Figma', 'UI/UX', 'Design System', 'Prototyping', 'User Testing', 'Interaction Design'],
    targetTitles: ['디자이너', 'designer', 'ui/ux', '프로덕트디자인', 'visual', 'creatives'],
    targetDomains: ['디자인', 'ui/ux', '브랜딩', '모바일앱', '플랫폼'],
    description: '애플 감성의 유려한 인터페이스, 디자인 시스템 규격화 및 사용자 경험(UX)을 극대화하는 디자이너',
    badgeColor: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
  },
  BUSINESS_GROWTH: {
    id: 'BUSINESS_GROWTH',
    label: '사업개발 & 그로스 리드 (BD/Growth)',
    category: 'BUSINESS',
    recommendedSkills: ['B2B Sales', 'Growth Hacking', 'Partnership', 'Performance Marketing', 'Deal Structuring', 'GTM Strategy'],
    targetTitles: ['사업개발', 'bd', 'biz', 'growth', '마케터', 'marketer', '영업', '세일즈', '파트너십'],
    targetDomains: ['사업개발', '마케팅', '그로스', 'b2b', '전략', '세일즈'],
    description: '시장 개척(GTM), 전략적 비즈니스 제휴 및 고밀도 사용자 획득을 주도하는 성장 실행 리더',
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30'
  }
};

/**
 * 4대 실무 스쿼드 표준 템플릿
 */
export const SQUAD_TEMPLATES: SquadTemplate[] = [
  {
    id: 'ai-product',
    title: 'AI/LLM 프로덕트 스쿼드',
    subtitle: '최첨단 생성형 AI 모델과 결합된 프로덕트 빠른 런칭',
    description: '최신 파운데이션 모델 파인튜닝과 직관적인 인터페이스를 갖춘 AI 중심 서비스를 런칭하기 위한 고밀도 팀입니다.',
    iconName: 'Cpu',
    roles: ['PRODUCT_LEAD', 'TECH_LEAD_AI', 'FRONTEND_DEV', 'BACKEND_INFRA']
  },
  {
    id: 'mvp-builder',
    title: '풀스택 웹/모바일 MVP 빌딩 팀',
    subtitle: '아이디어를 4주 내에 실제 서비스로 구현하는 쾌속 빌더 팀',
    description: '군더더기 없는 디자인과 강력한 클라이언트/서버 엔지니어링으로 시장 검증용 프로덕트를 구축합니다.',
    iconName: 'Rocket',
    roles: ['PRODUCT_LEAD', 'PRODUCT_DESIGN', 'FRONTEND_DEV', 'BACKEND_INFRA']
  },
  {
    id: 'b2b-tf',
    title: 'B2B 엔터프라이즈 신사업 개척 TF',
    subtitle: '대기업/금융권 엔터프라이즈 고객사 수주 및 솔루션 패키징',
    description: '기업 고객의 복잡한 요구사항을 해결하는 솔루션 아키텍처와 치밀한 B2B 제휴 영업을 동시 실행합니다.',
    iconName: 'Briefcase',
    roles: ['BUSINESS_GROWTH', 'PRODUCT_LEAD', 'BACKEND_INFRA']
  },
  {
    id: 'growth-marketing',
    title: '그로스 & 퍼포먼스 마케팅 스쿼드',
    subtitle: '지표 기반의 폭발적인 유저 획득과 전환율 극대화',
    description: '퍼포먼스 마케팅과 고전환 디자인, 데이터 분석 인프라를 결합하여 스케일업을 견인합니다.',
    iconName: 'TrendingUp',
    roles: ['BUSINESS_GROWTH', 'PRODUCT_DESIGN', 'FRONTEND_DEV']
  }
];

/**
 * 인물(Person)과 스쿼드 역할(SquadRoleDefinition) 간의 스킬 & 적합도 점수 계산
 */
export function calculateCandidateFit(person: Person, role: SquadRoleDefinition): CandidateMatch {
  const title = (person.currentTitle || '').toLowerCase();
  const domain = (person.primaryDomain || '').toLowerCase();
  const personSkills = (person.skills || []).map(s => s.toLowerCase());

  // 1. 직무(Title) 일치도 (최대 35점)
  let titleScore = 0;
  for (const t of role.targetTitles) {
    if (title.includes(t)) {
      titleScore = 35;
      break;
    }
  }
  if (titleScore === 0) {
    for (const t of role.targetTitles) {
      if (t.length > 2 && (title.includes(t.slice(0, 2)) || t.includes(title))) {
        titleScore = 20;
        break;
      }
    }
  }

  // 2. 보유 기술(Skills) 일치도 (최대 35점)
  const matchedSkills: string[] = [];
  const missingRecommendedSkills: string[] = [];

  for (const reqSkill of role.recommendedSkills) {
    const reqLower = reqSkill.toLowerCase();
    const isMatched = personSkills.some(ps => ps.includes(reqLower) || reqLower.includes(ps));
    if (isMatched) {
      matchedSkills.push(reqSkill);
    } else {
      missingRecommendedSkills.push(reqSkill);
    }
  }

  const skillScore = Math.min(
    35,
    Math.round((matchedSkills.length / Math.max(1, role.recommendedSkills.length)) * 40)
  );

  // 3. 주요 도메인(primaryDomain) 일치도 (최대 15점)
  let domainScore = 0;
  for (const d of role.targetDomains) {
    if (domain.includes(d)) {
      domainScore = 15;
      break;
    }
  }
  if (domainScore === 0 && domain.length > 0) {
    domainScore = 5;
  }

  // 4. 친밀도/협업 가능성 (Closeness) (최대 15점)
  let closenessScore = 10;
  if (person.closeness === 1 || person.closeness === 2) closenessScore = 15;
  else if (person.closeness === 3) closenessScore = 12;
  else if (person.closeness === 4) closenessScore = 8;
  else closenessScore = 5;

  // 총점 계산 (0 ~ 100)
  const totalScore = Math.min(100, titleScore + skillScore + domainScore + closenessScore);

  let matchLevel: CandidateMatch['matchLevel'] = 'MODERATE';
  if (totalScore >= 85) matchLevel = 'EXCELLENT';
  else if (totalScore >= 70) matchLevel = 'HIGH';
  else if (totalScore >= 55) matchLevel = 'GOOD';

  // 하이라이트 사유 도출
  let highlightReason = `${role.label} 분야에서 역량을 발휘할 수 있는 인재입니다.`;
  if (matchedSkills.length > 0) {
    highlightReason = `핵심 스킬 [${matchedSkills.slice(0, 3).join(', ')}]을(를) 보유하여 빠른 프로젝트 온보딩이 가능합니다.`;
  } else if (titleScore >= 30) {
    highlightReason = `현직 ${person.currentCompany} ${person.currentTitle} 직무 경험으로 역할 적합도가 뛰어납니다.`;
  }

  return {
    person,
    score: totalScore,
    matchLevel,
    matchedSkills,
    missingRecommendedSkills,
    highlightReason
  };
}

/**
 * 특정 역할에 가장 적합한 상위 후보 인재 목록 도출
 */
export function findBestCandidatesForRole(
  people: Person[],
  roleId: SquadRoleId,
  limit: number = 8
): CandidateMatch[] {
  const role = SQUAD_ROLES[roleId];
  if (!role) return [];

  const candidates: CandidateMatch[] = people
    .filter(p => p.id !== 'p-me') // 본인 제외
    .map(p => calculateCandidateFit(p, role));

  // 점수 내림차순 정렬
  candidates.sort((a, b) => b.score - a.score);

  return candidates.slice(0, limit);
}

/**
 * 현재 가상 스쿼드 편성 현황에 대한 갭(Gap) 및 준비도 분석
 */
export function analyzeSquadGaps(
  template: SquadTemplate,
  assignments: Record<string, Person | null>
): SquadGapAnalysis {
  const totalSlots = template.roles.length;
  let filledSlots = 0;
  const unfilledRoleIds: SquadRoleId[] = [];
  const coveredSkillsSet = new Set<string>();
  const allNeededSkillsSet = new Set<string>();

  for (const roleId of template.roles) {
    const roleDef = SQUAD_ROLES[roleId];
    if (roleDef) {
      roleDef.recommendedSkills.forEach(s => allNeededSkillsSet.add(s));
    }

    const assignedPerson = assignments[roleId];
    if (assignedPerson) {
      filledSlots += 1;
      (assignedPerson.skills || []).forEach(s => coveredSkillsSet.add(s));
    } else {
      unfilledRoleIds.push(roleId);
    }
  }

  const missingSkills: string[] = [];
  allNeededSkillsSet.forEach(needed => {
    const isCovered = Array.from(coveredSkillsSet).some(
      cov => cov.toLowerCase().includes(needed.toLowerCase()) || needed.toLowerCase().includes(cov.toLowerCase())
    );
    if (!isCovered) {
      missingSkills.push(needed);
    }
  });

  // 준비도 점수 산출: 슬롯 충원률(70%) + 스킬 커버리지(30%)
  const slotRatio = totalSlots > 0 ? filledSlots / totalSlots : 0;
  const skillRatio = allNeededSkillsSet.size > 0 
    ? (allNeededSkillsSet.size - missingSkills.length) / allNeededSkillsSet.size 
    : 0;

  const readinessScore = Math.min(100, Math.round((slotRatio * 70) + (skillRatio * 30)));

  let recommendation = '모든 핵심 역할이 충원되어 즉시 프로젝트 킥오프가 가능합니다.';
  if (unfilledRoleIds.length > 0) {
    const unfilledLabels = unfilledRoleIds.map(rid => SQUAD_ROLES[rid]?.label || rid).join(', ');
    recommendation = `현재 [${unfilledLabels}] 역할이 공석입니다. 우측 추천 후보자를 통해 슬롯을 채워주세요.`;
  } else if (missingSkills.length > 0) {
    recommendation = `전체 슬롯이 채워졌으나, [${missingSkills.slice(0, 2).join(', ')}] 역량 보강을 검토해 보세요.`;
  }

  return {
    readinessScore,
    totalSlots,
    filledSlots,
    unfilledRoleIds,
    coveredSkills: Array.from(coveredSkillsSet),
    missingSkills,
    recommendation
  };
}

/**
 * 특정 인재에게 제안할 1-Page 프로젝트 협업 & 티타임 제안서 마크다운 생성
 */
export function generateSquadInviteBrief(
  projectName: string,
  template: SquadTemplate,
  assignments: Record<string, Person | null>,
  targetPerson: Person,
  assignedRole: SquadRoleDefinition
): string {
  const today = new Date().toISOString().split('T')[0];
  const teammates = Object.entries(assignments)
    .filter(([, p]) => p && p.id !== targetPerson.id)
    .map(([rId, p]) => `- **${p?.name}** (${p?.currentCompany} ${p?.currentTitle}) : ${SQUAD_ROLES[rId as SquadRoleId]?.label || rId}`)
    .join('\n');

  return `[ConnectWe 프로젝트 비공개 파트너십 제안서]
발신: ConnectWe 팀 빌더
일시: ${today}
수신: ${targetPerson.name} 님 (${targetPerson.currentCompany} ${targetPerson.currentTitle})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
■ 프로젝트 개요
• 프로젝트명: ${projectName || template.title}
• 스쿼드 유형: ${template.title} (${template.subtitle})
• 제안 역할: 【 ${assignedRole.label} 】

■ 섭외 배경 및 기대 시너지
• ${targetPerson.name} 님께서 보유하신 [${(targetPerson.skills || []).slice(0, 3).join(', ') || assignedRole.recommendedSkills.slice(0, 2).join(', ')}] 전문성과 실무 실행력을 바탕으로, 본 프로젝트의 핵심 드라이버로 함께해 주시기를 정중히 제안드립니다.
• ${assignedRole.description}

■ 함께 협업할 가상 드림팀 구성원
${teammates || '- (추가 핵심 멤버 조율 중)'}

■ 정중한 티타임 제안 문안
"안녕하세요, ${targetPerson.name} 님. 평소 님의 뛰어난 전문성을 깊이 신뢰해 왔습니다.
이번에 저희가 새롭게 추진하는 '${projectName || template.title}' 프로젝트와 관련하여,
${targetPerson.name} 님의 고견을 여쭙고 가벼운 비즈니스 티타임으로 협업 가능성을 모색하고자 합니다.
편하신 일정에 짧은 티타임으로 찾아뵐 수 있을지요? 감사합니다."
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
}
