import { describe, it, expect } from 'vitest';
import { 
  calculateTieStrength, 
  getCoolingDownAlerts, 
  buildIndustryHeatmapMatrix,
  getDaysSinceDate
} from '../tieStrengthService';
import { Person } from '../../types/network';

describe('tieStrengthService - 관계 결속도 및 5단계 온도 검증', () => {
  const hotPerson: Person = {
    id: 'p-hot',
    name: '김핫만',
    currentCompany: '원티드랩',
    currentTitle: '부사장',
    currentDepartment: '전략기획실',
    mobile: '010-1111-2222',
    email: 'hot@wantedlab.com',
    sourceType: 'DART_FACT',
    closeness: 2,
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: '경영 전략',
    skills: ['전략', '투자'],
    careers: [{ id: 'c1', companyName: '네이버', title: '팀장', startYear: 2020, isCurrent: false, source: 'SOURCE_DATA' }],
    academics: [{ schoolName: '서울대학교', degree: '학사', source: 'SOURCE_DATA' }],
    connectionChannel: 'dart',
    lastContactDate: new Date().toISOString().slice(0, 10), // 오늘 소통
    isStale: false,
    activityLogs: [
      { id: 'act-1', personId: 'p-hot', type: 'meeting', title: 'C-Level 조찬 미팅', loggedAt: '2026-09-25 08:30' }
    ]
  };

  const chillyPerson: Person = {
    id: 'p-chilly',
    name: '이냉랭',
    currentCompany: '구글코리아',
    currentTitle: '전무',
    currentDepartment: '클라우드사업부',
    mobile: '010-3333-4444',
    email: 'chilly@google.com',
    sourceType: 'SOURCE_DATA',
    closeness: 2, // 2촌 핵심 인맥
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: '클라우드 인프라',
    skills: ['클라우드'],
    careers: [],
    academics: [],
    connectionChannel: 'manual',
    lastContactDate: '2025-12-01', // 100일 이상 경과
    isStale: true
  };

  describe('calculateTieStrength', () => {
    it('최근 소통일이 오늘이고 DART 팩트가 있는 2촌 인맥은 높은 결속도(HOT 이상)를 기록해야 한다', () => {
      const detail = calculateTieStrength(hotPerson);
      expect(detail.score).toBeGreaterThanOrEqual(71);
      expect(detail.level === 'HOT' || detail.level === 'DIAMOND').toBe(true);
      expect(detail.isCoolingDown).toBe(false);
      expect(detail.meta.emoji).toBeDefined();
    });

    it('2촌 핵심 인맥이라도 소통이 90일 이상 끊긴 경우 급랭 위험(isCoolingDown: true)으로 플래깅되어야 한다', () => {
      const detail = calculateTieStrength(chillyPerson);
      expect(detail.isCoolingDown).toBe(true);
      expect(detail.level).toBe('CHILLY');
    });

    it('본인(closeness: 1)은 최고 수준의 친밀도 점수가 부여되어야 한다', () => {
      const mePerson: Person = {
        ...hotPerson,
        id: 'me',
        closeness: 1
      };
      const detail = calculateTieStrength(mePerson);
      expect(detail.closenessScore).toBe(30);
    });
  });

  describe('getCoolingDownAlerts', () => {
    it('핵심 1~2촌 인맥 중 소통 공백이 발생한 인물만 정확히 필터링해야 한다', () => {
      const alerts = getCoolingDownAlerts([hotPerson, chillyPerson]);
      expect(alerts).toHaveLength(1);
      expect(alerts[0].person.name).toBe('이냉랭');
      expect(alerts[0].detail.isCoolingDown).toBe(true);
    });
  });

  describe('buildIndustryHeatmapMatrix', () => {
    it('산업군별로 5단계 온도 분포와 평균 점수를 올바르게 집계해야 한다', () => {
      const matrix = buildIndustryHeatmapMatrix([hotPerson, chillyPerson]);
      expect(matrix.length).toBeGreaterThanOrEqual(1);

      const strategyDomain = matrix.find(m => m.domain === '경영 전략');
      expect(strategyDomain).toBeDefined();
      if (strategyDomain) {
        expect(strategyDomain.total).toBe(1);
        expect((strategyDomain.counts.HOT || 0) + (strategyDomain.counts.DIAMOND || 0)).toBe(1);
      }
    });
  });

  describe('getDaysSinceDate', () => {
    it('유효하지 않거나 빈 날짜는 999를 반환해야 한다', () => {
      expect(getDaysSinceDate('')).toBe(999);
      expect(getDaysSinceDate(undefined)).toBe(999);
      expect(getDaysSinceDate('invalid-date')).toBe(999);
    });
  });
});
