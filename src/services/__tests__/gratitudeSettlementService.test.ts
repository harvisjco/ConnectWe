import { describe, it, expect, beforeEach } from 'vitest';
import { 
  matchPotentialReferrers, 
  generateThankYouLetter, 
  loadSettlementsFromStorage, 
  saveSettlementsToStorage,
  GratitudeSettlement
} from '../gratitudeSettlementService';
import { BusinessDeal } from '../dealPipelineService';
import { Person } from '../../types/network';

describe('gratitudeSettlementService - 딜 추천 감사 리워드 및 답례 정산 검증', () => {
  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }
  });

  const samplePeople: Person[] = [
    {
      id: 'p-1',
      name: '김추천',
      currentCompany: '카카오엔터프라이즈',
      currentTitle: '부사장',
      currentDepartment: '전략사업',
      mobile: '010-1111-2222',
      email: 'rec@kakao.com',
      sourceType: 'DART_FACT',
      closeness: 2,
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: '인공지능 SaaS',
      skills: ['AI'],
      academics: [],
      careers: [{ id: 'c1', companyName: '삼성전자', title: '연구원', startYear: 2015, isCurrent: false, source: 'SOURCE_DATA' }],
      connectionChannel: 'dart',
      isStale: false
    },
    {
      id: 'p-2',
      name: '박타사',
      currentCompany: '현대자동차',
      currentTitle: '팀장',
      currentDepartment: 'R&D',
      mobile: '010-2222-3333',
      email: 'park@hyundai.com',
      sourceType: 'SOURCE_DATA',
      closeness: 4, // 4촌 잠재 인맥
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: '모빌리티',
      skills: ['자율주행'],
      academics: [],
      careers: [],
      connectionChannel: 'manual',
      isStale: false
    }
  ];

  const sampleDeal: BusinessDeal = {
    id: 'deal-kakao-ai',
    title: '[수주] 카카오엔터프라이즈 사내 LLM 인프라 계약',
    targetCompany: '카카오엔터프라이즈',
    targetIndustry: '인공지능 SaaS',
    dealSize: '20억원',
    stage: 'WON',
    expectedCloseDate: '2026-10-31',
    stakeholders: [],
    healthScore: 85
  };

  describe('matchPotentialReferrers', () => {
    it('딜 대상 기업(카카오엔터프라이즈)에 근무 중인 2촌 핵심 인맥을 추천인 후보로 정확히 매칭해야 한다', () => {
      const matched = matchPotentialReferrers(sampleDeal, samplePeople);
      expect(matched).toHaveLength(1);
      expect(matched[0].name).toBe('김추천');
    });
  });

  describe('generateThankYouLetter', () => {
    it('C-Level 비즈니스 에티켓에 부합하는 품격 있는 감사 서신을 생성해야 한다', () => {
      const letter = generateThankYouLetter({
        referrerName: '김추천',
        referrerCompany: '카카오엔터프라이즈',
        dealTitle: sampleDeal.title,
        rewardType: 'DINING',
        rewardValue: '신라호텔 콘티넨탈 2인 만찬'
      });

      expect(letter).toContain('김추천 리더님께');
      expect(letter).toContain(sampleDeal.title);
      expect(letter).toContain('신라호텔 콘티넨탈 2인 만찬');
      expect(letter).toContain('감사합니다.');
    });
  });

  describe('Storage persistence', () => {
    it('감사 정산 내역이 로컬스토리지에 안전하게 저장되고 로드되어야 한다', () => {
      const settlements: GratitudeSettlement[] = [
        {
          id: 'set-1',
          dealId: sampleDeal.id,
          dealTitle: sampleDeal.title,
          dealSize: '20억원',
          referrerPersonId: 'p-1',
          referrerName: '김추천',
          referrerCompany: '카카오엔터프라이즈',
          referrerTitle: '부사장',
          rewardType: 'DINING',
          rewardValue: '신라호텔 2인 만찬',
          status: 'PLANNED',
          plannedDate: '2026-10-05',
          thankYouLetter: '감사합니다.',
          createdAt: new Date().toISOString()
        }
      ];

      saveSettlementsToStorage(settlements);
      const loaded = loadSettlementsFromStorage();
      expect(loaded).toHaveLength(1);
      expect(loaded[0].referrerName).toBe('김추천');
      expect(loaded[0].rewardType).toBe('DINING');
    });
  });
});
