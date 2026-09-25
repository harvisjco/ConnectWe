import { Person } from '../types/network';

export type TalentClusterId = 
  | 'LISTED_EXECUTIVE' 
  | 'VENTURE_LEADER' 
  | 'TECH_FELLOW' 
  | 'INVESTOR_PARTNER' 
  | 'CORE_SPECIALIST';

export interface TalentClusterProfile {
  id: TalentClusterId;
  label: string;
  shortTag: string;
  badgeStyle: string;
  iconName: string;
  seniorityLevel: string;
  superpowers: string[];
  description: string;
}

/**
 * 인물의 공시, 기업 형태, 전문 분야, 직함을 바탕으로 
 * 5대 인재 클러스터 중 가장 돋보이는 고유 강점(Superpower Edge)을 도출합니다.
 */
export function identifyTalentCluster(person: Person): TalentClusterProfile {
  const isDart = person.sourceType === 'DART_FACT' || !!person.dartInfo?.isPublicDirector;
  const title = (person.currentTitle || '').toLowerCase();
  const company = (person.currentCompany || '').toLowerCase();
  const domain = (person.primaryDomain || '').toLowerCase();
  const skills = (person.skills || []).map(s => s.toLowerCase());

  // 1. 전략 투자 파트너 (VC, PE, CVC, 투자 심사역)
  if (
    domain.includes('vc') || domain.includes('투자') || domain.includes('m&a') ||
    company.includes('인베스트') || company.includes('투자') || company.includes('벤처스') || company.includes('파트너스') ||
    title.includes('심사역') || title.includes('파트너')
  ) {
    return {
      id: 'INVESTOR_PARTNER',
      label: '전략 투자 파트너',
      shortTag: 'INVESTOR',
      badgeStyle: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
      iconName: 'Briefcase',
      seniorityLevel: getSeniorityLevel(person),
      superpowers: ['자본 네트워크 레버리지', '산업 생태계 거시 통찰', '기업가치 스케일업 딜 구조화'],
      description: '거시적 시장 트렌드와 자본 생태계를 꿰뚫고 성장 전략 및 딜을 주도하는 금융·투자 전문가입니다.'
    };
  }

  // 2. 딥테크 펠로우 & 석학 (AI, 반도체, 연구원, 박사, 테크 리드)
  if (
    domain.includes('ai') || domain.includes('반도체') || domain.includes('llm') || domain.includes('딥테크') ||
    title.includes('연구원') || title.includes('박사') || title.includes('fellow') || title.includes('researcher') ||
    skills.some(s => s.includes('ai') || s.includes('deep learning') || s.includes('반도체') || s.includes('nlp'))
  ) {
    return {
      id: 'TECH_FELLOW',
      label: '딥테크 R&D 펠로우',
      shortTag: 'DEEPTECH',
      badgeStyle: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
      iconName: 'Cpu',
      seniorityLevel: getSeniorityLevel(person),
      superpowers: ['원천 기술 및 아키텍처 설계', 'R&D 특허 및 논문 역량', '글로벌 기술 프론티어 탐색'],
      description: '선도 기술 트렌드를 개척하며 복잡한 공학적 난제를 돌파하는 최고 수준의 기술 인재입니다.'
    };
  }

  // 3. 상장사 거버넌스 리더 (DART 실공시)
  if (isDart) {
    return {
      id: 'LISTED_EXECUTIVE',
      label: '상장사 거버넌스 리더',
      shortTag: 'DART FACT',
      badgeStyle: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
      iconName: 'Building2',
      seniorityLevel: getSeniorityLevel(person),
      superpowers: ['공적 책임 & 투명한 거버넌스', '대규모 조직 & 자본 운용력', '제도권 규제 및 시장 신뢰'],
      description: '금융감독원 전자공시(DART)로 검증된 대규모 조직 관리 및 공적 거버넌스를 이끄는 임원입니다.'
    };
  }

  // 4. 어자일 벤처 리더 (비상장 스타트업 / 유니콘 대표 및 임원)
  const isCLevel = title.includes('대표') || title.includes('ceo') || title.includes('cto') || title.includes('cfo') || title.includes('coo') || title.includes('cpo') || title.includes('이사') || title.includes('부사장') || title.includes('사장');
  if (isCLevel) {
    return {
      id: 'VENTURE_LEADER',
      label: '어자일 벤처 리더',
      shortTag: 'VENTURE',
      badgeStyle: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/15 dark:text-purple-300 dark:border-purple-500/30',
      iconName: 'Rocket',
      seniorityLevel: getSeniorityLevel(person),
      superpowers: ['풀스콥(Full-Scope) 종합 실행력', '젊고 역동적인 빠른 의사결정', '치열한 시장 개척 및 민첩성'],
      description: '기동성 있는 의사결정과 넓은 업무 스콥을 바탕으로 성장을 주도하는 역동적인 혁신 리더입니다.'
    };
  }

  // 5. 핵심 프로덕트 스페셜리스트 (기술, 제품, 사업 실무 핵심 전문가)
  return {
    id: 'CORE_SPECIALIST',
    label: '핵심 프로덕트 스페셜리스트',
    shortTag: 'SPECIALIST',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-500/15 dark:text-indigo-300 dark:border-indigo-500/30',
    iconName: 'Sparkles',
    seniorityLevel: getSeniorityLevel(person),
    superpowers: ['현장 실무 문제해결 속도', '최신 툴체인 & 실무 마스터리', '고밀도 프로덕트 빌딩 역량'],
    description: '탁월한 실무 전문성과 실행력으로 프로덕트의 성공을 직접 견인하는 핵심 실무 인재입니다.'
  };
}

/**
 * 나이를 단정적으로 넘겨짚지 않고, 품격 있는 전문 경력 단계(Seniority Level)를 산출합니다.
 */
export function getSeniorityLevel(person: Person): string {
  const title = (person.currentTitle || '').toLowerCase();
  
  if (title.includes('대표') || title.includes('ceo') || title.includes('부사장') || title.includes('사장') || title.includes('회장')) {
    return '이그제큐티브 레벨 (Executive 15년+)';
  }
  if (title.includes('이사') || title.includes('상무') || title.includes('전무') || title.includes('본부장') || title.includes('디렉터') || title.includes('director')) {
    return '시니어 디렉터 (12년+)';
  }
  if (title.includes('팀장') || title.includes('수석') || title.includes('lead') || title.includes('리드') || title.includes('부장')) {
    return '전문 리드급 (8~12년차)';
  }
  if (title.includes('책임') || title.includes('과장') || title.includes('차장') || title.includes('senior')) {
    return '미드 시니어 (5~8년차)';
  }
  return '프론티어 스페셜리스트';
}
