import { describe, it, expect } from 'vitest';
import { calculateCompanyPenetrations, calculateNetworkEquity } from '../networkAuditService';
import { Person } from '../../types/network';

describe('networkAuditService - 기업 침투도 및 네트워크 자산 진단', () => {
  const mockPeople: Person[] = [
    {
      id: 'p1',
      name: '이삼성',
      currentCompany: '삼성전자',
      currentDepartment: '메모리사업부',
      currentTitle: '부사장',
      mobile: '010-1111-2222',
      email: 'samsung@test.com',
      estimatedAgeGroup: '50s_plus',
      isAgeEstimated: false,
      primaryDomain: '반도체',
      skills: ['DRAM', 'HBM'],
      careers: [
        {
          id: 'c1',
          companyName: '삼성전자',
          title: '부사장',
          startYear: 2020,
          isCurrent: true,
          source: 'DART_FACT',
        },
      ],
      academics: [],
      sourceType: 'DART_FACT',
      dartInfo: {
        corpCode: '00126380',
        stockName: '삼성전자',
        isPublicDirector: true,
        registeredRole: '사내이사',
        verifiedAt: '2026-03-01',
      },
      closeness: 1,
      connectionChannel: 'dart',
      isStale: false,
      lastContactDate: '2026-09-10',
    },
    {
      id: 'p2',
      name: '김네이버',
      currentCompany: 'NAVER',
      currentDepartment: '클라우드',
      currentTitle: '책임리더',
      mobile: '010-3333-4444',
      email: 'naver@test.com',
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: 'AI/LLM',
      skills: ['HyperCLOVA', 'Cloud'],
      careers: [],
      academics: [],
      sourceType: 'SOURCE_DATA',
      closeness: 2,
      connectionChannel: 'remember',
      isStale: false,
      lastContactDate: '2026-08-20',
    },
  ];

  it('20대 핵심 벤치마크 기업 침투도를 산출하고 삼성전자 접점이 정상 집계되어야 한다', () => {
    const penetrations = calculateCompanyPenetrations(mockPeople);
    expect(penetrations.length).toBe(20);

    const samsung = penetrations.find(p => p.companyName === '삼성전자');
    expect(samsung).toBeDefined();
    expect(samsung?.totalDirectContacts).toBe(1);
    expect(samsung?.dartExecutiveCount).toBe(1);
    expect(samsung?.decisionMakerCount).toBe(1);
    expect(samsung?.penetrationScore).toBeGreaterThanOrEqual(70);
  });

  it('접점이 전혀 없는 기업은 D등급 (Blind Spot)으로 분류되어야 한다', () => {
    const penetrations = calculateCompanyPenetrations(mockPeople);
    const hyundai = penetrations.find(p => p.companyName === '현대자동차');
    expect(hyundai).toBeDefined();
    expect(hyundai?.grade).toBe('GRADE_D');
    expect(hyundai?.penetrationScore).toBe(0);
  });

  it('네트워크 자산 종합 요약에서 공시 임원 수와 활성 비율이 정확히 계산되어야 한다', () => {
    const penetrations = calculateCompanyPenetrations(mockPeople);
    const summary = calculateNetworkEquity(mockPeople, penetrations);

    expect(summary.totalPeople).toBe(2);
    expect(summary.totalCompanies).toBe(2);
    expect(summary.dartExecutiveTotal).toBe(1);
    expect(summary.activeRatio90Days).toBe(100);
    expect(summary.industryDiversityScore).toBeGreaterThan(0);
  });
});
