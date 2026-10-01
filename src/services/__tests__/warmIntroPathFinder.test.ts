import { describe, it, expect } from 'vitest';
import { findBestIntroPaths } from '../warmIntroPathFinder';
import { Person } from '../../types/network';

describe('warmIntroPathFinder (최단 신뢰 소개 경로 탐색 엔진)', () => {
  const me: Person = {
    id: 'p-me',
    name: '나 (대표)',
    currentCompany: 'ConnectWe',
    currentDepartment: '경영총괄',
    currentTitle: '대표이사',
    mobile: '010-0000-0001',
    email: 'me@connectwe.com',
    closeness: 1,
    sourceType: 'SOURCE_DATA',
    skills: [],
    careers: [],
    academics: [],
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: '경영',
    isStale: false,
    connectionChannel: 'manual'
  };

  const target: Person = {
    id: 'p-target',
    name: '이수진',
    currentCompany: '네이버',
    currentDepartment: 'AI전략실',
    currentTitle: '전무',
    mobile: '010-9999-8888',
    email: 'sujin@naver.com',
    closeness: 3,
    sourceType: 'DART_FACT',
    academics: [{ schoolName: '서울대학교', major: '컴퓨터공학', source: 'DART_FACT' }],
    skills: ['AI'],
    careers: [],
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: 'AI',
    isStale: false,
    connectionChannel: 'dart'
  };

  const candidateA: Person = {
    id: 'p-candA',
    name: '김철수',
    currentCompany: '네이버',
    currentDepartment: '경영전략본부',
    currentTitle: '부사장',
    mobile: '010-1111-2222',
    email: 'cs@naver.com',
    closeness: 1,
    isStale: false,
    sourceType: 'DART_FACT',
    academics: [{ schoolName: '서울대학교', major: '경영학', source: 'DART_FACT' }],
    skills: ['경영'],
    careers: [],
    estimatedAgeGroup: '50s_plus',
    isAgeEstimated: false,
    primaryDomain: '경영',
    connectionChannel: 'dart'
  };

  const candidateB: Person = {
    id: 'p-candB',
    name: '박영희',
    currentCompany: '스타트업X',
    currentDepartment: '마케팅팀',
    currentTitle: '이사',
    mobile: '010-3333-4444',
    email: 'yh@x.com',
    closeness: 2,
    isStale: true,
    sourceType: 'SOURCE_DATA',
    skills: [],
    careers: [],
    academics: [],
    estimatedAgeGroup: '30s',
    isAgeEstimated: false,
    primaryDomain: '마케팅',
    connectionChannel: 'business_card'
  };

  it('동일 회사 동료이자 동문인 1촌 중개자(김철수)가 최우선 경로로 추천되어야 한다', () => {
    const paths = findBestIntroPaths(me, target, [me, target, candidateA, candidateB]);

    expect(paths.length).toBe(2);
    const topPath = paths[0];

    expect(topPath.intermediary.name).toBe('김철수');
    expect(topPath.trustScore).toBeGreaterThanOrEqual(85);
    expect(topPath.confidenceLevel).toBe('VERY_HIGH');
    expect(topPath.connectionTags).toContain('네이버 사내 동료');
    expect(topPath.suggestedIntroLetter).toContain('김철수 부사장님');
    expect(topPath.suggestedIntroLetter).toContain('이수진 전무님');
  });

  it('나와 타깃 인물이 동일인일 경우 빈 배열을 반환해야 한다', () => {
    const paths = findBestIntroPaths(me, me, [me, candidateA]);
    expect(paths).toEqual([]);
  });
});
