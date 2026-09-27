import React, { useMemo, useState } from 'react';
import { Person } from '../../types/network';
import { CalendarMeeting } from '../../services/calendarRadarService';
import { loadDealsFromStorage } from '../../services/dealPipelineService';
import { 
  getWeeklyBriefingSummary, 
  generateWeeklyBriefingTextCopy 
} from '../../services/weeklyBriefingService';
import { 
  X, Printer, Copy, Check, ShieldCheck, 
  Calendar, Award, Clock, Briefcase
} from 'lucide-react';

interface ExecutiveWeeklyBriefModalProps {
  people: Person[];
  meetings?: CalendarMeeting[];
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const ExecutiveWeeklyBriefModal: React.FC<ExecutiveWeeklyBriefModalProps> = ({
  people,
  meetings = [],
  onClose,
  onSelectPerson,
  onShowToast
}) => {
  const [isCopied, setIsCopied] = useState(false);

  // 딜 목록 및 주간 브리핑 집계
  const deals = useMemo(() => loadDealsFromStorage(people), [people]);
  const summary = useMemo(() => {
    return getWeeklyBriefingSummary(people, meetings, deals);
  }, [people, meetings, deals]);

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const text = generateWeeklyBriefingTextCopy(summary, '홍길동');
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      onShowToast('경영진 공유용 주간 텍스트 요약본이 클립보드에 복사되었습니다.');
      setTimeout(() => setIsCopied(false), 2500);
    }).catch(() => {
      onShowToast('클립보드 복사에 실패했습니다.');
    });
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 print:p-0 print:bg-white print:static print:backdrop-blur-none"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh] animate-in zoom-in-95 duration-200 print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none"
      >
        {/* Modal Controls Bar (인쇄 시 숨김) */}
        <div className="p-4 sm:px-6 sm:py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0 print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>C-Level 월요 전략 인텔리전스 1-Page 리포트</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer ${
                isCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
              }`}
            >
              {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{isCopied ? '복사 완료' : '텍스트 요약 복사'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-indigo-300" />
              <span>A4 인쇄 / PDF 저장</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable 1-Page Document Container */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 flex-1 bg-white print:p-0 print:overflow-visible">
          
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-widest text-indigo-600 font-mono">
                ConnectWe Executive Intelligence Brief
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight mt-0.5">
                {summary.periodLabel} C-Level 전략 인텔리전스 주간 리포트
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                DART 공시 팩트 기반 인맥 지각변동 · 주간 미팅 파이프라인 · 소통 골든타임 종합 브리핑
              </p>
            </div>

            <div className="text-left sm:text-right text-[11px] text-slate-500 font-mono shrink-0">
              <div>발행일자: <strong>{summary.generatedDate}</strong></div>
              <div className="text-emerald-700 font-semibold flex items-center gap-1 sm:justify-end mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>DART Fact Verified</span>
              </div>
            </div>
          </div>

          {/* Key Stat Cards (3열) */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 print:border-slate-300">
              <div className="text-[11px] font-medium text-slate-500">총 관리 네트워크</div>
              <div className="text-lg sm:text-xl font-black text-slate-900 font-mono mt-0.5">
                {summary.totalNetworkCount}명
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">암호화 주소록 동기화</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 print:border-emerald-300">
              <div className="text-[11px] font-semibold text-emerald-800">DART 공시 임원</div>
              <div className="text-lg sm:text-xl font-black text-emerald-900 font-mono mt-0.5">
                {summary.dartExecutiveCount}명
              </div>
              <div className="text-[10px] text-emerald-700 mt-0.5">상장사 공식 공시 일치</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-200/80 print:border-indigo-300">
              <div className="text-[11px] font-semibold text-indigo-800">주요 상주 거점</div>
              <div className="text-xs sm:text-sm font-bold text-indigo-950 truncate mt-1">
                {summary.topClusterDistribution.map(c => `${c.name}(${c.count})`).join(', ') || '전국 균등'}
              </div>
              <div className="text-[10px] text-indigo-700 mt-0.5">외근 동선 연계 최적화</div>
            </div>
          </div>

          {/* Main 2x2 Intelligence Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Box 1: 이번 주 주요 미팅 레이더 */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white print:border-slate-300 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span>이번 주 미팅 레이더</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {summary.upcomingMeetings.length}건 예정
                </span>
              </div>

              {summary.upcomingMeetings.length > 0 ? (
                <div className="space-y-2">
                  {summary.upcomingMeetings.map(m => (
                    <div key={m.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="font-bold text-slate-800 line-clamp-1">{m.title}</div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1 font-mono">
                        <span>{m.date}</span>
                        <span className="text-slate-700 font-sans font-medium">{m.company} {m.personName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  이번 주 예정된 외부 일정이 없습니다.
                </div>
              )}
            </div>

            {/* Box 2: DART 공시 영전 & 지각변동 */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white print:border-slate-300 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Award className="w-4 h-4 text-amber-600" />
                  <span>DART 공시 영전 축하 피드</span>
                </span>
                <span className="text-[10px] font-mono text-amber-700 font-semibold">
                  {summary.uncelebratedPromotions.length}건 미축하
                </span>
              </div>

              {summary.uncelebratedPromotions.length > 0 ? (
                <div className="space-y-2">
                  {summary.uncelebratedPromotions.map(p => (
                    <div key={p.id} className="p-2 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{p.personName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-white text-amber-800 font-semibold border border-amber-200">
                          {p.promotionType}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5">
                        {p.companyName} · {p.newTitle}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  모든 영전 축하 전송이 완료되었습니다.
                </div>
              )}
            </div>

            {/* Box 3: 소통 골든타임 이탈 인맥 TOP 3 */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white print:border-slate-300 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-rose-600" />
                  <span>소통 골든타임 관리 요망 (60일+)</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Care Priority</span>
              </div>

              {summary.cadenceAlerts.length > 0 ? (
                <div className="space-y-2">
                  {summary.cadenceAlerts.map(c => (
                    <div 
                      key={c.id} 
                      onClick={() => {
                        const target = people.find(p => p.id === c.id);
                        if (target) onSelectPerson(target);
                      }}
                      className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs flex items-center justify-between cursor-pointer hover:bg-slate-100 transition-colors"
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 truncate">{c.personName} ({c.title})</div>
                        <div className="text-[11px] text-slate-500 truncate">{c.companyName}</div>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-rose-600 shrink-0">
                        {c.daysSince}일 전 교류
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  모든 인맥과의 소통 주기가 원활합니다.
                </div>
              )}
            </div>

            {/* Box 4: 전략 비즈니스 딜 파이프라인 */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-white print:border-slate-300 space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-emerald-600" />
                  <span>핵심 비즈니스 딜 파이프라인</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Active Deals</span>
              </div>

              {summary.activeDeals.length > 0 ? (
                <div className="space-y-2">
                  {summary.activeDeals.map(d => (
                    <div key={d.id} className="p-2 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 line-clamp-1">{d.title}</span>
                        <span className="text-[11px] font-mono font-bold text-emerald-700">{d.health}%</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {d.company} · {d.size}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-slate-400">
                  등록된 주요 전략 딜이 없습니다.
                </div>
              )}
            </div>
          </div>

          {/* Document Footer (출처 및 보안 서명) */}
          <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 font-sans gap-2">
            <div>
              데이터 출처: 대한민국 금융감독원 DART 공시 실명 팩트 · ConnectWe E2EE Trust Graph
            </div>
            <div className="font-mono text-slate-500">
              CONFIDENTIAL &amp; PROPRIETARY · C-LEVEL ONLY
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
