import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { 
  analyzeCrossBoardSynergy, 
  CrossBoardSynergyReport 
} from '../../services/crossBoardSynergyService';
import { getAvailableCorporations } from '../../services/orgChartEngine';
import { 
  Building2, Sparkles, Network, ArrowRight, 
  ShieldCheck, Copy, Check, X, 
  GitMerge, ChevronRight,
  TrendingUp, Layers, Coffee
} from 'lucide-react';

interface CrossBoardSynergyModalProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  initialTargetCorp?: string;
  onSelectPerson?: (person: Person) => void;
  onOpenTeaTimeModal?: (targetPerson?: Person) => void;
  onShowToast: (message: string, type?: 'success' | 'info' | 'warning' | 'error') => void;
}

export const CrossBoardSynergyModal: React.FC<CrossBoardSynergyModalProps> = ({
  isOpen,
  onClose,
  people,
  initialTargetCorp = '삼성전자',
  onSelectPerson,
  onOpenTeaTimeModal,
  onShowToast
}) => {
  const corporations = useMemo(() => getAvailableCorporations(), []);
  const [selectedCorp, setSelectedCorp] = useState<string>(initialTargetCorp);
  const [activeTab, setActiveTab] = useState<'overlays' | 'routes' | 'themes' | 'brief'>('overlays');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // 대상 기업 변경 시 시너지 분석 리포트 재산출
  const report: CrossBoardSynergyReport = useMemo(() => {
    return analyzeCrossBoardSynergy(selectedCorp, people, '(주)ConnectWe');
  }, [selectedCorp, people]);

  // 전역 ESC 키 닫기 리스너
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 1-Page 브리프 복사
  const handleCopyBrief = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(report.onePageBriefText).catch(() => {});
      }
    } catch {
      // headless fallback
    }

    setIsCopied(true);
    onShowToast(`[${report.targetCorpName}] C-Level 전략 시너지 1-Page 브리프가 클립보드에 복사되었습니다.`, 'success');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 등급별 뱃지 스타일
  const getGradeBadge = (grade: string) => {
    switch (grade) {
      case 'S':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-emerald-500/20';
      case 'A':
        return 'bg-gradient-to-r from-indigo-500 to-blue-600 text-white shadow-indigo-500/20';
      case 'B':
        return 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-amber-500/20';
      default:
        return 'bg-slate-500 text-white';
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
              <GitMerge className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span>전략적 M&A & 크로스 보드 시뮬레이터</span>
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                  CSO/CEO Radar
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                기업 간 이사회·사외이사·알럼나이 중복망 분석 및 3대 신뢰 가교 경로 도출
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 양사 대조 & 대상 기업 셀렉터 바 */}
        <div className="px-6 py-3.5 bg-gradient-to-r from-slate-100/80 via-indigo-50/50 to-slate-100/80 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-950 border-b border-slate-200/60 dark:border-slate-800 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{report.ourCorpName}</span>
                <span className="text-[10px] text-slate-400">(자사)</span>
              </div>

              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300">
                <ArrowRight className="w-3.5 h-3.5" />
              </div>

              <div className="flex items-center gap-1.5">
                <select
                  value={selectedCorp}
                  onChange={e => setSelectedCorp(e.target.value)}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-indigo-300 dark:border-indigo-700 text-xs font-bold text-indigo-900 dark:text-indigo-200 shadow-2xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {corporations.map(c => (
                    <option key={c.corpCode} value={c.corpName}>
                      {c.corpName} (공시 임원 {c.count}명)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 시너지 스코어 & 등급 뱃지 */}
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 px-3 py-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <span className="text-[11px] text-slate-400">결합 시너지 지수</span>
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 font-mono">
                  {report.synergyScore}점
                </span>
              </div>

              <div className={`px-2.5 py-1 rounded-xl text-xs font-bold shadow-xs ${getGradeBadge(report.synergyGrade)}`}>
                {report.synergyGrade}등급
              </div>
            </div>
          </div>
        </div>

        {/* 4대 탭 네비게이션 */}
        <div className="px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-1 sm:gap-2 overflow-x-auto shrink-0">
          <button
            onClick={() => setActiveTab('overlays')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'overlays'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>크로스 보드 접점 ({report.totalOverlaysCount}건)</span>
          </button>

          <button
            onClick={() => setActiveTab('routes')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'routes'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>3대 신뢰 가교 경로</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'themes'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>밸류체인 결합 화두 (3)</span>
          </button>

          <button
            onClick={() => setActiveTab('brief')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'brief'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>1-Page 전략 브리프</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* Tab 1: 크로스 보드 접점 오버레이 */}
          {activeTab === 'overlays' && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {report.executiveSummary}
                </p>
              </div>

              {report.overlays.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                  <Network className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-xs font-medium text-slate-500">현재 감지된 직접 교차 임원망이 없습니다.</p>
                  <p className="text-[11px] text-slate-400 mt-1">알럼나이 브릿지 패스나 투자 파트너 가교 탭을 활용하십시오.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.overlays.map(item => (
                    <div 
                      key={item.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/70 hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${item.badgeStyle}`}>
                            {item.typeLabel}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {item.closeness === 1 ? '본인' : `${item.closeness}촌 네트워크`}
                          </span>
                        </div>

                        <div className="flex items-baseline gap-2">
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                            {item.personName}
                          </h4>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {item.personTitle}
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                          {item.connectionContext}
                        </p>

                        {/* 상법 제542조 겸직 한도 컴플라이언스 인디케이터 */}
                        {item.concurrentPublicCorpCount !== undefined && item.concurrentPublicCorpCount > 0 && (
                          <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                            {item.isCommercialLawCompliant ? (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[10px] font-semibold">
                                <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                                <span>상법 겸직 한도 준수 (상장사 {item.concurrentPublicCorpCount}개사 사외이사)</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300/80 dark:border-amber-700 text-[10px] font-semibold" title={item.complianceWarning}>
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                                <span>⚠️ 법적 겸직 한도 확인 필요 (상장사 {item.concurrentPublicCorpCount}개사 초과)</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-700/60">
                        {item.matchedPerson && onSelectPerson && (
                          <button
                            type="button"
                            onClick={() => onSelectPerson(item.matchedPerson!)}
                            className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                          >
                            <span>프로필 열기</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}
                        {item.matchedPerson && onOpenTeaTimeModal && (
                          <button
                            type="button"
                            onClick={() => onOpenTeaTimeModal(item.matchedPerson)}
                            className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 font-medium flex items-center gap-1 ml-auto"
                          >
                            <Coffee className="w-3 h-3" />
                            <span>티타임 조율</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: 3대 신뢰 가교 경로 */}
          {activeTab === 'routes' && (
            <div className="space-y-4">
              <div className="space-y-3">
                {report.threeTrustRoutes.map((route, idx) => (
                  <div 
                    key={route.id}
                    className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-2xs space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-bold text-xs flex items-center justify-center font-mono">
                          0{idx + 1}
                        </span>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                            {route.routeName}
                          </h4>
                          <p className="text-[11px] text-slate-500">
                            핵심 키맨: <span className="font-semibold text-slate-800 dark:text-slate-200">{route.keyPerson}</span> ({route.keyPersonRole})
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">신뢰 지수</span>
                        <div className="w-24 bg-slate-100 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                          <div 
                            className="bg-indigo-600 h-full rounded-full transition-all"
                            style={{ width: `${route.trustScore}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                          {route.trustScore}%
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <span className="block text-[10px] font-semibold text-slate-400 mb-1">
                          권고 접근 전략 (Approach Strategy)
                        </span>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed text-[11px]">
                          {route.approachStrategy}
                        </p>
                      </div>

                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800">
                        <span className="block text-[10px] font-semibold text-slate-400 mb-1">
                          자연스러운 오프닝 화두 (Icebreaker Topic)
                        </span>
                        <p className="text-indigo-900 dark:text-indigo-300 leading-relaxed text-[11px] font-medium">
                          "{route.icebreakerTopic}"
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tab 3: 밸류체인 결합 화두 */}
          {activeTab === 'themes' && (
            <div className="space-y-3">
              {report.synergyThemes.map(theme => (
                <div 
                  key={theme.id}
                  className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {theme.category}
                    </span>
                    <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5" />
                      <span>기대 임팩트</span>
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {theme.title}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {theme.description}
                  </p>

                  <div className="p-2 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-900/50 text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                    ⚡ {theme.expectedImpact}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tab 4: 1-Page 전략 브리프 */}
          {activeTab === 'brief' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  C-Level 전략 회의 즉시 보고용 1-Page 서신
                </span>
                <button
                  type="button"
                  onClick={handleCopyBrief}
                  className="py-1 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{isCopied ? '복사 완료!' : '1-Page 브리프 복사'}</span>
                </button>
              </div>

              <textarea
                readOnly
                rows={12}
                value={report.onePageBriefText}
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 font-mono text-xs leading-relaxed focus:outline-none select-all"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            DART 공시 8,500+ 기업 실공시 팩트 기반 · C-Level 거버넌스 안심 시뮬레이션
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-1.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleCopyBrief}
              className="py-1.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 transition-all cursor-pointer"
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? '복사됨' : '전략 브리프 복사'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
