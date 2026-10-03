import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { 
  EarlyStageVentureSignal, 
  FundingStage 
} from '../../types/ventureRadar';
import { 
  loadVentureSignals, 
  filterVentureSignals, 
  generateFounderCheerMessage, 
  markSignalCongratulated, 
  getVentureSummaryStats 
} from '../../services/ventureRadarService';
import { SQUAD_ROLES } from '../../services/projectSquadBuilderService';
import { 
  X, Rocket, Sparkles, Send, Users, Check, 
  Search, ShieldCheck, Calendar, 
  Zap, Award
} from 'lucide-react';

interface EarlyStageVentureRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  onOpenSquadBuilder?: (signal: EarlyStageVentureSignal) => void;
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const EarlyStageVentureRadarModal: React.FC<EarlyStageVentureRadarModalProps> = ({
  isOpen,
  onClose,
  people,
  onOpenSquadBuilder,
  onSelectPerson,
  onShowToast
}) => {
  const [signals, setSignals] = useState<EarlyStageVentureSignal[]>(() => loadVentureSignals(people));
  const [stageFilter, setStageFilter] = useState<'ALL' | 'STEALTH' | 'SEED_TIPS' | 'SERIES_A'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 통계 산출
  const stats = useMemo(() => getVentureSummaryStats(signals), [signals]);

  // 필터링된 시그널
  const filteredSignals = useMemo(() => {
    return filterVentureSignals(signals, stageFilter, searchQuery);
  }, [signals, stageFilter, searchQuery]);

  if (!isOpen) return null;

  // 응원 서신 복사 핸들러
  const handleCopyCheerLetter = (signal: EarlyStageVentureSignal) => {
    const letter = generateFounderCheerMessage(signal, '동료');
    navigator.clipboard.writeText(letter).then(() => {
      setCopiedId(signal.id);
      const updated = markSignalCongratulated(signal.id, signals);
      setSignals(updated);
      onShowToast(`[${signal.personName}] 창업자 응원 서신이 복사되었습니다.`);
      setTimeout(() => setCopiedId(null), 2500);
    });
  };

  // 파운딩 스쿼드 빌더로 연결
  const handleLaunchSquadBuilder = (signal: EarlyStageVentureSignal) => {
    onClose();
    if (onOpenSquadBuilder) {
      onOpenSquadBuilder(signal);
    }
  };

  const getStageBadge = (stage: FundingStage) => {
    switch (stage) {
      case 'STEALTH':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">🕵️ 스텔스 모드</span>;
      case 'BOOTSTRAPPED':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">⚡ 자체 빌딩</span>;
      case 'PRE_SEED':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">🌱 프리시드</span>;
      case 'SEED_TIPS':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-purple-50 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">🚀 시드 & TIPS 선정</span>;
      case 'SERIES_A':
        return <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">🏆 시리즈 A</span>;
    }
  };

  const getRoleBadge = (role: EarlyStageVentureSignal['ventureRole']) => {
    switch (role) {
      case 'FOUNDER_CEO':
        return '대표이사 / Founder';
      case 'CO_FOUNDER_CTO':
        return 'Co-founder & CTO';
      case 'FOUNDING_MEMBER':
        return '파운딩 멤버';
      case 'STEALTH_BUILDER':
        return '스텔스 빌더';
    }
  };

  const getSignalSourceLabel = (type: EarlyStageVentureSignal['signalType']) => {
    switch (type) {
      case 'CORP_REGISTRATION':
        return '신규 법인 설립';
      case 'TIPS_SELECTION':
        return '팁스(TIPS) R&D 선정';
      case 'PRE_SEED_ROUND':
        return '투자 유치 공시';
      case 'GITHUB_ORG_LAUNCH':
        return '오픈소스/깃허브 공개';
      case 'PRODUCT_HUNT_TOP':
        return '프로덕트헌트 런칭';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div 
        data-testid="early-stage-venture-radar-modal"
        className="w-full max-w-5xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
      >
        {/* 1. 모달 상단 헤더 */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <Rocket className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  초기 스타트업 창업 & 시드 펀딩 레이더
                </h2>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                  파운더스 클럽
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                동문·동료의 스텔스 창업과 시드 펀딩 유치 신호를 조기 감지하고 파운딩 스쿼드를 지원합니다
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            data-testid="close-venture-radar"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. 퀵 메트릭 & 탭/검색 툴바 */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shrink-0">
          {/* 퀵 메트릭 칩 */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 shrink-0">
              <Rocket className="w-3.5 h-3.5 text-indigo-500" />
              감지된 창업 시그널: <strong className="text-slate-900 dark:text-white">{stats.totalSignals}</strong>팀
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              스텔스 모드: <strong className="text-slate-900 dark:text-white">{stats.stealthCount}</strong>팀
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-semibold flex items-center gap-1.5 shrink-0">
              <Award className="w-3.5 h-3.5 text-purple-500" />
              시드 & TIPS 선정: <strong className="text-purple-900 dark:text-purple-200">{stats.seedTipsCount}</strong>팀
            </span>
            <span className="px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1.5 shrink-0">
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              응원 전달 완료: <strong className="text-emerald-900 dark:text-emerald-200">{stats.congratulatedCount}</strong>건
            </span>
          </div>

          {/* 스테이지 세그먼트 탭 & 검색 인풋 */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                data-testid="tab-stage-all"
                onClick={() => setStageFilter('ALL')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  stageFilter === 'ALL'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                전체 ({signals.length})
              </button>
              <button
                type="button"
                data-testid="tab-stage-stealth"
                onClick={() => setStageFilter('STEALTH')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  stageFilter === 'STEALTH'
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                스텔스 ({stats.stealthCount})
              </button>
              <button
                type="button"
                data-testid="tab-stage-seed"
                onClick={() => setStageFilter('SEED_TIPS')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  stageFilter === 'SEED_TIPS'
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                시드 & TIPS ({stats.seedTipsCount})
              </button>
              <button
                type="button"
                data-testid="tab-stage-series"
                onClick={() => setStageFilter('SERIES_A')}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  stageFilter === 'SERIES_A'
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-amber-300 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                시리즈 A ({stats.seriesACount})
              </button>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                data-testid="venture-search-input"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="창업자 성명, 회사명, 기술 검색..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* 3. 창업자 카드 그리드 리스트 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {filteredSignals.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              해당 조건에 부합하는 초기 스타트업 창업 신호가 없습니다.
            </div>
          ) : (
            filteredSignals.map(signal => {
              const matchedPerson = people.find(p => p.id === signal.personId || p.name === signal.personName);

              return (
                <div
                  key={signal.id}
                  data-testid={`venture-card-${signal.id}`}
                  className="p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all shadow-sm space-y-3.5"
                >
                  {/* 상단: 프로필 & 스테이지 뱃지 & 액션 버튼 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-800 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                        {signal.personName.slice(0, 2)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span 
                            onClick={() => matchedPerson && onSelectPerson?.(matchedPerson)}
                            className="font-bold text-base text-slate-900 dark:text-white hover:underline cursor-pointer"
                          >
                            {signal.personName}
                          </span>
                          <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                            {getRoleBadge(signal.ventureRole)}
                          </span>
                          {getStageBadge(signal.fundingStage)}
                          {signal.isCongratulated && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                              <Check className="w-3 h-3" /> 응원 전달됨
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {signal.companyName}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Zap className="w-3 h-3 text-amber-500" />
                            {getSignalSourceLabel(signal.signalType)}
                          </span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {signal.detectedDate} 감지
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 액션 버튼 그룹 */}
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        data-testid={`cheer-btn-${signal.id}`}
                        onClick={() => handleCopyCheerLetter(signal)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 rounded-xl transition-colors cursor-pointer"
                        title="창업 응원 및 모닝 커피챗 제안 서신 복사"
                      >
                        {copiedId === signal.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">서신 복사됨</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>응원 & 티타임 서신</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        data-testid={`squad-btn-${signal.id}`}
                        onClick={() => handleLaunchSquadBuilder(signal)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                        title="창업팀 결원 롤 충원을 위한 스쿼드 빌더 실행"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>파운딩 스쿼드 빌딩</span>
                      </button>
                    </div>
                  </div>

                  {/* 중단: 프로덕트 비전 & 기술 분야 */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-700/60 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-400">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{signal.techFocus}</span>
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                      "{signal.pitchSummary}"
                    </p>
                  </div>

                  {/* 하단: 창업팀 결원 롤(Missing Roles) 뱃지 안내 */}
                  {signal.missingRoles.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap text-xs pt-1">
                      <span className="text-slate-500 dark:text-slate-400 font-medium text-[11px]">
                        🚨 창업팀 핵심 결원(Missing Skill):
                      </span>
                      {signal.missingRoles.map(roleId => (
                        <span
                          key={roleId}
                          className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40"
                        >
                          + {SQUAD_ROLES[roleId]?.label || roleId}
                        </span>
                      ))}
                      <span className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
                        (우측 [파운딩 스쿼드 빌딩]에서 내 인맥 즉시 추천 가능)
                      </span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* 4. 하단 요약 바 & 닫기 버튼 */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>상장사 거버넌스 외 실제 벤처/스타트업 현업 빌더 데이터 기준입니다.</span>
          </div>

          <button
            onClick={onClose}
            data-testid="complete-venture-radar"
            className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-100 dark:text-slate-900 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
