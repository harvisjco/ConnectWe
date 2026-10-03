import { describe, it, expect, beforeEach } from 'vitest';
import { 
  loadVentureSignals, 
  filterVentureSignals, 
  generateFounderCheerMessage, 
  markSignalCongratulated, 
  getVentureSummaryStats,
  saveVentureSignals
} from '../ventureRadarService';
import { Person } from '../../types/network';

const MOCK_PEOPLE: Person[] = [
  {
    id: 'p-1',
    name: '윤서진',
    currentCompany: '하이퍼플로우 랩스',
    currentDepartment: '기술팀',
    currentTitle: 'Lead Builder',
    mobile: '010-1111-2222',
    email: 'seojin@hyperflow.ai',
    primaryDomain: '모바일 AI',
    skills: ['React', 'Next.js', 'PyTorch'],
    estimatedAgeGroup: '30s',
    isAgeEstimated: true,
    sourceType: 'SOURCE_DATA',
    closeness: 4,
    connectionChannel: 'manual',
    isStale: false,
    careers: [],
    academics: []
  },
  {
    id: 'p-2',
    name: '강민석',
    currentCompany: '핀스케일',
    currentDepartment: '엔지니어링',
    currentTitle: 'CTO',
    mobile: '010-3333-4444',
    email: 'minseok@finscale.io',
    primaryDomain: '핀테크 인프라',
    skills: ['Kubernetes', 'Go', 'AWS'],
    estimatedAgeGroup: '30s',
    isAgeEstimated: true,
    sourceType: 'SOURCE_DATA',
    closeness: 5,
    connectionChannel: 'manual',
    isStale: false,
    careers: [],
    academics: []
  }
];

describe('ventureRadarService - 초기 스타트업 창업 & 시드 펀딩 레이더 검증', () => {
  beforeEach(() => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      window.localStorage.clear();
    }
  });

  it('1. 인맥 데이터를 바탕으로 기본 창업 및 시드 시그널이 정상 생성/로드되어야 한다', () => {
    const signals = loadVentureSignals(MOCK_PEOPLE);
    expect(signals.length).toBeGreaterThanOrEqual(4);

    const stealth = signals.find(s => s.fundingStage === 'STEALTH');
    expect(stealth).toBeDefined();
    expect(stealth?.ventureRole).toBe('STEALTH_BUILDER');
    expect(stealth?.missingRoles.length).toBeGreaterThan(0);

    const seed = signals.find(s => s.fundingStage === 'SEED_TIPS');
    expect(seed).toBeDefined();
    expect(seed?.signalType).toBe('TIPS_SELECTION');
  });

  it('2. 스테이지별 필터링이 정확하게 작동해야 한다', () => {
    const signals = loadVentureSignals(MOCK_PEOPLE);

    const stealthOnly = filterVentureSignals(signals, 'STEALTH');
    expect(stealthOnly.every(s => s.fundingStage === 'STEALTH' || s.fundingStage === 'BOOTSTRAPPED')).toBe(true);

    const seedOnly = filterVentureSignals(signals, 'SEED_TIPS');
    expect(seedOnly.every(s => s.fundingStage === 'PRE_SEED' || s.fundingStage === 'SEED_TIPS')).toBe(true);

    const seriesAOnly = filterVentureSignals(signals, 'SERIES_A');
    expect(seriesAOnly.every(s => s.fundingStage === 'SERIES_A')).toBe(true);
  });

  it('3. 검색어(이름, 회사명, 기술) 필터링이 정상적으로 동작해야 한다', () => {
    const signals = loadVentureSignals(MOCK_PEOPLE);

    const searchedByName = filterVentureSignals(signals, 'ALL', '윤서진');
    expect(searchedByName.length).toBe(1);
    expect(searchedByName[0].personName).toBe('윤서진');

    const searchedByTech = filterVentureSignals(signals, 'ALL', '핀테크');
    expect(searchedByTech.length).toBeGreaterThanOrEqual(1);
    expect(searchedByTech[0].techFocus).toContain('금융');
  });

  it('4. 창업자 응원 및 시드 티타임 서신이 정중하고 격조 있는 어휘로 합성되어야 한다', () => {
    const signals = loadVentureSignals(MOCK_PEOPLE);
    const targetSignal = signals.find(s => s.fundingStage === 'SEED_TIPS')!;

    const letter = generateFounderCheerMessage(targetSignal, '김파트너');
    expect(letter).toContain(targetSignal.personName);
    expect(letter).toContain(targetSignal.companyName);
    expect(letter).toContain('팀을 빌딩하고');
    expect(letter).toContain('모닝 커피');
    expect(letter).toContain('김파트너 드림');
  });

  it('5. 응원 완료 상태(markSignalCongratulated) 변경 및 통계 계산이 정상 수행되어야 한다', () => {
    const signals = loadVentureSignals(MOCK_PEOPLE);
    const target = signals[0];

    const updated = markSignalCongratulated(target.id, signals);
    const changed = updated.find(s => s.id === target.id);
    expect(changed?.isCongratulated).toBe(true);
    expect(changed?.congratulatedAt).toBeDefined();

    const stats = getVentureSummaryStats(updated);
    expect(stats.totalSignals).toBe(updated.length);
    expect(stats.congratulatedCount).toBeGreaterThanOrEqual(1);
  });

  it('6. saveVentureSignals 함수가 로컬스토리지에 정상적으로 데이터를 보존해야 한다', () => {
    const signals = loadVentureSignals(MOCK_PEOPLE);
    signals[0].pitchSummary = '수정된 피치 서머리';
    saveVentureSignals(signals);

    const reloaded = loadVentureSignals([]);
    expect(reloaded[0].pitchSummary).toBe('수정된 피치 서머리');
  });
});
