import { describe, it, expect } from 'vitest';
import { Person } from '../../types/network';
import { 
  findSynergyPairs, 
  generateDoubleOptInDrafts 
} from '../warmIntroBridgeService';
import { 
  getProximityTeaBundles, 
  generateProximityTeaCopy, 
  GEO_CLUSTERS 
} from '../geoProximityService';

const mockPeople: Person[] = [
  {
    id: 'p1',
    name: '김창업',
    currentCompany: '뤼튼테크놀로지스',
    currentDepartment: '경영진',
    currentTitle: '대표이사 / Founder',
    mobile: '010-1111-2222',
    email: 'founder@wrtn.io',
    estimatedAgeGroup: '30s',
    isAgeEstimated: false,
    primaryDomain: 'AI/LLM',
    closeness: 2,
    connectionChannel: 'remember',
    isStale: false,
    sourceType: 'SOURCE_DATA',
    careers: [{ id: 'c1', companyName: '뤼튼테크놀로지스', title: '대표이사', isCurrent: true, startYear: 2021, source: 'SOURCE_DATA' }],
    academics: [{ schoolName: '연세대학교', major: '경영학', source: 'SOURCE_DATA' }],
    skills: ['Generative AI', 'B2B SaaS'],
    lastContactDate: '2026-05-01'
  },
  {
    id: 'p2',
    name: '이벤처',
    currentCompany: '알토스벤처스',
    currentDepartment: '투자본부',
    currentTitle: '수석 파트너 (Managing Director)',
    mobile: '010-3333-4444',
    email: 'partner@altos.vc',
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: 'VC 투자',
    closeness: 2,
    connectionChannel: 'business_card',
    isStale: false,
    sourceType: 'SOURCE_DATA',
    careers: [{ id: 'c2', companyName: '알토스벤처스', title: '파트너', isCurrent: true, startYear: 2019, source: 'SOURCE_DATA' }],
    academics: [{ schoolName: '서울대학교', major: '경제학', source: 'SOURCE_DATA' }],
    skills: ['Venture Capital', 'Series A/B'],
    lastContactDate: '2026-08-01'
  },
  {
    id: 'p3',
    name: '박엔진',
    currentCompany: '크래프톤',
    currentDepartment: 'AI R&D',
    currentTitle: 'AI 딥러닝 펠로우 / R&D 총괄',
    mobile: '010-5555-6666',
    email: 'engine@krafton.com',
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: '인공지능',
    closeness: 1,
    connectionChannel: 'dart',
    isStale: false,
    sourceType: 'DART_FACT',
    careers: [{ id: 'c3', companyName: '크래프톤', title: '펠로우', isCurrent: true, startYear: 2020, source: 'DART_FACT' }],
    academics: [{ schoolName: 'KAIST', major: '전산학', source: 'SOURCE_DATA' }],
    skills: ['Deep Learning', 'GPU Infra'],
    lastContactDate: '2026-01-10'
  }
];

describe('warmIntroBridgeService - Double Opt-in 지능형 커넥터 검증', () => {
  it('스타트업 창업가와 VC 투자 파트너 간의 상호 시너지를 지능형으로 감지해야 한다', () => {
    const pairs = findSynergyPairs(mockPeople);
    expect(pairs.length).toBeGreaterThan(0);

    const founderVcPair = pairs.find(
      p => (p.personA.name === '김창업' && p.personB.name === '이벤처') ||
           (p.personA.name === '이벤처' && p.personB.name === '김창업')
    );
    expect(founderVcPair).toBeDefined();
    expect(founderVcPair?.synergyType).toBe('INVESTOR_FOUNDER');
    expect(founderVcPair?.matchScore).toBeGreaterThanOrEqual(70);
  });

  it('글로벌 표준 Double Opt-in 3단계 서신이 양측 인물의 정보와 품격 있는 어휘로 완성되어야 한다', () => {
    const drafts = generateDoubleOptInDrafts('홍길동', mockPeople[0], mockPeople[1], 'AI 스타트업 전략 투자 교류', 'formal');
    
    // Step 1: Person A 대상 사전 의사 타진
    expect(drafts.step1AskPersonA).toContain('김창업');
    expect(drafts.step1AskPersonA).toContain('이벤처');
    expect(drafts.step1AskPersonA).toContain('사전 의사를 여쭙고자 합니다');

    // Step 2: Person B 대상 사전 의사 타진
    expect(drafts.step2AskPersonB).toContain('이벤처');
    expect(drafts.step2AskPersonB).toContain('김창업');
    expect(drafts.step2AskPersonB).toContain('티타임 자리를 마련');

    // Step 3: 양측 동의 후 3자 다이렉트 연결
    expect(drafts.step3DirectThreeWayIntro).toContain('홍길동입니다');
    expect(drafts.step3DirectThreeWayIntro).toContain('두 분 모두 반갑게 화답해 주셔서');
  });
});

describe('geoProximityService - 거점 외근 티타임 번들러 검증', () => {
  it('성수 거점 방문 시 소통 골든타임 경과 인물을 우선순위로 번들링해야 한다', () => {
    const bundle = getProximityTeaBundles(mockPeople, 'seongsu');
    expect(bundle.cluster.id).toBe('seongsu');
    expect(bundle.bundleItems.length).toBeGreaterThan(0);

    // 크래프톤/성수 인맥이 번들에 포함되는지 확인
    const topItem = bundle.bundleItems[0];
    expect(topItem.recommendScore).toBeGreaterThan(50);
  });

  it('외근 동선 맞춤형 티타임 제안문이 생성되어야 한다', () => {
    const seongsuCluster = GEO_CLUSTERS.find(c => c.id === 'seongsu')!;
    const copy = generateProximityTeaCopy(mockPeople[0], seongsuCluster, 'CASUAL_TEA', '홍길동');
    expect(copy).toContain('김창업');
    expect(copy).toContain('성수·서울숲');
    expect(copy).toContain('15~20분 내외로 가볍게 차 한 잔');
  });
});
