import { describe, it, expect } from 'vitest';
import { getGovernanceHistory } from '../dartGovernanceService';
import { Person } from '../../types/network';

describe('dartGovernanceService (DART 거버넌스 변동 궤적 추적)', () => {
  const dartPerson: Person = {
    id: 'p_gov_1',
    name: '김등기',
    currentCompany: '삼성전자',
    currentDepartment: '경영지원실',
    currentTitle: '부사장',
    mobile: '010-9999-8888',
    email: 'dg.kim@samsung.com',
    estimatedAgeGroup: '50s_plus',
    isAgeEstimated: false,
    primaryDomain: '경영전략',
    skills: ['거버넌스', 'M&A'],
    careers: [],
    academics: [],
    closeness: 2,
    isStale: false,
    sourceType: 'DART_FACT',
    connectionChannel: 'dart',
    dartInfo: {
      corpCode: '005930',
      stockName: '삼성전자',
      isPublicDirector: true,
      registeredRole: '사내이사',
      verifiedAt: '2026-03-24'
    }
  };

  it('상장사 DART 임원의 최근 거버넌스 변동 궤적(선임, 지분, 정기공시)을 정상 반환해야 한다', () => {
    const history = getGovernanceHistory(dartPerson);
    expect(history.length).toBeGreaterThanOrEqual(3);
    expect(history[0].eventType).toBe('APPOINTMENT');
    expect(history[0].headline).toContain('삼성전자');
    expect(history[0].headline).toContain('사내이사');
    expect(history[1].eventType).toBe('SHARE_ACQUISITION');
  });

  it('비상장 인재의 경우에도 안전하게 기본 전문 경영 궤적을 반환해야 한다', () => {
    const startupPerson: Person = {
      ...dartPerson,
      id: 'p_gov_2',
      name: '이스타트업',
      currentCompany: '토스',
      sourceType: 'SOURCE_DATA',
      dartInfo: undefined
    };

    const history = getGovernanceHistory(startupPerson);
    expect(history.length).toBe(1);
    expect(history[0].headline).toContain('토스');
  });
});
