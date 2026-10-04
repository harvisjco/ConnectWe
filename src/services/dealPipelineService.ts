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
  const getCompany = (p: Person) => p.currentCompany || p.company || '';
  const kakaoPerson = people.find(p => getCompany(p).includes('카카오') || getCompany(p).includes('네이버')) || people[0];
  const samsungPerson = people.find(p => getCompany(p).includes('삼성') || getCompany(p).includes('SK')) || people[1] || people[0];
  const thirdPerson = people.find(p => p.id !== kakaoPerson?.id && p.id !== samsungPerson?.id) || people[2] || people[0];

  const deals: BusinessDeal[] = [];

  if (samsungPerson) {
    const stakeholders: DealStakeholder[] = [
      {
        personId: samsungPerson.id,
        personName: samsungPerson.name,
        company: getCompany(samsungPerson),
        title: samsungPerson.currentTitle || samsungPerson.role || '',
        role: 'DECISION_MAKER',
        closeness: samsungPerson.closeness || 2,
        isDartExecutive: samsungPerson.sourceType === 'DART_FACT' || !!samsungPerson.dartInfo?.isPublicDirector,
        notes: '예산 승인권자 및 핵심 의사결정권자'
      }
    ];

    deals.push({
      id: 'deal-1',
      title: `[엔터프라이즈] ${getCompany(samsungPerson)} 차세대 AI 인프라 수주 계약`,
      targetCompany: getCompany(samsungPerson),
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
        company: getCompany(kakaoPerson),
        title: kakaoPerson.currentTitle || kakaoPerson.role || '',
        role: 'CHAMPION',
        closeness: kakaoPerson.closeness || 2,
        isDartExecutive: kakaoPerson.sourceType === 'DART_FACT' || !!kakaoPerson.dartInfo?.isPublicDirector,
        notes: '사내 사업부 스폰서 및 기술 검토 총괄'
      }
    ];

    deals.push({
      id: 'deal-2',
      title: `[전략 제휴] ${getCompany(kakaoPerson)} 거대언어모델(LLM) 공동 서비스 제휴`,
      targetCompany: getCompany(kakaoPerson),
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
        company: getCompany(thirdPerson),
        title: thirdPerson.currentTitle || thirdPerson.role || '',
        role: 'INFLUENCER',
        closeness: thirdPerson.closeness || 2,
        isDartExecutive: thirdPerson.sourceType === 'DART_FACT' || !!thirdPerson.dartInfo?.isPublicDirector,
        notes: '실무 추천 및 2촌 소개 연결자'
      }
    ];

    deals.push({
      id: 'deal-3',
      title: `[솔루션 공급] ${getCompany(thirdPerson)} 데이터 보안 볼트 구축 딜`,
      targetCompany: getCompany(thirdPerson),
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
export function loadDealsFromStorage(people: Person[] = []): BusinessDeal[] {
  try {
    if (typeof localStorage === 'undefined') {
      return generateMockDeals(people);
    }
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

export const loadBusinessDeals = loadDealsFromStorage;

export interface PipelineMetrics {
  totalDeals: number;
  activeDeals: number;
  wonDeals: number;
  totalPipelineVolume: number;
  formattedTotalVolume: string;
  weightedPipelineVolume: number;
  formattedWeightedVolume: string;
  avgHealthScore: number;
  keymanCoverage: number;
}

/**
 * 딜 금액 문자열에서 원 단위 숫자 추출 (예: "35억원" -> 3,500,000,000)
 */
export function parseDealAmount(dealSizeStr?: string): number {
  if (!dealSizeStr) return 0;
  const sanitized = dealSizeStr.replace(/,/g, '').trim();

  // 1. "X.X억원" 또는 "X억원"
  const ukMatch = sanitized.match(/([\d.]+)\s*억/);
  if (ukMatch) {
    const val = parseFloat(ukMatch[1]);
    if (!isNaN(val)) return Math.round(val * 100000000);
  }

  // 2. "X천만원" 또는 "X만원"
  const manMatch = sanitized.match(/([\d.]+)\s*만/);
  if (manMatch) {
    const val = parseFloat(manMatch[1]);
    if (!isNaN(val)) return Math.round(val * 10000);
  }

  // 3. 단순 숫자만 있을 때
  const numOnly = sanitized.match(/^[\d.]+/);
  if (numOnly) {
    const val = parseFloat(numOnly[0]);
    if (!isNaN(val) && val > 0) return val;
  }

  return 0;
}

/**
 * 원 단위 금액을 품격 있는 한국어 억/만원 단위로 변환
 */
export function formatAmountKorean(amount: number): string {
  if (!amount || amount <= 0) return '규모 협의 중';

  if (amount >= 100000000) {
    const uk = (amount / 100000000).toFixed(1).replace(/\.0$/, '');
    return `${uk}억원`;
  }
  if (amount >= 10000) {
    const man = Math.round(amount / 10000);
    return `${man.toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

/**
 * C-Level 경영진을 위한 파이프라인 정량 지표 집계
 */
export function calculatePipelineMetrics(deals: BusinessDeal[]): PipelineMetrics {
  if (!deals || deals.length === 0) {
    return {
      totalDeals: 0,
      activeDeals: 0,
      wonDeals: 0,
      totalPipelineVolume: 0,
      formattedTotalVolume: '0원',
      weightedPipelineVolume: 0,
      formattedWeightedVolume: '0원',
      avgHealthScore: 0,
      keymanCoverage: 0
    };
  }

  const totalDeals = deals.length;
  const wonDeals = deals.filter(d => d.stage === 'WON').length;
  const activeDeals = totalDeals - wonDeals;

  let totalPipelineVolume = 0;
  let weightedPipelineVolume = 0;
  let healthSum = 0;
  let dealsWithKeyman = 0;

  deals.forEach(deal => {
    const amount = parseDealAmount(deal.dealSize);
    totalPipelineVolume += amount;
    weightedPipelineVolume += amount * (deal.healthScore / 100);
    healthSum += deal.healthScore;

    const hasKeyman = deal.stakeholders.some(
      s => s.role === 'DECISION_MAKER' || s.role === 'CHAMPION'
    );
    if (hasKeyman) {
      dealsWithKeyman += 1;
    }
  });

  const avgHealthScore = Math.round(healthSum / totalDeals);
  const keymanCoverage = Math.round((dealsWithKeyman / totalDeals) * 100);

  return {
    totalDeals,
    activeDeals,
    wonDeals,
    totalPipelineVolume,
    formattedTotalVolume: formatAmountKorean(totalPipelineVolume),
    weightedPipelineVolume: Math.round(weightedPipelineVolume),
    formattedWeightedVolume: formatAmountKorean(Math.round(weightedPipelineVolume)),
    avgHealthScore,
    keymanCoverage
  };
}

