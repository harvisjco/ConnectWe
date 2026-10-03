import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  simulateGovernanceImpact, 
  loadGovernanceSimulations, 
  saveGovernanceSimulation,
  GovernanceSimulationEvent
} from '../dartGovernanceService';
import { Person } from '../../types/network';

describe('dartGovernanceService - simulateGovernanceImpact & Simulations', () => {
  class MockStorage {
    private store: Record<string, string> = {};
    getItem(key: string): string | null {
      return this.store[key] ?? null;
    }
    setItem(key: string, value: string): void {
      this.store[key] = String(value);
    }
    removeItem(key: string): void {
      delete this.store[key];
    }
    clear(): void {
      this.store = {};
    }
  }

  beforeEach(() => {
    vi.stubGlobal('localStorage', new MockStorage());
  });

  const mockPerson: Person = {
    id: 'p_corp1',
    name: '김경영',
    currentCompany: '현대자동차',
    currentDepartment: '기획조정실',
    currentTitle: '부사장',
    mobile: '010-9999-8888',
    email: 'kim@hyundai.com',
    primaryDomain: '경영/전략',
    estimatedAgeGroup: '50s_plus',
    isAgeEstimated: false,
    connectionChannel: 'business_card',
    sourceType: 'DART_FACT',
    closeness: 1,
    isStale: false,
    skills: [],
    careers: [],
    academics: [],
    dartInfo: {
      corpCode: '00164779',
      stockCode: '005380',
      stockName: '현대자동차',
      registeredRole: '사내이사 / 부사장',
      isPublicDirector: true,
      verifiedAt: '2026-03-15'
    }
  };

  const mockDeals = [
    {
      id: 'deal-hyundai-1',
      title: '현대자동차 차세대 SDV 소프트웨어 플랫폼 수주 계약',
      targetCompany: '현대자동차',
      targetIndustry: '모빌리티 / 전장',
      dealSize: '50억원',
      stage: 'PROPOSAL',
      expectedCloseDate: '2026-11-30',
      stakeholders: [
        {
          personId: 'p_corp1',
          personName: '김경영',
          company: '현대자동차',
          title: '부사장',
          role: 'DECISION_MAKER',
          closeness: 1,
          isDartExecutive: true
        }
      ],
      healthScore: 70
    },
    {
      id: 'deal-other-2',
      title: '타사 솔루션 공급 계약',
      targetCompany: '네이버',
      targetIndustry: 'IT',
      dealSize: '5억원',
      stage: 'WARM_CONTACT',
      expectedCloseDate: '2026-12-15',
      stakeholders: [],
      healthScore: 30
    }
  ];

  it('대표이사/임원 선임(APPOINTMENT) 공시 시뮬레이션 시 매핑된 딜의 건전도가 15점 부스트되어야 한다', () => {
    const event: GovernanceSimulationEvent = {
      id: 'sim-event-1',
      personId: 'p_corp1',
      personName: '김경영',
      company: '현대자동차',
      eventType: 'APPOINTMENT',
      announcedDate: '2026-10-04',
      headline: '현대자동차 대표이사(사내이사) 선임 가결',
      detail: '이사회 및 주총 결의를 통해 총괄 대표이사로 신규 선임되었습니다.',
      isBoardAppointment: true
    };

    const impact = simulateGovernanceImpact(event, [mockPerson], mockDeals);

    expect(impact.affectedDeals.length).toBe(1);
    expect(impact.affectedDeals[0].dealId).toBe('deal-hyundai-1');
    expect(impact.affectedDeals[0].previousHealth).toBe(70);
    expect(impact.affectedDeals[0].newHealth).toBe(85); // 70 + 15 = 85
    expect(impact.affectedDeals[0].healthDelta).toBe(15);
    expect(impact.actionableRecommendation).toContain('대표이사/임원 선임 공시는 최고의 소통 모멘텀입니다');
  });

  it('보통주 장내매수(SHARE_ACQUISITION) 공시 시뮬레이션 시 건전도가 10점 부스트되어야 한다', () => {
    const event: GovernanceSimulationEvent = {
      id: 'sim-event-2',
      personId: 'p_corp1',
      personName: '김경영',
      company: '현대자동차',
      eventType: 'SHARE_ACQUISITION',
      announcedDate: '2026-10-05',
      headline: '현대자동차 보통주 5,000주 장내매수 책임경영 공시',
      detail: '임원 특정증권등 소유상황보고서 제출 및 지분 추가 취득'
    };

    const impact = simulateGovernanceImpact(event, [mockPerson], mockDeals);

    expect(impact.affectedDeals[0].healthDelta).toBe(10);
    expect(impact.affectedDeals[0].newHealth).toBe(80);
    expect(impact.actionableRecommendation).toContain('책임경영 지분 확대는 사업 확장의 강력한 신호입니다');
  });

  it('시뮬레이션 이력이 정상 보관 및 로드되어야 한다', () => {
    const event: GovernanceSimulationEvent = {
      id: 'sim-storage-test',
      personId: 'p_corp1',
      personName: '김경영',
      company: '현대자동차',
      eventType: 'CONCURRENT_OFFICE',
      announcedDate: '2026-10-06',
      headline: '계열사 기타비상무이사 겸직',
      detail: '모빌리티 혁신 전략 가속'
    };

    saveGovernanceSimulation(event);
    const loaded = loadGovernanceSimulations();
    expect(loaded.some(e => e.id === 'sim-storage-test')).toBe(true);
  });
});
