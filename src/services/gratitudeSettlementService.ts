import { Person } from '../types/network';
import { BusinessDeal } from './dealPipelineService';

export type GratitudeRewardType = 'TEA' | 'DINING' | 'GIFT' | 'REWARD';
export type SettlementStatus = 'PLANNED' | 'SENT' | 'COMPLETED';

export interface GratitudeRewardPreset {
  type: GratitudeRewardType;
  label: string;
  emoji: string;
  defaultValue: string;
  description: string;
}

export const GRATITUDE_REWARD_PRESETS: Record<GratitudeRewardType, GratitudeRewardPreset> = {
  TEA: {
    type: 'TEA',
    label: '따뜻한 감사 티타임',
    emoji: '☕',
    defaultValue: '프리미엄 라운지 티타임',
    description: '성사된 프로젝트의 소회를 나누고 다음 협업을 논의하는 정중한 티타임 초대'
  },
  DINING: {
    type: 'DINING',
    label: '감사 오마카세 / 호텔 다이닝',
    emoji: '🍷',
    defaultValue: '호텔 프리미엄 다이닝 2인 초대권',
    description: '결정적 가교 역할을 해준 핵심 인연을 위한 격조 높은 만찬 감사'
  },
  GIFT: {
    type: 'GIFT',
    label: '정성 담은 프리미엄 기프트',
    emoji: '🎁',
    defaultValue: '명품 한우/와인 셀렉션',
    description: '일정상 직접 뵙기 어려운 경우 정성을 담아 자택이나 사무실로 보내는 품격 선물'
  },
  REWARD: {
    type: 'REWARD',
    label: '프로젝트 파트너십 성공 리워드',
    emoji: '🤝',
    defaultValue: '딜 규모 기반 감사 자문료/리워드',
    description: '비즈니스 파트너십 규약에 따른 공식적인 추천 감사 리워드 집행'
  }
};

export interface GratitudeSettlement {
  id: string;
  dealId: string;
  dealTitle: string;
  dealSize?: string;
  referrerPersonId: string;
  referrerName: string;
  referrerCompany: string;
  referrerTitle: string;
  rewardType: GratitudeRewardType;
  rewardValue: string;
  status: SettlementStatus;
  plannedDate: string; // YYYY-MM-DD
  completedDate?: string;
  thankYouLetter: string;
  notes?: string;
  createdAt: string;
}

const STORAGE_KEY = 'connectwe_gratitude_settlements';

let memorySettlements: GratitudeSettlement[] = [];

/**
 * 로컬스토리지에서 감사 정산 내역 로드
 */
export function loadSettlementsFromStorage(): GratitudeSettlement[] {
  try {
    if (typeof localStorage === 'undefined') return memorySettlements;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load gratitude settlements:', err);
    return [];
  }
}

/**
 * 로컬스토리지에 감사 정산 내역 저장
 */
export function saveSettlementsToStorage(settlements: GratitudeSettlement[]): void {
  try {
    if (typeof localStorage === 'undefined') {
      memorySettlements = settlements;
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settlements));
  } catch (err) {
    console.error('Failed to save gratitude settlements:', err);
  }
}

/**
 * 딜과 인맥 주소록 간 지능형 원터치 교차 매칭
 * - 대상 기업의 전/현직자, 해당 산업군 1~2촌 인맥 중 추천인 후보 추출
 */
export function matchPotentialReferrers(deal: BusinessDeal, people: Person[]): Person[] {
  const targetCompany = (deal.targetCompany || '').toLowerCase().trim();
  const targetIndustry = (deal.targetIndustry || '').toLowerCase().trim();

  return people
    .filter(p => p.closeness > 1) // 본인 제외
    .filter(p => {
      // 1. 해당 딜 대상 기업에 재직 중이거나 이전 경력이 있는 인맥
      const worksAtTarget = p.currentCompany.toLowerCase().includes(targetCompany);
      const workedAtTarget = (p.careers || []).some(c => c.companyName.toLowerCase().includes(targetCompany));
      
      // 2. 해당 산업군과 동일하거나 1~2촌 핵심 인맥
      const domainMatches = targetIndustry && p.primaryDomain.toLowerCase().includes(targetIndustry);
      const isCoreCloseness = p.closeness <= 2;

      return worksAtTarget || workedAtTarget || (domainMatches && isCoreCloseness);
    })
    .slice(0, 10);
}

/**
 * 격조 높은 C-Level 비즈니스 감사 서신 템플릿 생성기
 */
export function generateThankYouLetter(params: {
  referrerName: string;
  referrerCompany: string;
  dealTitle: string;
  rewardType: GratitudeRewardType;
  rewardValue: string;
  myTitle?: string;
}): string {
  const { referrerName, referrerCompany, dealTitle, rewardType, rewardValue } = params;

  let rewardParagraph = '';
  switch (rewardType) {
    case 'TEA':
      rewardParagraph = `귀한 시간 내어주신 은혜에 보답하고자, 편하신 일정에 따뜻한 차 한 잔 모시며 그간의 진행 경과와 감사의 말씀을 직접 올리고 싶습니다. (${rewardValue})`;
      break;
    case 'DINING':
      rewardParagraph = `소중한 연결이 없었다면 결코 성사되지 못했을 뜻깊은 결실입니다. 조촐하지만 감사의 마음을 담아 정중한 만찬 자리를 마련하고자 하오니 부디 편안한 일정으로 함께해 주시기를 청합니다. (${rewardValue})`;
      break;
    case 'GIFT':
      rewardParagraph = `멀리서나마 깊은 감사의 뜻을 전하고자 작은 정성의 선물을 준비하여 보내드립니다. 모쪼록 기쁜 마음으로 받아주시면 감사하겠습니다. (${rewardValue})`;
      break;
    case 'REWARD':
      rewardParagraph = `프로젝트 파트너십 규약 및 추천 감사 원칙에 따라 약정된 성공 감사 리워드 정산 절차를 기쁜 마음으로 안내해 드립니다. 세부 송금 및 세무 처리는 별도로 정중히 연락드리겠습니다. (${rewardValue})`;
      break;
  }

  return `[비즈니스 파트너십 감사 서신]

${referrerCompany} ${referrerName} 리더님께,

평안하신지요. 항상 변함없는 신뢰와 지혜로 이끌어 주심에 깊이 감사드립니다.

지난번 대표님께서 소중히 연결해 주신 고견과 가교 덕분에, 당사에서 심혈을 기울여 추진하던 [${dealTitle}] 건이 마침내 성공적으로 성사되었습니다.

${rewardParagraph}

앞으로도 대표님의 든든한 사업적 우군이자 상호 성장의 파트너로서 최선을 다해 함께할 것을 약속드립니다. 늘 건승과 평안이 함께하시기를 진심으로 기원합니다.

감사합니다.

ConnectWe 파트너스 배상`;
}

/**
 * 데모 및 초기 경험을 위한 샘플 정산 데이터 생성
 */
export function generateMockSettlements(people: Person[], deals: BusinessDeal[]): GratitudeSettlement[] {
  const wonDeal = deals.find(d => d.stage === 'WON' || d.stage === 'PROPOSAL') || deals[0];
  const referrer = people.find(p => p.closeness === 2) || people[1] || people[0];

  if (!wonDeal || !referrer) return [];

  return [
    {
      id: 'settlement-1',
      dealId: wonDeal.id,
      dealTitle: wonDeal.title,
      dealSize: wonDeal.dealSize || '35억원',
      referrerPersonId: referrer.id,
      referrerName: referrer.name,
      referrerCompany: referrer.currentCompany,
      referrerTitle: referrer.currentTitle,
      rewardType: 'DINING',
      rewardValue: '포시즌스 호텔 만찬 2인 초대권',
      status: 'SENT',
      plannedDate: '2026-09-28',
      completedDate: '2026-09-27',
      thankYouLetter: generateThankYouLetter({
        referrerName: referrer.name,
        referrerCompany: referrer.currentCompany,
        dealTitle: wonDeal.title,
        rewardType: 'DINING',
        rewardValue: '포시즌스 호텔 만찬 2인 초대권'
      }),
      notes: '핵심 임원 연결 가교에 대한 정중한 감사 만찬 진행 예정',
      createdAt: new Date().toISOString()
    }
  ];
}
