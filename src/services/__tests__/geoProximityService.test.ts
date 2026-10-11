import { describe, it, expect } from 'vitest';
import { 
  matchPersonToCluster, 
  getProximityTeaBundle, 
  generateProximityTeaCopy, 
  optimizeBusinessTripRoute,
  GEO_CLUSTERS
} from '../geoProximityService';
import { Person } from '../../types/network';

describe('geoProximityService [거점 레이더 및 혁신 29 출장 동선 최적화 플래너]', () => {
  const mockPeople: Person[] = [
    {
      id: 'p-seongsu-1',
      name: '김성수',
      currentCompany: '크래프톤',
      currentDepartment: '경영전략',
      currentTitle: 'VP',
      mobile: '010-1111-2222',
      email: 'sskim@krafton.com',
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: '게임/IT',
      skills: ['게임', '글로벌'],
      careers: [],
      academics: [],
      closeness: 1,
      memo: '성수 메가타워 근무',
      lastContactDate: '2024-01-01',
      sourceType: 'DART_FACT',
      connectionChannel: 'dart',
      isStale: false
    },
    {
      id: 'p-seongsu-2',
      name: '이숲',
      currentCompany: '무신사',
      currentDepartment: '신사업본부',
      currentTitle: '본부장',
      mobile: '010-3333-4444',
      email: 'forest@musinsa.com',
      estimatedAgeGroup: '30s',
      isAgeEstimated: false,
      primaryDomain: '커머스/패션',
      skills: ['커머스', '플랫폼'],
      careers: [],
      academics: [],
      closeness: 2,
      memo: '성수 서울숲 캠퍼스',
      lastContactDate: '2024-06-01',
      sourceType: 'SOURCE_DATA',
      connectionChannel: 'remember',
      isStale: false
    },
    {
      id: 'p-teheran-1',
      name: '박테란',
      currentCompany: '토스',
      currentDepartment: '결제플랫폼',
      currentTitle: '리더',
      mobile: '010-5555-6666',
      email: 'teheran@toss.im',
      estimatedAgeGroup: '30s',
      isAgeEstimated: false,
      primaryDomain: '핀테크',
      skills: ['결제', '핀테크'],
      careers: [],
      academics: [],
      closeness: 2,
      memo: '강남 아크플레이스',
      sourceType: 'SOURCE_DATA',
      connectionChannel: 'manual',
      isStale: false
    }
  ];

  it('1. 인맥의 회사명 및 메모를 바탕으로 거점 클러스터 매핑이 정확히 수행된다', () => {
    expect(matchPersonToCluster(mockPeople[0])).toBe('seongsu');
    expect(matchPersonToCluster(mockPeople[1])).toBe('seongsu');
    expect(matchPersonToCluster(mockPeople[2])).toBe('gangnam_teheran');
  });

  it('2. getProximityTeaBundle 호출 시 해당 거점 인맥을 번들링하고 스코어를 산출한다', () => {
    const bundle = getProximityTeaBundle('seongsu', mockPeople);
    expect(bundle.cluster.id).toBe('seongsu');
    expect(bundle.bundleItems.length).toBe(2);
    expect(bundle.bundleItems[0].recommendScore).toBeGreaterThan(0);
  });

  it('3. generateProximityTeaCopy가 정중하고 인간 중심적인 제안 카피를 생성한다', () => {
    const cluster = GEO_CLUSTERS.find(c => c.id === 'seongsu')!;
    const copy = generateProximityTeaCopy(mockPeople[0], cluster, 'CASUAL_TEA', '테스터');
    expect(copy).toContain('김성수 VP님');
    expect(copy).toContain('성수·서울숲');
    expect(copy).toContain('차 한 잔');
  });

  it('4. [혁신 29] optimizeBusinessTripRoute가 순차 정류장, 타임슬롯 및 동선 효율 점수를 완벽히 산출한다', () => {
    const routePlan = optimizeBusinessTripRoute('seongsu', mockPeople, 3, '2026-10-20 (화)');
    expect(routePlan.cluster.id).toBe('seongsu');
    expect(routePlan.tripDate).toBe('2026-10-20 (화)');
    expect(routePlan.totalMeetingsCount).toBe(2);
    expect(routePlan.stops.length).toBe(2);
    expect(routePlan.routeEfficiencyScore).toBeGreaterThanOrEqual(70);
    expect(routePlan.routeSummaryAdvice).toContain('성수 / 서울숲');

    // 1차 미팅: 10:30 모닝 티타임
    const stop1 = routePlan.stops[0];
    expect(stop1.order).toBe(1);
    expect(stop1.timeSlot).toBe('10:30 ~ 11:15');
    expect(stop1.person.name).toBe('김성수');
    expect(stop1.travelBufferMinutes).toBe(15);

    // 2차 미팅: 12:00 런치 브리프
    const stop2 = routePlan.stops[1];
    expect(stop2.order).toBe(2);
    expect(stop2.timeSlot).toBe('12:00 ~ 13:15');
    expect(stop2.person.name).toBe('이숲');
  });
});
