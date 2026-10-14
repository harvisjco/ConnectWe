import { describe, it, expect, beforeEach } from 'vitest';
import {
  cleanCompanyName,
  buildNetworkGraphIndex,
  calculatePersonPowerMetric,
  getTopSuperConnectors,
  getTopSuperConnectorsAsync,
  clearCentralityCache
} from '../centralityEngine';
import { Person } from '../../types/network';

const samplePeople: Person[] = [
  {
    id: 'p-1',
    name: '김대표',
    currentCompany: '(주) 카카오',
    currentTitle: '대표이사',
    currentDepartment: '경영전략',
    mobile: '010-1111-2222',
    email: 'kim@kakao.com',
    sourceType: 'DART_FACT',
    closeness: 1,
    estimatedAgeGroup: '50s_plus',
    isAgeEstimated: false,
    primaryDomain: 'IT',
    skills: ['경영', 'AI'],
    academics: [{ schoolName: '서울대', source: 'SOURCE_DATA' }],
    careers: [{ id: 'c-1', companyName: 'NAVER', title: '이사', startYear: 2015, endYear: 2020, isCurrent: false, source: 'SOURCE_DATA' }],
    connectionChannel: 'manual',
    isStale: false
  },
  {
    id: 'p-2',
    name: '이임원',
    currentCompany: '카카오엔터프라이즈',
    currentTitle: '부사장',
    currentDepartment: '클라우드',
    mobile: '010-3333-4444',
    email: 'lee@kakaoenterprise.com',
    sourceType: 'SOURCE_DATA',
    closeness: 2,
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: '클라우드',
    skills: ['인프라'],
    academics: [{ schoolName: '카이스트', source: 'SOURCE_DATA' }],
    careers: [{ id: 'c-2', companyName: '네이버', title: '팀장', startYear: 2016, endYear: 2021, isCurrent: false, source: 'SOURCE_DATA' }],
    connectionChannel: 'manual',
    isStale: false
  },
  {
    id: 'p-3',
    name: '박팀장',
    currentCompany: '토스',
    currentTitle: '프로덕트 리드',
    currentDepartment: '페이먼츠',
    mobile: '010-5555-6666',
    email: 'park@toss.im',
    sourceType: 'SOURCE_DATA',
    closeness: 4,
    estimatedAgeGroup: '30s',
    isAgeEstimated: false,
    primaryDomain: 'Fintech',
    skills: ['핀테크'],
    academics: [{ schoolName: '연세대', source: 'SOURCE_DATA' }],
    careers: [],
    connectionChannel: 'manual',
    isStale: true
  }
];

describe('centralityEngine - O(N) 고속 색인 및 비동기 청킹 검증', () => {
  beforeEach(() => {
    clearCentralityCache();
  });

  describe('cleanCompanyName', () => {
    it('(주), 주식회사 기호 및 공백을 정규화 제거해야 한다', () => {
      expect(cleanCompanyName('(주) 카카오')).toBe('카카오');
      expect(cleanCompanyName('주식회사 네이버')).toBe('네이버');
      expect(cleanCompanyName('  삼성 전자 (주) ')).toBe('삼성전자');
      expect(cleanCompanyName(null)).toBe('');
    });
  });

  describe('buildNetworkGraphIndex', () => {
    it('전체 인맥의 소속사와 과거 경력을 Map으로 단일 패스 색인화해야 한다', () => {
      const index = buildNetworkGraphIndex(samplePeople);
      expect(index.companyMap.has('카카오')).toBe(true);
      expect(index.alumniMap.has('naver')).toBe(true);
      expect(index.allCompanyKeys.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('calculatePersonPowerMetric', () => {
    it('DART 공시 임원이자 친밀도가 높은 인맥은 높은 허브 지수를 획득해야 한다', () => {
      const metric = calculatePersonPowerMetric(samplePeople[0], samplePeople);
      expect(metric.person.id).toBe('p-1');
      expect(metric.isDartPublicDirector).toBe(true);
      expect(metric.powerScore).toBeGreaterThanOrEqual(60);
      expect(metric.tier).toBeDefined();
      expect(metric.insights.length).toBeGreaterThan(0);
    });
  });

  describe('getTopSuperConnectors & 캐싱', () => {
    it('허브 지수가 높은 순서로 정렬하여 상위 인맥을 반환해야 한다', () => {
      const top = getTopSuperConnectors(samplePeople, 2);
      expect(top.length).toBe(2);
      expect(top[0].powerScore).toBeGreaterThanOrEqual(top[1].powerScore);

      // 동일 참조로 다시 호출 시 캐시가 즉시 반환되어야 함
      const cached = getTopSuperConnectors(samplePeople, 2);
      expect(cached).toEqual(top);
    });

    it('빈 배열 입력 시 안전하게 빈 배열을 반환해야 한다', () => {
      expect(getTopSuperConnectors([], 5)).toEqual([]);
    });
  });

  describe('getTopSuperConnectorsAsync', () => {
    it('비동기 청킹 방식으로 계산한 결과가 동기식 결과와 100% 동일해야 한다', async () => {
      const syncResult = getTopSuperConnectors(samplePeople, 3);
      clearCentralityCache();
      const asyncResult = await getTopSuperConnectorsAsync(samplePeople, 3, 1); // 1명씩 청킹

      expect(asyncResult.length).toBe(syncResult.length);
      expect(asyncResult.map(m => m.person.id)).toEqual(syncResult.map(m => m.person.id));
      expect(asyncResult.map(m => m.powerScore)).toEqual(syncResult.map(m => m.powerScore));
    });
  });
});
