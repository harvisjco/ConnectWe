import { describe, it, expect } from 'vitest';
import { 
  analyzeCrossBoardSynergy, 
  getCorpExecutives 
} from '../crossBoardSynergyService';
import { Person } from '../../types/network';

describe('crossBoardSynergyService - 크로스 보드 시너지 & 3대 신뢰 가교 경로 엔진 검증', () => {
  const mockPeople: Person[] = [
    {
      id: 'p-1',
      name: '한동훈',
      currentCompany: '(주)하이퍼클라우드',
      currentDepartment: '기술본부',
      currentTitle: 'CTO / 사내이사',
      mobile: '010-1234-5678',
      email: 'hdh@hypercloud.ai',
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: '클라우드 인프라',
      skills: ['Distributed Systems', 'Cloud'],
      careers: [
        {
          id: 'c-1',
          companyName: '삼성전자',
          title: '수석연구원',
          startYear: 2015,
          endYear: 2020,
          isCurrent: false,
          source: 'SOURCE_DATA'
        }
      ],
      academics: [],
      sourceType: 'DART_FACT',
      closeness: 2,
      connectionChannel: 'dart',
      isStale: false
    },
    {
      id: 'p-2',
      name: '이진혁',
      currentCompany: '퓨처웨이브 반도체',
      currentDepartment: '경영총괄',
      currentTitle: '대표이사 (CEO)',
      mobile: '010-9999-8888',
      email: 'ceo@futurewave.com',
      estimatedAgeGroup: '50s_plus',
      isAgeEstimated: false,
      primaryDomain: '반도체 설계',
      skills: ['Fabless', 'ASIC'],
      careers: [
        {
          id: 'c-2',
          companyName: '삼성전자',
          title: '상무',
          startYear: 2012,
          endYear: 2021,
          isCurrent: false,
          source: 'SOURCE_DATA'
        }
      ],
      academics: [],
      sourceType: 'SOURCE_DATA',
      closeness: 2,
      connectionChannel: 'remember',
      isStale: false
    },
    {
      id: 'p-3',
      name: '정우성',
      currentCompany: '스톤브릿지벤처스',
      currentDepartment: '투자본부',
      currentTitle: '대표 파트너',
      mobile: '010-7777-6666',
      email: 'wsjung@stonebridge.com',
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: 'VC 투자 / M&A',
      skills: ['M&A', 'Due Diligence'],
      careers: [],
      academics: [],
      sourceType: 'SOURCE_DATA',
      closeness: 2,
      connectionChannel: 'manual',
      isStale: false
    }
  ];

  it('1. 특정 상장사(삼성전자 등)의 DART 임원 목록을 정상적으로 추출해야 한다', () => {
    const execs = getCorpExecutives('삼성전자');
    expect(execs).toBeDefined();
    expect(execs.length).toBeGreaterThan(0);
    expect(execs.some(e => e.corpName.includes('삼성전자'))).toBe(true);
  });

  it('2. 크로스 보드 오버레이 분석 시 시너지 스코어(0~100) 및 등급(S~C)이 산출되어야 한다', () => {
    const report = analyzeCrossBoardSynergy('삼성전자', mockPeople, '(주)ConnectWe');
    
    expect(report.targetCorpName).toBe('삼성전자');
    expect(report.ourCorpName).toBe('(주)ConnectWe');
    expect(report.synergyScore).toBeGreaterThanOrEqual(35);
    expect(report.synergyScore).toBeLessThanOrEqual(100);
    expect(['S', 'A', 'B', 'C']).toContain(report.synergyGrade);
    expect(report.gradeLabel).toBeDefined();
  });

  it('3. 3대 신뢰 가교 경로(다이렉트, 알럼나이, 투자사)가 온전히 도출되어야 한다', () => {
    const report = analyzeCrossBoardSynergy('삼성전자', mockPeople);
    
    expect(report.threeTrustRoutes).toHaveLength(3);
    const [directRoute, alumniRoute, investorRoute] = report.threeTrustRoutes;

    expect(directRoute.routeType).toBe('DIRECT');
    expect(directRoute.trustScore).toBeGreaterThan(0);
    expect(directRoute.approachStrategy).toBeDefined();

    expect(alumniRoute.routeType).toBe('ALUMNI');
    expect(alumniRoute.approachStrategy).toBeDefined();

    expect(investorRoute.routeType).toBe('INVESTOR');
    expect(investorRoute.approachStrategy).toBeDefined();
  });

  it('4. 1-Page 전략 시너지 브리프 텍스트가 정상 합성되어야 한다', () => {
    const report = analyzeCrossBoardSynergy('삼성전자', mockPeople, '(주)ConnectWe');
    
    expect(report.onePageBriefText).toContain('[C-Level 전략 시너지 브리프]');
    expect(report.onePageBriefText).toContain('삼성전자');
    expect(report.onePageBriefText).toContain('시너지 종합 점수');
    expect(report.onePageBriefText).toContain('최우선 3대 신뢰 가교 경로');
    expect(report.onePageBriefText).toContain('양사 3대 전략 결합 화두');
  });

  it('5. 알럼나이 겹침(삼성전자 전직 이력)을 감지하여 오버레이 목록에 포함해야 한다', () => {
    const report = analyzeCrossBoardSynergy('삼성전자', mockPeople);
    
    const alumniOverlays = report.overlays.filter(o => o.type === 'ALUMNI_OVERLAP');
    expect(alumniOverlays.length).toBeGreaterThan(0);
    expect(alumniOverlays.some(o => o.personName === '한동훈' || o.personName === '이진혁')).toBe(true);
  });
});
