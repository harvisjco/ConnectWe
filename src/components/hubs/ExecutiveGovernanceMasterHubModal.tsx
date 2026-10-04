import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import { GovernanceHubTab } from '../../types/masterHub';
import {
  ShieldAlert,
  Building2,
  Users,
  TrendingUp,
  X,
  Check,
  Copy,
  Sparkles,
  CheckCircle2,
  FileText,
  AlertTriangle,
  ArrowRight,
  Flame,
  Activity
} from 'lucide-react';
import {
  getOutsideDirectorMandates,
  getProxyVotingAgendaItems,
  getEquityHoldingChangeAlerts,
  getExecutiveTalentPool
} from '../../services/meetingGuardGovernanceService';
import {
  OutsideDirectorMandate,
  ProxyVotingAgendaItem,
  EquityHoldingChangeAlert,
  ExecutiveTalentCandidate,
  ExecutiveTalentTrack
} from '../../types/meetingGuardGovernance';
import { analyzeCrossBoardSynergy } from '../../services/crossBoardSynergyService';
import { getWeeklyBriefingSummary, generateWeeklyBriefingTextCopy } from '../../services/weeklyBriefingService';
import { calculateTieStrength } from '../../services/tieStrengthService';

export interface ExecutiveGovernanceMasterHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: GovernanceHubTab | string;
  people: Person[];
  selectedPerson?: Person | null;
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const ExecutiveGovernanceMasterHubModal: React.FC<ExecutiveGovernanceMasterHubModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'governance',
  people,
  selectedPerson: _selectedPerson,
  onSelectPerson,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<GovernanceHubTab>(
    (initialTab as GovernanceHubTab) || 'governance'
  );

  useEffect(() => {
    if (isOpen && initialTab) {
      if (['governance', 'disclosures', 'succession', 'intelligence'].includes(initialTab)) {
        setActiveTab(initialTab as GovernanceHubTab);
      }
    }
  }, [isOpen, initialTab]);

  // ESC 키 닫기 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 1. 거버넌스 탭 데이터 (상법 제542조의8 및 주총 의결권)
  const mandates: OutsideDirectorMandate[] = useMemo(() => getOutsideDirectorMandates(people), [people]);
  const agendas: ProxyVotingAgendaItem[] = useMemo(() => getProxyVotingAgendaItems(), []);

  // 2. DART 공시 & M&A 시너지 데이터
  const equityAlerts: EquityHoldingChangeAlert[] = useMemo(() => getEquityHoldingChangeAlerts(), []);
  const [targetCorp, setTargetCorp] = useState<string>('삼성전자');
  const crossBoardAnalysis = useMemo(() => analyzeCrossBoardSynergy(targetCorp, people), [targetCorp, people]);

  // 3. 최고경영진 승계 큐레이터 데이터
  const [selectedTrack, setSelectedTrack] = useState<ExecutiveTalentTrack | 'ALL'>('ALL');
  const talentPool: ExecutiveTalentCandidate[] = useMemo(() => getExecutiveTalentPool(people), [people]);
  const filteredTalent = useMemo(() => {
    if (selectedTrack === 'ALL') return talentPool;
    return talentPool.filter((t) => t.targetTrack === selectedTrack);
  }, [talentPool, selectedTrack]);
  const [copiedInviteIdx, setCopiedInviteIdx] = useState<number | null>(null);

  // 4. 전략 인텔리전스 & 히트맵 데이터
  const weeklyBriefSummary = useMemo(() => getWeeklyBriefingSummary(people, []), [people]);
  const weeklyBrief = useMemo(() => ({
    ...weeklyBriefSummary,
    period: weeklyBriefSummary.periodLabel,
    headline: `${weeklyBriefSummary.periodLabel} C-Level 전략 인텔리전스 (관리 인맥 ${weeklyBriefSummary.totalNetworkCount}명, DART 임원 ${weeklyBriefSummary.dartExecutiveCount}명)`,
    summaryPoints: [
      `총 관리 인맥 ${weeklyBriefSummary.totalNetworkCount}명 (DART 공시 임원 ${weeklyBriefSummary.dartExecutiveCount}명 상시 모니터링)`,
      weeklyBriefSummary.uncelebratedPromotions.length > 0
        ? `신규 영전 임원 ${weeklyBriefSummary.uncelebratedPromotions.length}명 축하 서신 대기 중`
        : '신규 미축하 공시 변동 없음',
      weeklyBriefSummary.cadenceAlerts.length > 0
        ? `소통 골든타임 관리 요망 VIP ${weeklyBriefSummary.cadenceAlerts.length}명 감지`
        : '골든타임 이탈 인맥 정상 관리 중',
      weeklyBriefSummary.upcomingMeetings.length > 0
        ? `이번 주 주요 외부 미팅 ${weeklyBriefSummary.upcomingMeetings.length}건 예정`
        : '예정된 외부 미팅 일정 없음'
    ],
    rawText: generateWeeklyBriefingTextCopy(weeklyBriefSummary, 'ConnectWe 전략실')
  }), [weeklyBriefSummary]);

  const tieStrengths = useMemo(() => {
    return people.slice(0, 6).map((p) => ({
      person: p,
      detail: calculateTieStrength(p, [])
    }));
  }, [people]);
  const [copiedBrief, setCopiedBrief] = useState(false);

  if (!isOpen) return null;

  // 초대장 클립보드 복사
  const handleCopyInvite = (invite: string, idx: number) => {
    navigator.clipboard.writeText(invite);
    setCopiedInviteIdx(idx);
    onShowToast('비공개 핵심 인재 티타임 초대 서신이 복사되었습니다.');
    setTimeout(() => setCopiedInviteIdx(null), 2500);
  };

  // 주간 브리프 복사
  const handleCopyBrief = () => {
    navigator.clipboard.writeText(weeklyBrief.rawText);
    setCopiedBrief(true);
    onShowToast('위클리 전략 브리프 전문이 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedBrief(false), 2500);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="governance-hub-title"
    >
      <div 
        className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hub Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-blue-900/10 via-indigo-900/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <Building2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="governance-hub-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  경영 거버넌스 & 전략 인텔리전스 마스터 허브
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                  C-Level SSOT
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                상법 제542조의8 사외이사 겸직 규제, 2026 주총 의결권, DART 지분 변동, 최고경영진 승계 큐레이션을 일원화하여 지원합니다.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Hub Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('governance')}
            data-testid="tab-hub-governance"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'governance'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>이사회 거버넌스 & 상법 규제</span>
          </button>

          <button
            onClick={() => setActiveTab('disclosures')}
            data-testid="tab-hub-disclosures"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'disclosures'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>DART 공시 & M&A 시너지</span>
          </button>

          <button
            onClick={() => setActiveTab('succession')}
            data-testid="tab-hub-succession"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'succession'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>최고경영진 승계 큐레이터</span>
          </button>

          <button
            onClick={() => setActiveTab('intelligence')}
            data-testid="tab-hub-intelligence"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'intelligence'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Activity className="w-4 h-4" />
            <span>전략 인텔리전스 & 히트맵</span>
          </button>
        </div>

        {/* Hub Body (Tab Panels) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: 이사회 거버넌스 & 상법 규제 */}
          {activeTab === 'governance' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 상법 제542조의8 겸직 규제 현황 카드 */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900 border border-blue-200/80 dark:border-blue-900/60 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-blue-600 text-white">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        상법 제542조의8 사외이사 겸직 규제 실시간 판별기
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        상장회사 사외이사는 2개 이상의 타 회사 사외이사·이사·집행임원을 겸직할 수 없습니다. (위반 시 법적 결격)
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    전체 모니터링 {mandates.length}명
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {mandates.map((m, idx) => {
                    const isViolation = m.regulatoryLimitStatus === 'VIOLATION_OVER_LIMIT';
                    const isWarning = m.regulatoryLimitStatus === 'WARNING_MAX_LIMIT';

                    return (
                      <div
                        key={m.personId || idx}
                        className={`p-4 rounded-xl bg-white dark:bg-slate-800/80 border ${
                          isViolation
                            ? 'border-rose-300 dark:border-rose-900/60 ring-2 ring-rose-500/20'
                            : isWarning
                            ? 'border-amber-300 dark:border-amber-800/60'
                            : 'border-slate-200/90 dark:border-slate-700/80'
                        } hover:shadow-md transition-all space-y-3`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">{m.personName}</span>
                              <span className="text-xs text-slate-500">({m.currentCompany})</span>
                            </div>
                            <span className="text-[11px] text-slate-400">{m.currentTitle}</span>
                          </div>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                              isViolation
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300'
                                : isWarning
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300'
                            }`}
                          >
                            {isViolation ? '⚠️ 2개사 초과 위반' : isWarning ? '한도 도달 (2개사)' : '규제 준수 (적정)'}
                          </span>
                        </div>

                        <div className="space-y-1.5 text-xs">
                          {m.activeDirectorships.map((d, dIdx) => (
                            <div key={dIdx} className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-[11px] flex justify-between">
                              <span className="font-semibold text-slate-800 dark:text-slate-200">{d.corpName} ({d.role})</span>
                              <span className="text-slate-400">{d.isListed ? '상장' : '비상장'} · ~{d.termEndDate}</span>
                            </div>
                          ))}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                          {m.conflictRiskNote || '법적 이해상충 위험 없음'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 2026 정기 주총 안건별 의결권 시뮬레이터 카드 */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        2026년 정기 주주총회 주요 의안 팩트체크 & 의결권 시뮬레이터
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        감사위원 분리선출 시 최대주주 및 특수관계인 합산 3% 의결권 제한 규정을 적용한 가결 가능성 분석
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/70 px-2.5 py-1 rounded-lg border border-indigo-200/60 dark:border-indigo-800/60">
                    상법 제409조 제2항 적용
                  </span>
                </div>

                <div className="space-y-3">
                  {agendas.map((a) => (
                    <div
                      key={a.id}
                      className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                            {a.corpName} ({a.stockCode})
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{a.agendaTitle}</h4>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          <strong>핵심 쟁점:</strong> {a.keyIssues}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          권고 근거: {a.rationaleSummary}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <span
                          className={`px-3 py-1.5 text-xs font-bold rounded-xl ${
                            a.governanceRecommendation === 'APPROVE'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                              : a.governanceRecommendation === 'CAUTION'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                          }`}
                        >
                          {a.governanceRecommendation === 'APPROVE' ? '찬성 권고' : a.governanceRecommendation === 'CAUTION' ? '신중 검토' : '반대 권고'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DART 공시 & M&A 시너지 */}
          {activeTab === 'disclosures' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 5% 대량보유 및 담보계약 공시 레이더 */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-rose-600 text-white">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        DART 5% 이상 대량보유 및 담보계약 공시 레이더
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        자본시장법 제147조(주식등의 대량보유상황보고) 기반 핵심 지분 변동 실시간 탐지
                      </p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                    최근 공시 {equityAlerts.length}건
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {equityAlerts.map((e) => (
                    <div
                      key={e.id}
                      className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2.5"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{e.corpName}</span>
                            <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">({e.personName})</span>
                          </div>
                          <span className="text-xs text-slate-500 font-medium">변동 유형: {e.changeType}</span>
                        </div>
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          {e.percentageHolding}% 보유
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white dark:bg-slate-800 text-xs space-y-1 border border-slate-200/60 dark:border-slate-700/60">
                        <div className="flex justify-between">
                          <span className="text-slate-500">변동 주식수:</span>
                          <span className="font-semibold">{e.sharesChanged.toLocaleString()}주</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">잔여 주식수:</span>
                          <span className="font-bold text-rose-600 dark:text-rose-400">{e.remainingShares.toLocaleString()}주</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">공시 접수일:</span>
                          <span className="font-mono text-slate-600 dark:text-slate-300">{e.filingDate}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300">{e.summaryNote}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 크로스보드 M&A 임원 교류 시너지 분석 카드 */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/60 via-purple-50/40 to-white dark:from-indigo-950/30 dark:via-purple-950/20 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        크로스보드(Cross-Board) 임원 교류 & M&A 시너지 레이더
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        이사회 임원 네트워크를 매개로 한 기업 간 전략적 파트너십 및 M&A 교류 가능성 도출
                      </p>
                    </div>
                  </div>

                  {/* 대상 기업 선택 */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-500">분석 기준사:</span>
                    <select
                      value={targetCorp}
                      onChange={(e) => setTargetCorp(e.target.value)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs cursor-pointer"
                    >
                      <option value="삼성전자">삼성전자</option>
                      <option value="SK하이닉스">SK하이닉스</option>
                      <option value="현대자동차">현대자동차</option>
                      <option value="LG에너지솔루션">LG에너지솔루션</option>
                      <option value="카카오">카카오</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white">{targetCorp} 연결망 분석</span>
                      <span className="text-xs px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold">
                        시너지 지수 {crossBoardAnalysis.synergyScore}점 ({crossBoardAnalysis.synergyGrade}등급)
                      </span>
                    </div>
                    <span className="text-xs text-slate-500">교류 파트너 {crossBoardAnalysis.overlays?.length || 0}개 접점</span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {crossBoardAnalysis.executiveSummary || '상호 이사회 임원진 간의 학연, 이전 재직(Alumni), 겸직 이력을 바탕으로 전략적 신뢰가 이미 형성되어 있습니다.'}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                    {(crossBoardAnalysis.overlays || []).slice(0, 3).map((item, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{item.personName} {item.personTitle}</span>
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">{item.closeness}점</span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">{item.connectionContext}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 최고경영진 승계 큐레이터 */}
          {activeTab === 'succession' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-600 text-white">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        C-Level 핵심 포지션 승계 풀 & 사외이사 후보 큐레이터
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        상법 결격 사유 사전 필터링 및 평판 검증이 완료된 검증된 리더 풀
                      </p>
                    </div>
                  </div>

                  {/* 트랙 필터 */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                    {(['ALL', 'CTO', 'CPO', 'CFO', 'AI_LAB_LEAD'] as const).map((track) => (
                      <button
                        key={track}
                        onClick={() => setSelectedTrack(track as any)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                          selectedTrack === track
                            ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {track === 'ALL' ? '전체' : track}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredTalent.map((t, idx) => (
                    <div
                      key={t.person.id || idx}
                      className="p-4 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-900 dark:text-white">{t.person.name}</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              {t.trackLabel}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {t.person.currentCompany} · {t.person.currentTitle}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                          {t.readinessLevel === 'READY_NOW' ? '즉시 승계 가능' : '1년 내 승계 풀'}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        {(t.person.skills || []).slice(0, 4).map((tag, tagIdx) => (
                          <span
                            key={tagIdx}
                            className="px-2 py-0.5 text-[11px] rounded-md bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800/80 p-2.5 rounded-lg border border-slate-200/60 dark:border-slate-700/60">
                        {t.verifiedProductionSuccess}
                      </p>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-800">
                        <button
                          onClick={() => handleCopyInvite(t.confidentialCoffeeInvite, idx)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                        >
                          {copiedInviteIdx === idx ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>서신 복사 완료</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>비공개 초대 서신 복사</span>
                            </>
                          )}
                        </button>

                        {onSelectPerson && (
                          <button
                            onClick={() => onSelectPerson(t.person)}
                            className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium inline-flex items-center gap-0.5 cursor-pointer"
                          >
                            <span>상세 인맥 카드</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 전략 인텔리전스 & 히트맵 */}
          {activeTab === 'intelligence' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 위클리 전략 인텔리전스 브리프 카드 */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-indigo-600 text-white">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        ConnectWe C-Level 위클리 전략 인텔리전스 1-Page 브리프
                      </h3>
                      <p className="text-xs text-slate-400">
                        {weeklyBrief.period} 경영진 핵심 동향 및 주요 관계 진척 요약
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyBrief}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer shrink-0"
                  >
                    {copiedBrief ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>브리프 전문 복사</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                  <h4 className="text-sm font-bold text-indigo-300">
                    {weeklyBrief.headline}
                  </h4>
                  <div className="space-y-1.5 text-xs text-slate-200">
                    {weeklyBrief.summaryPoints.map((point: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0 mt-1.5" />
                        <span>{point}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 관계 결속도 & 온도 히트맵 카드 */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800/60 border border-slate-200/90 dark:border-slate-700/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500 text-white">
                      <Flame className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        핵심 네트워크 결속도(Tie Strength) & 관계 온도 히트맵
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        미팅 빈도, 최근성, 맥락 깊이를 종합 반영한 실시간 관계 친밀도 매트릭스
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                  {tieStrengths.map((item, idx) => (
                    <div
                      key={item.person.id || idx}
                      className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{item.person.name}</span>
                        <span
                          className={`text-xs font-extrabold ${
                            item.detail.score >= 80
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : item.detail.score >= 50
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {item.detail.score}℃
                        </span>
                      </div>

                      <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.detail.score >= 80 ? 'bg-emerald-500' : item.detail.score >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                          }`}
                          style={{ width: `${Math.min(100, item.detail.score)}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-[11px] text-slate-500">
                        <span>{item.detail.meta.label}</span>
                        <span>최근 교류 {item.detail.daysSinceLastContact}일 전</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hub Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>상법 제542조 및 자본시장법 준수 실시간 팩트 가드 활성화됨</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-semibold transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
