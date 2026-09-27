import { Person } from '../types/network';
import { CalendarMeeting } from './calendarRadarService';
import { BusinessDeal } from './dealPipelineService';
import { loadPromotionEvents, getCadenceAlerts } from './promotionRadarService';
import { getGeoClusterBreakdown } from './geoProximityService';

export interface WeeklyBriefingSummary {
  periodLabel: string;
  generatedDate: string;
  totalNetworkCount: number;
  dartExecutiveCount: number;
  upcomingMeetings: {
    id: string;
    title: string;
    date: string;
    personName?: string;
    company?: string;
  }[];
  uncelebratedPromotions: {
    id: string;
    personName: string;
    companyName: string;
    newTitle: string;
    promotionType: string;
  }[];
  cadenceAlerts: {
    id: string;
    personName: string;
    companyName: string;
    title: string;
    daysSince: number;
  }[];
  activeDeals: {
    id: string;
    title: string;
    company: string;
    size: string;
    health: number;
  }[];
  topClusterDistribution: {
    name: string;
    count: number;
  }[];
}

/**
 * 경영진 주간 전략 인텔리전스 1-Page 요약 데이터 집계
 */
export function getWeeklyBriefingSummary(
  people: Person[],
  meetings: CalendarMeeting[] = [],
  deals: BusinessDeal[] = []
): WeeklyBriefingSummary {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const weekNumber = Math.ceil(now.getDate() / 7);
  const periodLabel = `${year}년 ${month}월 ${weekNumber}주차`;
  const generatedDate = now.toISOString().slice(0, 10);

  // 1. 전체 인맥 및 DART 임원 통계
  const totalNetworkCount = people.length;
  const dartExecutiveCount = people.filter(
    p => p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector
  ).length;

  // 2. 예정된 캘린더 미팅 (상위 3건)
  const upcomingMeetings = meetings.slice(0, 3).map(m => ({
    id: m.id,
    title: m.title,
    date: m.startTime.slice(5, 16).replace('T', ' '),
    personName: m.matchedPerson?.name,
    company: m.matchedPerson?.currentCompany
  }));

  // 3. 미축하 영전 공시 이벤트 (상위 3건)
  const promos = loadPromotionEvents(people);
  const uncelebratedPromotions = promos
    .filter(p => !p.isCongratulated)
    .slice(0, 3)
    .map(p => ({
      id: p.id,
      personName: p.personName,
      companyName: p.companyName,
      newTitle: p.newTitle,
      promotionType: p.promotionType === 'CEO_APPOINTMENT' ? '대표이사 선임' : '임원 영전'
    }));

  // 4. 소통 골든타임 이탈 인맥 (상위 3건)
  const cadence = getCadenceAlerts(people);
  const cadenceAlerts = cadence.slice(0, 3).map(c => ({
    id: c.person.id,
    personName: c.person.name,
    companyName: c.person.currentCompany,
    title: c.person.currentTitle,
    daysSince: c.daysSinceLastContact
  }));

  // 5. 활성 전략 딜 파이프라인 (상위 2건)
  const activeDeals = deals.slice(0, 2).map(d => ({
    id: d.id,
    title: d.title,
    company: d.targetCompany,
    size: d.dealSize || '규모 협의 중',
    health: d.healthScore
  }));

  // 6. 거점 인맥 분포 상위 3곳
  const clusters = getGeoClusterBreakdown(people);
  const topClusterDistribution = clusters
    .sort((a, b) => b.people.length - a.people.length)
    .slice(0, 3)
    .map(c => ({
      name: c.cluster.shortName,
      count: c.people.length
    }));

  return {
    periodLabel,
    generatedDate,
    totalNetworkCount,
    dartExecutiveCount,
    upcomingMeetings,
    uncelebratedPromotions,
    cadenceAlerts,
    activeDeals,
    topClusterDistribution
  };
}

/**
 * 슬랙/카카오톡/이메일 전송용 고품격 텍스트 요약본 생성
 */
export function generateWeeklyBriefingTextCopy(
  summary: WeeklyBriefingSummary,
  senderName: string = '홍길동'
): string {
  const meetingLines = summary.upcomingMeetings.length > 0
    ? summary.upcomingMeetings.map(m => `  • ${m.date}: ${m.title} (${m.company || '외부'} ${m.personName || ''})`).join('\n')
    : '  • 예정된 외부 일정이 없습니다.';

  const promoLines = summary.uncelebratedPromotions.length > 0
    ? summary.uncelebratedPromotions.map(p => `  • ${p.companyName} ${p.personName} (${p.newTitle} · ${p.promotionType})`).join('\n')
    : '  • 신규 미축하 공시가 없습니다.';

  const cadenceLines = summary.cadenceAlerts.length > 0
    ? summary.cadenceAlerts.map(c => `  • ${c.companyName} ${c.personName} ${c.title} (${c.daysSince}일 미교류)`).join('\n')
    : '  • 관리 요망 인맥이 없습니다.';

  const dealLines = summary.activeDeals.length > 0
    ? summary.activeDeals.map(d => `  • [${d.company}] ${d.title} (${d.size} · 건전도 ${d.health}%)`).join('\n')
    : '  • 진행 중인 중점 딜이 없습니다.';

  return `📊 [ConnectWe] ${summary.periodLabel} C-Level 전략 인텔리전스 주간 브리프
보고자: ${senderName} | 발행일: ${summary.generatedDate}

1. 핵심 네트워크 자산 현황
- 총 관리 인맥: ${summary.totalNetworkCount}명 (DART 공시 임원 ${summary.dartExecutiveCount}명)
- 주요 상주 거점: ${summary.topClusterDistribution.map(c => `${c.name}(${c.count}명)`).join(', ')}

2. 이번 주 주요 미팅 레이더
${meetingLines}

3. DART 지각변동 & 임원 영전 축하 대상
${promoLines}

4. 소통 골든타임 관리 요망 VIP (60일+ 미소통)
${cadenceLines}

5. 전략 비즈니스 딜 파이프라인
${dealLines}

※ 본 브리프는 공공 DART 실공시 팩트 및 ConnectWe 암호화 네트워크 그래프를 기반으로 작성되었습니다.`;
}
