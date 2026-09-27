import { Person } from '../types/network';
import { identifyTalentCluster } from './talentClusterEngine';

export type SynergyType = 
  | 'INVESTOR_FOUNDER' 
  | 'TECH_BUSINESS' 
  | 'EXECUTIVE_FELLOW' 
  | 'ALUMNI_COLLAB' 
  | 'GENERAL_SYNERGY';

export interface SynergyPair {
  id: string;
  personA: Person;
  personB: Person;
  synergyType: SynergyType;
  synergyTitle: string;
  synergyReason: string;
  matchScore: number;
}

export type DoubleOptInTone = 'formal' | 'warm' | 'executive';

export interface DoubleOptInDrafts {
  step1AskPersonA: string;
  step2AskPersonB: string;
  step3DirectThreeWayIntro: string;
}

/**
 * 인맥 풀 내에서 서로 만나면 폭발적인 비즈니스 시너지가 날 두 사람(Person A ↔ Person B)을 지능형으로 매칭
 */
export function findSynergyPairs(people: Person[]): SynergyPair[] {
  const pairs: SynergyPair[] = [];
  const n = people.length;
  if (n < 2) return [];

  // 각 인물의 클러스터 사전 계산
  const clusterMap = new Map<string, ReturnType<typeof identifyTalentCluster>>();
  people.forEach(p => clusterMap.set(p.id, identifyTalentCluster(p)));

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const pA = people[i];
      const pB = people[j];

      // 동일 인물이거나 둘 다 모르는 사람이면 제외
      if (pA.id === pB.id) continue;
      // 이미 같은 회사에 근무 중이면 외부 소개 대상에서 제외
      if (pA.currentCompany === pB.currentCompany) continue;

      const clusterA = clusterMap.get(pA.id);
      const clusterB = clusterMap.get(pB.id);
      if (!clusterA || !clusterB) continue;

      let score = 50;
      let synergyType: SynergyType = 'GENERAL_SYNERGY';
      let synergyTitle = '상호 비즈니스 협력 시너지';
      let synergyReason = '각자의 도메인 전문성과 네트워크를 결합하여 새로운 협업 기회를 모색할 수 있습니다.';

      const titleA = (pA.currentTitle || '').toLowerCase();
      const titleB = (pB.currentTitle || '').toLowerCase();
      const isFounderA = titleA.includes('대표') || titleA.includes('ceo') || titleA.includes('founder') || clusterA.id === 'VENTURE_LEADER';
      const isFounderB = titleB.includes('대표') || titleB.includes('ceo') || titleB.includes('founder') || clusterB.id === 'VENTURE_LEADER';
      const isInvestorA = clusterA.id === 'INVESTOR_PARTNER';
      const isInvestorB = clusterB.id === 'INVESTOR_PARTNER';

      // 패턴 1: 벤처/스타트업 창업가 ↔ 투자사 파트너 (가장 강력한 시너지)
      if ((isFounderA && isInvestorB) || (isInvestorA && isFounderB)) {
        score += 45;
        synergyType = 'INVESTOR_FOUNDER';
        synergyTitle = '스타트업 스케일업 & 벤처투자 시너지';
        synergyReason = '혁신 벤처의 성장 모멘텀과 전문 VC 파트너의 투자·전략 네트워크가 직접적으로 맞닿아 있습니다.';
      }
      // 패턴 2: 딥테크/AI 펠로우 ↔ 투자사 파트너 (딥테크 기술 실사 & 펀딩)
      else if (
        (clusterA.id === 'TECH_FELLOW' && isInvestorB) ||
        (isInvestorA && clusterB.id === 'TECH_FELLOW')
      ) {
        score += 40;
        synergyType = 'INVESTOR_FOUNDER';
        synergyTitle = '딥테크 첨단기술 & 벤처투자 시너지';
        synergyReason = '딥테크 리더의 원천 기술력과 전문 투자사의 스케일업 자본이 결합하여 큰 가치를 창출합니다.';
      }
      // 패턴 3: 딥테크/AI 펠로우 ↔ 상장사/대기업 C-Level (기술 혁신 도입)
      else if (
        (clusterA.id === 'TECH_FELLOW' && clusterB.id === 'LISTED_EXECUTIVE') ||
        (clusterA.id === 'LISTED_EXECUTIVE' && clusterB.id === 'TECH_FELLOW')
      ) {
        score += 40;
        synergyType = 'EXECUTIVE_FELLOW';
        synergyTitle = '엔터프라이즈 AI 혁신 & 딥테크 기술 도입';
        synergyReason = '대기업의 신성장 동력 모색과 딥테크 리더의 첨단 아키텍처 역량이 큰 가치를 창출할 수 있습니다.';
      }
      // 패턴 4: 딥테크/AI 펠로우 ↔ 벤처 리더 (기술과 사업의 결합)
      else if (
        (clusterA.id === 'TECH_FELLOW' && isFounderB) ||
        (isFounderA && clusterB.id === 'TECH_FELLOW')
      ) {
        score += 35;
        synergyType = 'TECH_BUSINESS';
        synergyTitle = '첨단 프로덕트 기술 고도화 & 사업 확장';
        synergyReason = '기술 펠로우의 깊이 있는 엔지니어링 역량과 창업가의 빠른 실행력이 제품 경쟁력을 견인합니다.';
      }
      // 패턴 5: 상장사 C-Level ↔ 벤처 리더 (오픈 이노베이션 & 전략 제휴)
      else if (
        (clusterA.id === 'LISTED_EXECUTIVE' && isFounderB) ||
        (isFounderA && clusterB.id === 'LISTED_EXECUTIVE')
      ) {
        score += 35;
        synergyType = 'GENERAL_SYNERGY';
        synergyTitle = '대기업-스타트업 오픈 이노베이션 & 전략 제휴';
        synergyReason = '대기업의 시장 지배력과 스타트업의 기동력 있는 혁신이 융합되는 전략 파트너십입니다.';
      }
      // 패턴 4: 동문/동일 출신 알럼나이 겹침 검사
      const schoolSetA = new Set(pA.academics.map(a => a.schoolName));
      const hasSharedSchool = pB.academics.some(b => schoolSetA.has(b.schoolName));
      if (hasSharedSchool) {
        score += 25;
        if (synergyType === 'GENERAL_SYNERGY') {
          synergyType = 'ALUMNI_COLLAB';
          synergyTitle = '동문 네트워크 기반 신뢰 협업';
          synergyReason = '공통의 동문 인연을 바탕으로 초기 라포 형성이 매우 빠르며 신뢰도가 높습니다.';
        }
      }

      // 두 사람 모두 핵심 1촌인 경우 가산
      if (pA.closeness === 2 && pB.closeness === 2) score += 10;

      if (score >= 70) {
        pairs.push({
          id: `synergy-${pA.id}-${pB.id}`,
          personA: pA,
          personB: pB,
          synergyType,
          synergyTitle,
          synergyReason,
          matchScore: Math.min(99, score)
        });
      }
    }
  }

  // 매칭 스코어 내림차순 정렬 후 상위 10개 반환
  return pairs.sort((a, b) => b.matchScore - a.matchScore).slice(0, 10);
}

/**
 * 글로벌 비즈니스 표준 Double Opt-in 3단계 서신 자동 생성
 * - Step 1: Person A 대상 사전 의사 타진 (Soft Double Opt-in)
 * - Step 2: Person B 대상 사전 의사 타진
 * - Step 3: 양측 동의 후 3자 다이렉트 연결 서신
 */
export function generateDoubleOptInDrafts(
  connectorName: string = '홍길동',
  personA: Person,
  personB: Person,
  purpose: string = '비즈니스 시너지 탐색 및 친교 티타임',
  tone: DoubleOptInTone = 'formal'
): DoubleOptInDrafts {
  const roleA = `${personA.currentCompany} ${personA.name} ${personA.currentTitle}`;
  const roleB = `${personB.currentCompany} ${personB.name} ${personB.currentTitle}`;

  if (tone === 'formal') {
    return {
      step1AskPersonA: `${personA.name} ${personA.currentTitle}님, 평안하신지요? ${connectorName}입니다.

다름이 아니오라, 최근 ${personB.currentCompany}에서 [${personB.currentTitle}]로 활약 중이신 ${personB.name}님과 대화를 나누던 중, ${personA.name}님께서 현재 이끄시는 프로젝트와 상호 좋은 시너지가 날 수 있겠다는 생각이 들었습니다.

${personB.name}님은 해당 분야에서 매우 깊은 전문성과 훌륭한 인품을 갖추신 분입니다. 실례가 되지 않는다면, ${personA.name}님께 ${personB.name}님을 정중히 소개해 드려도 괜찮을지 사전 의사를 여쭙고자 합니다.

바쁘실 텐데 편하신 시간에 의견 회신 주시면 감사하겠습니다.`,

      step2AskPersonB: `${personB.name} ${personB.currentTitle}님, 안녕하십니까. ${connectorName}입니다.

최근 ${personB.name}님께서 추진 중이신 역동적인 사업 행보를 접하며, 평소 제가 깊이 신뢰하는 ${roleA}님과의 교류가 큰 시너지가 되실 것 같아 연락드리게 되었습니다.

${personA.name}님은 현재 업계에서 탁월한 리더십과 혁신을 이끌고 계신 분으로, ${purpose} 건과 관련하여 서로 뜻깊은 통찰을 나누실 수 있을 것으로 기대됩니다.

혹시 ${personA.name}님과의 편안한 티타임 자리를 마련해 드려도 괜찮으실지요? 편하게 회신 주시면 감사히 조율하겠습니다.`,

      step3DirectThreeWayIntro: `${personA.name} ${personA.currentTitle}님, ${personB.name} ${personB.currentTitle}님, 안녕하십니까. 두 분의 소중한 인연을 잇게 된 ${connectorName}입니다.

두 분 모두 반갑게 화답해 주셔서, 이렇게 정식으로 세 분의 대화방(또는 이메일)을 통해 인사를 올립니다.

- ${personA.name}님: ${roleA}님으로, 뛰어난 비즈니스 통찰과 실행력을 바탕으로 조직을 이끌고 계십니다.
- ${personB.name}님: ${roleB}님으로, 도메인 최고 수준의 전문성과 신뢰 네트워크를 겸비하고 계십니다.

이번 연결을 통해 [${purpose}]와 관련하여 두 분 사이에 의미 있는 시너지가 활짝 피어나기를 진심으로 응원합니다.

이제 두 분께서 편안한 일정으로 따뜻한 티타임 일정을 조율하실 수 있도록 바통을 넘겨드립니다. 멋진 대화 나누시길 바랍니다!`
    };
  }

  if (tone === 'warm') {
    return {
      step1AskPersonA: `${personA.name}님! 잘 지내시죠? ${connectorName}입니다 :)

다름이 아니라 ${personB.currentCompany}의 ${personB.name} ${personB.currentTitle}님과 이야기하다가 문득 ${personA.name}님 생각이 났습니다. 두 분이 만나시면 나눌 이야기도 많고 서로 큰 도움이 되실 것 같더라고요!

혹시 괜찮으시다면 ${personB.name}님께 ${personA.name}님을 소개해 드려도 될까요? 편하게 말씀해 주세요!`,

      step2AskPersonB: `${personB.name}님, 오랜만에 인사드립니다! ${connectorName}입니다.

최근 소식 반갑게 접하고 있습니다. 다름이 아니라 ${roleA}님과 ${personB.name}님의 전문성이 멋지게 맞닿아 있어, 두 분을 가볍게 차 한 잔 나누실 수 있게 이어드리고 싶은 마음이 들었습니다.

${personA.name}님께 먼저 여쭈어보았고 매우 긍정적이신데, ${personB.name}님도 소개받아 보시겠어요? 부담 갖지 마시고 편하게 답장 주세요!`,

      step3DirectThreeWayIntro: `${personA.name}님, ${personB.name}님! 안녕하세요, ${connectorName}입니다.

두 분 모두 흔쾌히 수락해 주셔서 이렇게 함께 인사 나눌 수 있는 자리를 마련했습니다!

- ${personA.name}님: ${roleA}
- ${personB.name}님: ${roleB}

두 분 모두 제가 정말 아끼고 신뢰하는 멋진 리더이십니다. [${purpose}]와 관련해서 캐주얼하게 커피 한 잔 나누시며 좋은 인연 만들어가시길 기대합니다. 이후 일정 조율 편하게 나눠주세요!`
    };
  }

  // executive tone
  return {
    step1AskPersonA: `${personA.name} 대표/임원님, 노고가 많으십니다. ${connectorName}입니다.

현재 귀사에서 집중하고 계신 전략적 어젠다와 관련하여, ${roleB}님과의 전략적 얼라이언스 혹은 티타임이 실질적인 레버리지가 될 수 있을 것으로 판단하여 사전 연락을 드립니다.

동의하신다면 양측의 일정과 안건을 정리하여 정중히 3자 인트로 자리를 주선하고자 합니다. 검토 후 편히 말씀 주십시오.`,

    step2AskPersonB: `${personB.name} 대표/임원님께, 안녕하십니까. ${connectorName}입니다.

귀사의 최근 확장 전략에 발맞추어, ${roleA}님과의 상호 성장 파트너십을 타진해 보실 것을 제안드립니다.

해당 임원진과의 15~20분 내외 간담회를 주선해 드려도 좋을지 여쭙고자 합니다. 편하신 방향으로 회신 부탁드립니다.`,

    step3DirectThreeWayIntro: `${personA.name} 임원님, ${personB.name} 임원님께, ${connectorName}입니다.

양사의 신뢰와 전략적 가치 창출을 위해 두 분의 공식적인 연결 창구를 개설합니다.

- ${roleA}
- ${roleB}

본 연결을 기점으로 두 분께서 [${purpose}]에 대한 전략적 논의를 생산적으로 이어가실 수 있기를 기대합니다. 이후 세부 의전 및 일정 조율은 두 분 비서실 또는 직접 편히 진행해 주시면 감사하겠습니다.`
  };
}
