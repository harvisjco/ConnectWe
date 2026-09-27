import { Person } from '../types/network';
import { CalendarMeeting } from './calendarRadarService';

export type TieStrengthLevel = 'CHILLY' | 'COOL' | 'WARM' | 'HOT' | 'DIAMOND';

export interface TieStrengthMeta {
  level: TieStrengthLevel;
  label: string;
  emoji: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  gradient: string;
  description: string;
}

export const TIE_STRENGTH_CONFIG: Record<TieStrengthLevel, TieStrengthMeta> = {
  CHILLY: {
    level: 'CHILLY',
    label: 'Chilly (소통 공백)',
    emoji: '❄️',
    badgeBg: 'bg-sky-50 dark:bg-sky-950/40',
    badgeText: 'text-sky-700 dark:text-sky-300',
    badgeBorder: 'border-sky-200 dark:border-sky-800',
    gradient: 'from-sky-400 to-indigo-500',
    description: '소통 공백이 90일 이상 지속되어 관계가 차가워진 상태입니다. 따뜻한 안부 티타임이 필요합니다.'
  },
  COOL: {
    level: 'COOL',
    label: 'Cool (간헐적 교류)',
    emoji: '🍃',
    badgeBg: 'bg-slate-50 dark:bg-slate-800/60',
    badgeText: 'text-slate-700 dark:text-slate-300',
    badgeBorder: 'border-slate-200 dark:border-slate-700',
    gradient: 'from-slate-400 to-slate-600',
    description: '명함 교환 또는 간헐적 소통 상태입니다. 공통 관심사를 통한 접점 확장이 유효합니다.'
  },
  WARM: {
    level: 'WARM',
    label: 'Warm (정기 교류)',
    emoji: '🌿',
    badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40',
    badgeText: 'text-emerald-700 dark:text-emerald-300',
    badgeBorder: 'border-emerald-200 dark:border-emerald-800',
    gradient: 'from-emerald-400 to-teal-600',
    description: '최근 60일 내 소통이나 프로젝트 협업이 지속되는 신뢰 파트너입니다.'
  },
  HOT: {
    level: 'HOT',
    label: 'Hot (핵심 키맨)',
    emoji: '🔥',
    badgeBg: 'bg-amber-50 dark:bg-amber-950/40',
    badgeText: 'text-amber-800 dark:text-amber-300',
    badgeBorder: 'border-amber-200 dark:border-amber-700',
    gradient: 'from-amber-400 to-orange-500',
    description: '상시 직통 소통 및 사업적 시너지가 활발한 전략적 핵심 인재입니다.'
  },
  DIAMOND: {
    level: 'DIAMOND',
    label: 'Solid Diamond (절대 신뢰)',
    emoji: '💎',
    badgeBg: 'bg-purple-50 dark:bg-purple-950/40',
    badgeText: 'text-purple-800 dark:text-purple-300',
    badgeBorder: 'border-purple-200 dark:border-purple-800',
    gradient: 'from-purple-500 via-indigo-500 to-amber-400',
    description: '1촌 핵심 인사이트 및 긴밀한 동반자적 관계를 맺고 있는 C-Level 얼라이언스입니다.'
  }
};

export interface TieStrengthDetail {
  score: number; // 0 ~ 100
  level: TieStrengthLevel;
  meta: TieStrengthMeta;
  closenessScore: number;  // max 30
  recencyScore: number;    // max 25
  activityScore: number;   // max 20
  strategicScore: number;  // max 15
  alumniScore: number;     // max 10
  daysSinceLastContact: number;
  isCoolingDown: boolean;
}

/**
 * 날짜 문자열(YYYY-MM-DD)로부터 오늘까지 경과일수 계산
 */
export function getDaysSinceDate(dateStr?: string): number {
  if (!dateStr) return 999;
  const target = new Date(dateStr);
  if (isNaN(target.getTime())) return 999;
  const now = new Date();
  const diffTime = now.getTime() - target.getTime();
  const days = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

/**
 * Mark Granovetter 이론 기반 C-Level 관계 결속도(Tie Strength) 점수 산출
 * - 친밀도 (max 30점): 1촌(Me) 30점, 2촌(절친/핵심) 28점, 3촌(일반) 18점, 4촌 8점, 5촌 3점
 * - 소통 신선도 (max 25점): 14일 이내 25점, 30일 이내 20점, 60일 이내 14점, 90일 이내 8점, 90일 초과 0점
 * - 활동 및 미팅 빈도 (max 20점): 미팅/활동 이력 1건당 5점 (최대 20점)
 * - DART 상장사 공시 팩트 시너지 (max 15점): DART 공시 임원일 경우 +15점, 일반 +5점
 * - 동문/재직 알럼나이 시너지 (max 10점): 과거 동일 기업 재직 또는 출신학교 보유 시 +10점
 */
export function calculateTieStrength(
  person: Person,
  meetings: CalendarMeeting[] = []
): TieStrengthDetail {
  // 1. 친밀도 점수 (max 30)
  let closenessScore = 10;
  if (person.closeness === 1) closenessScore = 30;
  else if (person.closeness === 2) closenessScore = 28;
  else if (person.closeness === 3) closenessScore = 18;
  else if (person.closeness === 4) closenessScore = 8;
  else closenessScore = 3;

  // 2. 소통 신선도 점수 (max 25, 90일 초과 시 소통 공백 페널티 -15)
  const daysSince = getDaysSinceDate(person.lastContactDate);
  let recencyScore = 0;
  if (daysSince <= 14) recencyScore = 25;
  else if (daysSince <= 30) recencyScore = 20;
  else if (daysSince <= 60) recencyScore = 14;
  else if (daysSince <= 90) recencyScore = 8;
  else recencyScore = -15; // 90일 이상 소통 부재 감점 페널티

  // 3. 활동 및 미팅 빈도 점수 (max 20)
  const activityLogsCount = (person.activityLogs || []).length;
  const personMeetingsCount = meetings.filter(m => 
    m.matchedPerson?.id === person.id || 
    m.attendees.some(a => a.includes(person.name))
  ).length;
  const totalInteractions = activityLogsCount + personMeetingsCount;
  const activityScore = Math.min(20, totalInteractions * 5);

  // 4. DART 상장사 공시 팩트 시너지 (max 15)
  const isDart = person.sourceType === 'DART_FACT' || !!person.dartInfo?.isPublicDirector;
  const strategicScore = isDart ? 15 : 5;

  // 5. 알럼나이/경력 시너지 (max 10)
  const hasCareers = (person.careers || []).length > 0;
  const hasAcademics = (person.academics || []).length > 0;
  const alumniScore = (hasCareers && hasAcademics) ? 10 : (hasCareers || hasAcademics ? 5 : 2);

  // 총점 계산 (0 ~ 100)
  const rawScore = closenessScore + recencyScore + activityScore + strategicScore + alumniScore;
  const score = Math.min(100, Math.max(0, rawScore));

  // 5단계 온도 레벨 결정
  let level: TieStrengthLevel = 'COOL';
  if (score >= 86) level = 'DIAMOND';
  else if (score >= 71) level = 'HOT';
  else if (score >= 51) level = 'WARM';
  else if (score >= 26) level = 'COOL';
  else level = 'CHILLY';

  // 급랭 위험(Cooling Down Alert): 1~2촌 핵심 인맥인데 90일 이상 미소통이거나 isStale인 경우
  const isCoolingDown = person.closeness <= 2 && (daysSince >= 90 || person.isStale);

  return {
    score,
    level,
    meta: TIE_STRENGTH_CONFIG[level],
    closenessScore,
    recencyScore,
    activityScore,
    strategicScore,
    alumniScore,
    daysSinceLastContact: daysSince,
    isCoolingDown
  };
}

/**
 * 관계 급랭 위험(Cooling Down Alert) 핵심 인맥 추출
 */
export function getCoolingDownAlerts(
  people: Person[],
  meetings: CalendarMeeting[] = []
): Array<{ person: Person; detail: TieStrengthDetail }> {
  return people
    .filter(p => p.closeness > 1) // 본인 제외
    .map(person => ({
      person,
      detail: calculateTieStrength(person, meetings)
    }))
    .filter(item => item.detail.isCoolingDown)
    .sort((a, b) => b.detail.daysSinceLastContact - a.detail.daysSinceLastContact);
}

/**
 * 산업군(Domain) x 5단계 온도 매트릭스 그리드 데이터 집계
 */
export interface IndustryHeatmapRow {
  domain: string;
  counts: Record<TieStrengthLevel, number>;
  total: number;
  avgScore: number;
}

export function buildIndustryHeatmapMatrix(
  people: Person[],
  meetings: CalendarMeeting[] = []
): IndustryHeatmapRow[] {
  const map = new Map<string, {
    counts: Record<TieStrengthLevel, number>;
    totalScore: number;
    totalCount: number;
  }>();

  for (const person of people) {
    if (person.closeness === 1) continue; // 본인 제외
    const domain = person.primaryDomain || '기타';
    if (!map.has(domain)) {
      map.set(domain, {
        counts: { CHILLY: 0, COOL: 0, WARM: 0, HOT: 0, DIAMOND: 0 },
        totalScore: 0,
        totalCount: 0
      });
    }

    const detail = calculateTieStrength(person, meetings);
    const entry = map.get(domain)!;
    entry.counts[detail.level] += 1;
    entry.totalScore += detail.score;
    entry.totalCount += 1;
  }

  const rows: IndustryHeatmapRow[] = [];
  map.forEach((value, domain) => {
    rows.push({
      domain,
      counts: value.counts,
      total: value.totalCount,
      avgScore: Math.round(value.totalScore / value.totalCount)
    });
  });

  return rows.sort((a, b) => b.total - a.total);
}
