import { Person } from '../types/network';

export type DealStage = 'PROSPECT' | 'WARM_CONTACT' | 'MEETING_HELD' | 'PROPOSAL' | 'NEGOTIATION' | 'WON';
export type KeymanRole = 'DECISION_MAKER' | 'CHAMPION' | 'INFLUENCER' | 'BLOCKER';

export interface DealStakeholder {
  personId: string;
  personName: string;
  company: string;
  title: string;
  role: KeymanRole;
  closeness: number;
  isDartExecutive: boolean;
  notes?: string;
}

export interface BusinessDeal {
  id: string;
  title: string;
  targetCompany: string;
  targetIndustry: string;
  dealSize?: string;
  stage: DealStage;
  expectedCloseDate: string; // YYYY-MM-DD
  stakeholders: DealStakeholder[];
  healthScore: number; // 0 ~ 100
  notes?: string;
}

const STORAGE_KEY = 'connectwe_business_deals';

/**
 * 딜 인맥 연결 건전도(Health Score) 계산 알고리즘
 * - 의사결정권자(Decision Maker) 확보 여부 (+40점)
 * - 내부 챔피언(Champion) 확보 여부 (+30점)
 * - 1~2촌 직통 인맥 여부 (+20점)
 * - DART 상장사 공시 임원 참여 (+10점)
 */
export function calculateDealHealthScore(stakeholders: DealStakeholder[]): number {
  if (stakeholders.length === 0) return 15;

  let score = 10;
  const hasDecisionMaker = stakeholders.some(s => s.role === 'DECISION_MAKER');
  const hasChampion = stakeholders.some(s => s.role === 'CHAMPION');
  const hasStrongCloseness = stakeholders.some(s => s.closeness <= 2);
  const hasDart = stakeholders.some(s => s.isDartExecutive);

  if (hasDecisionMaker) score += 40;
  if (hasChampion) score += 30;
  if (hasStrongCloseness) score += 15;
  if (hasDart) score += 10;

  return Math.min(100, Math.max(10, score));
}

/**
 * 데모 및 초기 경험을 위한 스마트 샘플 딜 생성
 */
export function generateMockDeals(people: Person[]): BusinessDeal[] {
  const kakaoPerson = people.find(p => p.currentCompany.includes('카카오') || p.currentCompany.includes('네이버')) || people[0];
  const samsungPerson = people.find(p => p.currentCompany.includes('삼성') || p.currentCompany.includes('SK')) || people[1] || people[0];
  const thirdPerson = people.find(p => p.id !== kakaoPerson?.id && p.id !== samsungPerson?.id) || people[2] || people[0];

  const deals: BusinessDeal[] = [];

  if (samsungPerson) {
    const stakeholders: DealStakeholder[] = [
      {
        personId: samsungPerson.id,
        personName: samsungPerson.name,
        company: samsungPerson.currentCompany,
        title: samsungPerson.currentTitle,
        role: 'DECISION_MAKER',
        closeness: samsungPerson.closeness,
        isDartExecutive: samsungPerson.sourceType === 'DART_FACT' || !!samsungPerson.dartInfo?.isPublicDirector,
        notes: '예산 승인권자 및 핵심 의사결정권자'
      }
    ];

    deals.push({
      id: 'deal-1',
      title: `[엔터프라이즈] ${samsungPerson.currentCompany} 차세대 AI 인프라 수주 계약`,
      targetCompany: samsungPerson.currentCompany,
      targetIndustry: 'IT / 반도체',
      dealSize: '35억원 (연간)',
      stage: 'PROPOSAL',
      expectedCloseDate: '2026-11-30',
      stakeholders,
      healthScore: calculateDealHealthScore(stakeholders),
      notes: '경쟁사 대비 기술 우위 확인 완료, 하반기 예산 배정 승인 대기'
    });
  }

  if (kakaoPerson && kakaoPerson.id !== samsungPerson?.id) {
    const stakeholders: DealStakeholder[] = [
      {
        personId: kakaoPerson.id,
        personName: kakaoPerson.name,
        company: kakaoPerson.currentCompany,
        title: kakaoPerson.currentTitle,
        role: 'CHAMPION',
        closeness: kakaoPerson.closeness,
        isDartExecutive: kakaoPerson.sourceType === 'DART_FACT' || !!kakaoPerson.dartInfo?.isPublicDirector,
        notes: '사내 사업부 스폰서 및 기술 검토 총괄'
      }
    ];

    deals.push({
      id: 'deal-2',
      title: `[전략 제휴] ${kakaoPerson.currentCompany} 거대언어모델(LLM) 공동 서비스 제휴`,
      targetCompany: kakaoPerson.currentCompany,
      targetIndustry: '빅테크 / 플랫폼',
      dealSize: '전략적 사업협력',
      stage: 'MEETING_HELD',
      expectedCloseDate: '2026-10-15',
      stakeholders,
      healthScore: calculateDealHealthScore(stakeholders),
      notes: '1차 실무 미팅 성공적 종료, 경영진 1-Page AI 브리핑 준비 중'
    });
  }

  if (thirdPerson && thirdPerson.id !== kakaoPerson?.id && thirdPerson.id !== samsungPerson?.id) {
    const stakeholders: DealStakeholder[] = [
      {
        personId: thirdPerson.id,
        personName: thirdPerson.name,
        company: thirdPerson.currentCompany,
        title: thirdPerson.currentTitle,
        role: 'INFLUENCER',
        closeness: thirdPerson.closeness,
        isDartExecutive: thirdPerson.sourceType === 'DART_FACT' || !!thirdPerson.dartInfo?.isPublicDirector,
        notes: '실무 추천 및 2촌 소개 연결자'
      }
    ];

    deals.push({
      id: 'deal-3',
      title: `[솔루션 공급] ${thirdPerson.currentCompany} 데이터 보안 볼트 구축 딜`,
      targetCompany: thirdPerson.currentCompany,
      targetIndustry: '금융 / 핀테크',
      dealSize: '8.5억원',
      stage: 'WARM_CONTACT',
      expectedCloseDate: '2026-12-20',
      stakeholders,
      healthScore: calculateDealHealthScore(stakeholders),
      notes: '사내 보안 가이드라인 충족 여부 초기 문의'
    });
  }

  return deals;
}

/**
 * 로컬 스토리지 로드 및 저장
 */
export function loadDealsFromStorage(people: Person[]): BusinessDeal[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const mocks = generateMockDeals(people);
      saveDealsToStorage(mocks);
      return mocks;
    }
    const parsed: BusinessDeal[] = JSON.parse(raw);
    return parsed;
  } catch (e) {
    console.error('Failed to load deals:', e);
    return generateMockDeals(people);
  }
}

export function saveDealsToStorage(deals: BusinessDeal[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deals));
  } catch (e) {
    console.error('Failed to save deals:', e);
  }
}
