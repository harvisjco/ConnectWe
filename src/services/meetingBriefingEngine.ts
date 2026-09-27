import { Person } from '../types/network';
import { identifyTalentCluster, TalentClusterProfile } from './talentClusterEngine';
import { BusinessDeal, loadDealsFromStorage } from './dealPipelineService';

export interface MutualConnectionInsight {
  person: Person;
  context: string;
}

export interface IcebreakerTopic {
  category: '공시·기업행보' | '공통인맥·알럼나이' | '기술·도메인전략';
  headline: string;
  detail: string;
}

export interface MeetingBriefing {
  generatedAt: string;
  person: Person;
  cluster: TalentClusterProfile;
  dartSummary: {
    isFactVerified: boolean;
    corpName?: string;
    corpCode?: string;
    role?: string;
    registeredStatus?: string;
    term?: string;
  };
  mutualConnections: MutualConnectionInsight[];
  relatedDeals: BusinessDeal[];
  icebreakers: IcebreakerTopic[];
  etiquetteGuide: {
    preferredStyle: string;
    keyAdvice: string;
    avoidTopics: string;
  };
  onePageSummaryText: string;
}

/**
 * 인물의 과거 재직 기업 목록 추출 헬퍼
 */
export function getPastCompanies(person: Person): string[] {
  return (person.careers || [])
    .filter(c => !c.isCurrent && c.companyName)
    .map(c => c.companyName);
}

/**
 * 인물과 내 인맥 풀 간의 공통 알럼나이(이전 직장/학교/도메인) 1촌 인재 탐색
 */
export function findMutualConnections(target: Person, allPeople: Person[]): MutualConnectionInsight[] {
  const insights: MutualConnectionInsight[] = [];
  const targetPast = getPastCompanies(target);
  const targetCompanies = new Set<string>([
    target.currentCompany.toLowerCase(),
    ...targetPast.map(c => c.toLowerCase())
  ]);

  for (const other of allPeople) {
    if (other.id === target.id) continue;

    // 1. 동일 회사 현재 재직
    if (other.currentCompany.toLowerCase() === target.currentCompany.toLowerCase()) {
      insights.push({
        person: other,
        context: `${target.currentCompany} 현 동료 (${other.currentTitle})`
      });
      continue;
    }

    // 2. 알럼나이 (이전 직장 일치)
    const otherPast = getPastCompanies(other);
    const otherCompanies = [other.currentCompany, ...otherPast].map(c => c.toLowerCase());
    const matchedCompany = otherCompanies.find(c => targetCompanies.has(c));
    if (matchedCompany) {
      insights.push({
        person: other,
        context: `${matchedCompany.toUpperCase()} 알럼나이 인연`
      });
      continue;
    }

    // 3. 동일 전문 도메인
    if (target.primaryDomain && other.primaryDomain && target.primaryDomain === other.primaryDomain) {
      insights.push({
        person: other,
        context: `${target.primaryDomain} 도메인 동반자`
      });
    }
  }

  // 상위 3명만 추천
  return insights.slice(0, 3);
}

/**
 * 인물과 연관된 진행 중인 비즈니스 딜 탐색
 */
export function findRelatedDeals(target: Person, deals: BusinessDeal[]): BusinessDeal[] {
  return deals.filter(deal => {
    const isStakeholder = deal.stakeholders.some(s => s.personId === target.id || s.personName === target.name);
    const isTargetCompany = deal.targetCompany.toLowerCase().includes(target.currentCompany.toLowerCase()) ||
                            target.currentCompany.toLowerCase().includes(deal.targetCompany.toLowerCase());
    return isStakeholder || isTargetCompany;
  });
}

/**
 * 5대 인재 클러스터 및 팩트 기반 아이스브레이킹 화두 3선 도출
 */
export function generateIcebreakers(person: Person, cluster: TalentClusterProfile, mutualCount: number): IcebreakerTopic[] {
  const topics: IcebreakerTopic[] = [];

  // 화두 1: 최근 기업 행보 / 공시 팩트
  if (person.sourceType === 'DART_FACT' || person.dartInfo?.isPublicDirector) {
    topics.push({
      category: '공시·기업행보',
      headline: `${person.currentCompany}의 투명한 거버넌스 및 신사업 확장 행보`,
      detail: `전자공시(DART)로 검증된 ${person.currentCompany}의 안정적인 거버넌스와 최근 공시된 주주가치 제고 및 신성장 동력에 대해 경의를 표하며 대화를 열 수 있습니다.`
    });
  } else {
    topics.push({
      category: '공시·기업행보',
      headline: `${person.currentCompany}의 시장 개척과 빠른 스케일업 실행력`,
      detail: `최근 업계에서 주목받고 있는 ${person.currentCompany}의 민첩한 실행력과 ${person.name}님의 리더십에 깊은 인상을 받았음을 전합니다.`
    });
  }

  // 화두 2: 공통 인맥 / 알럼나이 맥락
  if (mutualCount > 0) {
    topics.push({
      category: '공통인맥·알럼나이',
      headline: `함께 알고 있는 업계 동료 및 알럼나이 네트워크 인연`,
      detail: `양사가 공유하고 있는 알럼나이 인연을 자연스럽게 언급하며 공통의 신뢰 접점을 통해 대화의 심리적 거리감을 좁힙니다.`
    });
  } else {
    topics.push({
      category: '공통인맥·알럼나이',
      headline: `${person.primaryDomain || '전문 산업'} 생태계의 건강한 협력 네트워크`,
      detail: `경쟁을 넘어 생태계 전체의 가치를 키워가는 동반자적 관점에서 공통의 인맥 생태계에 대한 생각을 나눕니다.`
    });
  }

  // 화두 3: 고유 강점(Superpower) 및 도메인 전문성
  const superpower = cluster.superpowers[0] || '탁월한 도메인 전문성';
  topics.push({
    category: '기술·도메인전략',
    headline: `${superpower}에 대한 통찰과 인사이트 청취`,
    detail: `${person.name}님께서 강점을 지니신 '${superpower}' 영역의 최근 시장 변화와 실무적 난제 해결 경험에 관해 조언을 구합니다.`
  });

  return topics;
}

/**
 * 클러스터별 미팅 에티켓 & 선호 대화 스타일 가이드
 */
export function getClusterEtiquetteGuide(cluster: TalentClusterProfile): {
  preferredStyle: string;
  keyAdvice: string;
  avoidTopics: string;
} {
  switch (cluster.id) {
    case 'LISTED_EXECUTIVE':
      return {
        preferredStyle: '공식 격식체, 명확한 아젠다 및 거버넌스 준수 중심',
        keyAdvice: '법적/제도적 신뢰성과 주주 가치, 장기적 파트너십의 안정성을 명확히 제시하십시오.',
        avoidTopics: '비공식적인 급박한 요구, 확인되지 않은 미공개 내부 정보 언급을 엄격히 배제하십시오.'
      };
    case 'VENTURE_LEADER':
      return {
        preferredStyle: '간결하고 명확한 핵심 전달, 빠른 의사결정과 액션 플랜 중심',
        keyAdvice: '복잡한 서론을 줄이고 양사가 즉시 낼 수 있는 3개월 내 가시적 성과를 제시하십시오.',
        avoidTopics: '지나치게 관료적인 절차나 지루한 서류 작업 중심의 대화를 지양하십시오.'
      };
    case 'TECH_FELLOW':
      return {
        preferredStyle: '기술적 사실과 아키텍처 깊이에 기반한 진정성 있는 학술/공학 대화',
        keyAdvice: '표면적인 마케팅 수사 대신 기술적 난제와 원천 데이터의 무결성에 대해 깊이 있게 논의하십시오.',
        avoidTopics: '과장된 기술 마케팅 용어나 비기술적인 단정적 영업 피칭을 피하십시오.'
      };
    case 'INVESTOR_PARTNER':
      return {
        preferredStyle: '거시적 시장 사이클, 단위 경제(Unit Economics), 밸류업 시너지 중심',
        keyAdvice: '비즈니스 모델의 확장성과 시장 규모(TAM), 명확한 리스크 관리 방안을 논리적으로 설명하십시오.',
        avoidTopics: '숫자적 근거가 부족한 막연한 낙관론이나 감정적 호소를 피하십시오.'
      };
    case 'CORE_SPECIALIST':
    default:
      return {
        preferredStyle: '따뜻한 경청, 현장 문제해결 경험에 대한 상호 존중과 격려',
        keyAdvice: '실무자가 겪은 구체적인 빌딩 경험과 고충에 깊이 공감하고 파트너십의 기여도를 존중하십시오.',
        avoidTopics: '일방적인 훈계나 지시적 어조, 실무 디테일을 경시하는 태도를 금지하십시오.'
      };
  }
}

/**
 * C-Level 미팅 10분 전 스마트 브리핑 생성 메인 함수
 */
export function generateMeetingBriefing(
  person: Person,
  allPeople: Person[] = [],
  deals?: BusinessDeal[]
): MeetingBriefing {
  const cluster = identifyTalentCluster(person);
  const activeDeals = deals || loadDealsFromStorage(allPeople);
  const mutualConnections = findMutualConnections(person, allPeople);
  const relatedDeals = findRelatedDeals(person, activeDeals);
  const icebreakers = generateIcebreakers(person, cluster, mutualConnections.length);
  const etiquetteGuide = getClusterEtiquetteGuide(cluster);

  const isDart = person.sourceType === 'DART_FACT' || !!person.dartInfo?.isPublicDirector;
  const dartSummary = {
    isFactVerified: isDart,
    corpName: person.dartInfo?.stockName || person.currentCompany,
    corpCode: person.dartInfo?.corpCode,
    role: person.dartInfo?.registeredRole || person.currentTitle,
    registeredStatus: isDart ? '금융감독원 DART 공시 실명 등기 확인' : '비상장/사외 전문 인재',
    term: person.dartInfo?.registeredTerm
  };

  const onePageSummaryText = `[C-Level 미팅 10분 전 스마트 브리핑]
■ 대상: ${person.currentCompany} ${person.name} ${person.currentTitle}
■ 인재 클러스터: ${cluster.label} (${cluster.superpowers.join(', ')})
■ 거버넌스/DART 팩트: ${dartSummary.registeredStatus}${dartSummary.corpName ? ` (${dartSummary.corpName})` : ''}
■ 1촌 공통 인맥: ${mutualConnections.length > 0 ? mutualConnections.map(m => `${m.person.name} (${m.context})`).join(', ') : '신규 개척 인연'}
■ 연관 파트너십 딜: ${relatedDeals.length > 0 ? relatedDeals.map(d => `${d.title} (${d.stage})`).join(', ') : '등록된 딜 없음'}
■ 추천 화두:
  1. ${icebreakers[0]?.headline}
  2. ${icebreakers[1]?.headline}
  3. ${icebreakers[2]?.headline}
■ 미팅 에티켓: ${etiquetteGuide.keyAdvice}`;

  return {
    generatedAt: new Date().toISOString(),
    person,
    cluster,
    dartSummary,
    mutualConnections,
    relatedDeals,
    icebreakers,
    etiquetteGuide,
    onePageSummaryText
  };
}
