import { describe, it, expect } from 'vitest';
import { Person } from '../../types/network';
import { CalendarMeeting } from '../calendarRadarService';
import { BusinessDeal } from '../dealPipelineService';
import { 
  getWeeklyBriefingSummary, 
  generateWeeklyBriefingTextCopy 
} from '../weeklyBriefingService';

const mockPeople: Person[] = [
  {
    id: 'p1',
    name: '김경영',
    currentCompany: '삼성전자',
    currentDepartment: '경영전략실',
    currentTitle: '부사장',
    mobile: '010-1111-2222',
    email: 'exec@samsung.com',
    estimatedAgeGroup: '50s_plus',
    isAgeEstimated: false,
    primaryDomain: '경영전략',
    closeness: 2,
    connectionChannel: 'dart',
    isStale: false,
    sourceType: 'DART_FACT',
    dartInfo: {
      corpCode: '00126380',
      stockName: '삼성전자',
      isPublicDirector: true,
      registeredRole: '사내이사',
      verifiedAt: '2026-03-15'
    },
    careers: [],
    academics: [],
    skills: [],
    lastContactDate: '2026-05-01' // 100일 이상 경과
  },
  {
    id: 'p2',
    name: '이파트너',
    currentCompany: '크래프톤',
    currentDepartment: '투자총괄',
    currentTitle: '본부장',
    mobile: '010-3333-4444',
    email: 'partner@krafton.com',
    estimatedAgeGroup: '40s',
    isAgeEstimated: false,
    primaryDomain: 'VC 투자',
    closeness: 2,
    connectionChannel: 'business_card',
    isStale: false,
    sourceType: 'SOURCE_DATA',
    careers: [],
    academics: [],
    skills: [],
    lastContactDate: '2026-08-01'
  }
];

const mockMeetings: CalendarMeeting[] = [
  {
    id: 'm1',
    title: '삼성전자 전략 파트너십 티타임',
    startTime: '2026-09-28T14:00:00',
    endTime: '2026-09-28T15:00:00',
    attendees: ['exec@samsung.com'],
    matchedPerson: mockPeople[0],
    minutesUntil: 120
  }
];

const mockDeals: BusinessDeal[] = [
  {
    id: 'deal-1',
    title: 'AI 반도체 인프라 공급 계약',
    targetCompany: '삼성전자',
    targetIndustry: '반도체/AI',
    stage: 'PROPOSAL',
    dealSize: '50억원',
    expectedCloseDate: '2026-11-30',
    healthScore: 85,
    stakeholders: [
      {
        personId: 'p1',
        personName: '김경영',
        company: '삼성전자',
        title: '부사장',
        role: 'CHAMPION',
        closeness: 2,
        isDartExecutive: true
      }
    ]
  }
];

describe('weeklyBriefingService - C-Level 주간 전략 인텔리전스 검증', () => {
  it('주간 인텔리전스 핵심 지표가 오차 없이 집계되어야 한다', () => {
    const summary = getWeeklyBriefingSummary(mockPeople, mockMeetings, mockDeals);

    expect(summary.totalNetworkCount).toBe(2);
    expect(summary.dartExecutiveCount).toBe(1);
    expect(summary.upcomingMeetings.length).toBe(1);
    expect(summary.upcomingMeetings[0].title).toContain('전략 파트너십');
    expect(summary.activeDeals.length).toBe(1);
    expect(summary.activeDeals[0].company).toBe('삼성전자');
    expect(summary.periodLabel).toContain('2026년');
  });

  it('경영진 공유용 텍스트 요약본이 올바른 포맷과 팩트 데이터로 서식화되어야 한다', () => {
    const summary = getWeeklyBriefingSummary(mockPeople, mockMeetings, mockDeals);
    const text = generateWeeklyBriefingTextCopy(summary, '김대표');

    expect(text).toContain('[ConnectWe]');
    expect(text).toContain('보고자: 김대표');
    expect(text).toContain('삼성전자');
    expect(text).toContain('50억원');
    expect(text).toContain('DART 공시 임원 1명');
  });
});
