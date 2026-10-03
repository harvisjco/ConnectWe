import { Person } from '../types/network';
import { EarlyStageVentureSignal, VentureSummaryStats } from '../types/ventureRadar';

const STORAGE_VENTURE_KEY = 'connectwe_venture_signals_v1';

/**
 * 기본 시그널 목 데이터 생성 (인맥 데이터와 결합)
 */
function createDefaultSignals(people: Person[]): EarlyStageVentureSignal[] {
  const findPerson = (nameKeyword: string): Person | undefined => {
    return people.find(p => p.name.includes(nameKeyword));
  };

  const p1 = findPerson('서진') || people[0];
  const p2 = findPerson('민석') || people[1];
  const p3 = findPerson('수민') || people[2];
  const p4 = findPerson('지훈') || people[3];

  return [
    {
      id: 'vsig-1',
      personId: p1?.id || 'p-stealth-1',
      personName: p1?.name || '윤서진',
      companyName: '하이퍼플로우 랩스 (HyperFlow Labs)',
      ventureRole: 'STEALTH_BUILDER',
      fundingStage: 'STEALTH',
      signalType: 'GITHUB_ORG_LAUNCH',
      techFocus: '온디바이스 LLM & 모바일 에이전트 워크플로우',
      pitchSummary: '스마트폰 로컬 환경에서 지연 없이 구동되는 개인화 AI 워크플로우 엔진',
      missingRoles: ['TECH_LEAD_AI', 'BACKEND_INFRA'],
      detectedDate: '2026-03-28',
      isCongratulated: false
    },
    {
      id: 'vsig-2',
      personId: p2?.id || 'p-seed-2',
      personName: p2?.name || '강민석',
      companyName: '핀스케일 (FinScale Technologies)',
      ventureRole: 'CO_FOUNDER_CTO',
      fundingStage: 'SEED_TIPS',
      signalType: 'TIPS_SELECTION',
      techFocus: '차세대 클라우드 네이티브 핀테크 금융 트랜잭션 코어',
      pitchSummary: '분산 원장 및 실시간 대용량 금융 결제 검증 아키텍처 (팁스 TIPS R&D 선정)',
      missingRoles: ['FRONTEND_DEV', 'PRODUCT_DESIGN'],
      detectedDate: '2026-03-15',
      isCongratulated: false
    },
    {
      id: 'vsig-3',
      personId: p3?.id || 'p-seed-3',
      personName: p3?.name || '이수민',
      companyName: '넥스트콜랩 (NextCollab AI)',
      ventureRole: 'FOUNDER_CEO',
      fundingStage: 'PRE_SEED',
      signalType: 'CORP_REGISTRATION',
      techFocus: 'B2B 엔터프라이즈 AI 지식 그래프 & 자동 문서화',
      pitchSummary: '사내 슬랙과 노션 데이터를 실시간 인덱싱하여 프로젝트 문서를 자동 갱신하는 B2B SaaS',
      missingRoles: ['TECH_LEAD_AI', 'BUSINESS_GROWTH'],
      detectedDate: '2026-03-22',
      isCongratulated: true,
      congratulatedAt: '2026-03-23T10:30:00Z'
    },
    {
      id: 'vsig-4',
      personId: p4?.id || 'p-series-4',
      personName: p4?.name || '박지훈',
      companyName: '딥메디스캔 (DeepMediScan)',
      ventureRole: 'FOUNDING_MEMBER',
      fundingStage: 'SERIES_A',
      signalType: 'PRE_SEED_ROUND',
      techFocus: '엣지 AI 기반 실시간 의료 영상 판독 솔루션',
      pitchSummary: '응급실 의료진을 위한 1초 내 골절 및 뇌출혈 조기 판별 엣지 AI 디바이스',
      missingRoles: ['PRODUCT_LEAD', 'BACKEND_INFRA'],
      detectedDate: '2026-02-28',
      isCongratulated: false
    }
  ];
}

let inMemorySignals: EarlyStageVentureSignal[] | null = null;

/**
 * 초기 스타트업 창업 및 시드 펀딩 시그널 로드 (스토리지 캐시 영속화)
 */
export function loadVentureSignals(people: Person[]): EarlyStageVentureSignal[] {
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      const raw = window.localStorage.getItem(STORAGE_VENTURE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          inMemorySignals = parsed;
          return parsed;
        }
      }
    } catch {
      // 파싱 실패 시 폴백
    }
  }

  if (inMemorySignals && inMemorySignals.length > 0) {
    return inMemorySignals;
  }

  const defaults = createDefaultSignals(people);
  inMemorySignals = defaults;
  saveVentureSignals(defaults);
  return defaults;
}

/**
 * 시그널 저장
 */
export function saveVentureSignals(signals: EarlyStageVentureSignal[]): void {
  inMemorySignals = signals;
  if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_VENTURE_KEY, JSON.stringify(signals));
    } catch {
      // 로컬 스토리지 에러 방어
    }
  }
}

/**
 * 스테이지 및 검색어 필터링
 */
export function filterVentureSignals(
  signals: EarlyStageVentureSignal[],
  stageFilter: 'ALL' | 'STEALTH' | 'SEED_TIPS' | 'SERIES_A',
  searchQuery: string = ''
): EarlyStageVentureSignal[] {
  return signals.filter(signal => {
    // 스테이지 필터
    if (stageFilter === 'STEALTH') {
      if (signal.fundingStage !== 'STEALTH' && signal.fundingStage !== 'BOOTSTRAPPED') {
        return false;
      }
    } else if (stageFilter === 'SEED_TIPS') {
      if (signal.fundingStage !== 'PRE_SEED' && signal.fundingStage !== 'SEED_TIPS') {
        return false;
      }
    } else if (stageFilter === 'SERIES_A') {
      if (signal.fundingStage !== 'SERIES_A') {
        return false;
      }
    }

    // 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = signal.personName.toLowerCase().includes(q);
      const matchCompany = signal.companyName.toLowerCase().includes(q);
      const matchTech = signal.techFocus.toLowerCase().includes(q);
      const matchPitch = signal.pitchSummary.toLowerCase().includes(q);
      if (!matchName && !matchCompany && !matchTech && !matchPitch) {
        return false;
      }
    }

    return true;
  });
}

/**
 * 창업자 응원 및 시드 캐주얼 티타임 서신 자동 합성
 */
export function generateFounderCheerMessage(
  signal: EarlyStageVentureSignal,
  senderName: string = '동료'
): string {
  const roleLabel = signal.ventureRole === 'FOUNDER_CEO' 
    ? '대표님' 
    : signal.ventureRole === 'CO_FOUNDER_CTO'
    ? 'CTO님'
    : '님';

  const stageLabel = signal.fundingStage === 'STEALTH'
    ? '스텔스 모드 프로젝트 빌딩'
    : signal.fundingStage === 'SEED_TIPS'
    ? '팁스(TIPS) 선정 및 시드 라운드 유치'
    : signal.fundingStage === 'PRE_SEED'
    ? '프리시드 펀딩 및 법인 설립'
    : '시리즈 A 투자 유치 및 스케일업';

  return `안녕하세요, ${signal.personName} ${roleLabel}! ${senderName}입니다.

새롭게 시작하신 [${signal.companyName}]의 도전 소식을 전해 듣고 진심으로 가슴이 뛰어 이렇게 응원의 연락을 드립니다.

특히 "${signal.pitchSummary}" 비전과 ${signal.techFocus} 분야에서의 담대한 혁신에 깊은 경의를 표합니다. 이번 ${stageLabel} 소식 또한 진심으로 축하드립니다!

초기 팀을 빌딩하고 프로덕트를 고도화하시는 여정이 얼마나 치열하고 값진지 잘 알고 있습니다. 혹시 주변에 도움이 될 만한 핵심 실무 동료 추천이나 가벼운 의견 교환이 필요하시다면 언제든 편하게 말씀해 주세요.

바쁘신 일정 중에 부담 갖지 마시고, 근처에 계실 때 가볍게 따뜻한 모닝 커피나 차 한잔 모시고 싶습니다. 

새로운 시작을 진심으로 뜨겁게 응원합니다. 화이팅입니다!

- ${senderName} 드림`;
}

/**
 * 특정 시그널의 응원 완료 상태 토글/설정
 */
export function markSignalCongratulated(
  signalId: string,
  signals: EarlyStageVentureSignal[]
): EarlyStageVentureSignal[] {
  const updated = signals.map(s => {
    if (s.id === signalId) {
      return {
        ...s,
        isCongratulated: true,
        congratulatedAt: new Date().toISOString()
      };
    }
    return s;
  });

  saveVentureSignals(updated);
  return updated;
}

/**
 * 초기 창업 요약 통계 산출
 */
export function getVentureSummaryStats(signals: EarlyStageVentureSignal[]): VentureSummaryStats {
  let stealthCount = 0;
  let seedTipsCount = 0;
  let seriesACount = 0;
  let congratulatedCount = 0;

  for (const s of signals) {
    if (s.fundingStage === 'STEALTH' || s.fundingStage === 'BOOTSTRAPPED') {
      stealthCount++;
    } else if (s.fundingStage === 'PRE_SEED' || s.fundingStage === 'SEED_TIPS') {
      seedTipsCount++;
    } else if (s.fundingStage === 'SERIES_A') {
      seriesACount++;
    }

    if (s.isCongratulated) {
      congratulatedCount++;
    }
  }

  return {
    totalSignals: signals.length,
    stealthCount,
    seedTipsCount,
    seriesACount,
    congratulatedCount
  };
}
