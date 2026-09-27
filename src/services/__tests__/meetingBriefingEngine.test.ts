import { describe, it, expect } from 'vitest';
import { generateMeetingBriefing, findMutualConnections } from '../meetingBriefingEngine';
import { Person } from '../../types/network';
import { BusinessDeal } from '../dealPipelineService';

describe('meetingBriefingEngine (C-Level 미팅 10분 전 스마트 브리핑)', () => {
  const targetPerson: Person = {
    id: 'p_target_1',
    name: '김경영',
    currentCompany: '네이버',
    currentDepartment: '전략실',
    currentTitle: '부사장',
    mobile: '010-1111-2222',
    email: 'ky.kim@navercorp.com',
    estimatedAgeGroup: '50s_plus',
    isAgeEstimated: false,
    primaryDomain: 'IT/인터넷',
    skills: ['플랫폼', 'AI'],
    careers: [
      { id: 'c1', companyName: '네이버', title: '부사장', startYear: 2022, isCurrent: true, source: 'DART_FACT' },
      { id: 'c2', companyName: '카카오', title: '이사', startYear: 2018, isCurrent: false, source: 'SOURCE_DATA' },
      { id: 'c3', companyName: '라인', title: '팀장', startYear: 2014, isCurrent: false, source: 'SOURCE_DATA' },
    ],
    academics: [],
    closeness: 2,
    isStale: false,
    sourceType: 'DART_FACT',
    connectionChannel: 'dart',
    dartInfo: {
      corpCode: '035420',
      stockName: 'NAVER',
      isPublicDirector: true,
      registeredRole: '등기이사',
      verifiedAt: '2026-09-01'
    }
  };

  const networkPeople: Person[] = [
    {
      id: 'p_colleague_1',
      name: '이동료',
      currentCompany: '네이버',
      currentDepartment: '클라우드',
      currentTitle: '책임리더',
      mobile: '010-3333-4444',
      email: 'colleague@navercorp.com',
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: 'IT/인터넷',
      skills: ['클라우드'],
      careers: [
        { id: 'c4', companyName: '네이버', title: '책임리더', startYear: 2020, isCurrent: true, source: 'SOURCE_DATA' }
      ],
      academics: [],
      closeness: 3,
      isStale: false,
      sourceType: 'SOURCE_DATA',
      connectionChannel: 'vcard'
    },
    {
      id: 'p_alumni_1',
      name: '박알럼',
      currentCompany: '쿠팡',
      currentDepartment: '물류전략',
      currentTitle: '디렉터',
      mobile: '010-5555-6666',
      email: 'alumni@coupang.com',
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: '이커머스',
      skills: ['물류'],
      careers: [
        { id: 'c5', companyName: '쿠팡', title: '디렉터', startYear: 2021, isCurrent: true, source: 'SOURCE_DATA' },
        { id: 'c6', companyName: '카카오', title: '팀장', startYear: 2017, isCurrent: false, source: 'SOURCE_DATA' }
      ],
      academics: [],
      closeness: 3,
      isStale: false,
      sourceType: 'SOURCE_DATA',
      connectionChannel: 'remember'
    }
  ];

  const sampleDeals: BusinessDeal[] = [
    {
      id: 'deal_1',
      title: '네이버 클라우드 엔터프라이즈 파트너십',
      targetCompany: '네이버',
      targetIndustry: '클라우드',
      stage: 'NEGOTIATION',
      expectedCloseDate: '2026-12-31',
      healthScore: 85,
      stakeholders: [
        {
          personId: 'p_target_1',
          personName: '김경영',
          company: '네이버',
          title: '부사장',
          role: 'DECISION_MAKER',
          closeness: 1,
          isDartExecutive: true
        }
      ]
    }
  ];

  it('공통 알럼나이 및 현 동료를 정확히 도출해야 한다', () => {
    const mutuals = findMutualConnections(targetPerson, networkPeople);
    expect(mutuals.length).toBe(2);
    expect(mutuals.some(m => m.person.name === '이동료')).toBe(true);
    expect(mutuals.some(m => m.person.name === '박알럼')).toBe(true);
  });

  it('C-Level 미팅 브리핑을 1초 만에 완전하게 생성해야 한다', () => {
    const briefing = generateMeetingBriefing(targetPerson, networkPeople, sampleDeals);

    expect(briefing.person.name).toBe('김경영');
    expect(briefing.cluster).toBeDefined();
    expect(briefing.dartSummary.isFactVerified).toBe(true);
    expect(briefing.dartSummary.corpName).toBe('NAVER');
    expect(briefing.mutualConnections.length).toBe(2);
    expect(briefing.relatedDeals.length).toBe(1);
    expect(briefing.icebreakers.length).toBe(3);
    expect(briefing.etiquetteGuide.preferredStyle).toBeDefined();
    expect(briefing.onePageSummaryText).toContain('[C-Level 미팅 10분 전 스마트 브리핑]');
    expect(briefing.onePageSummaryText).toContain('NAVER');
  });
});
