import React, { useState } from 'react';
import { CalendarMeeting } from '../../services/calendarRadarService';
import { Person } from '../../types/network';
import { 
  Calendar, FileText, ChevronRight, Sparkles, 
  Clock, ShieldCheck, X, Mic
} from 'lucide-react';

interface MeetingRadarBannerProps {
  imminentMeeting: CalendarMeeting | null;
  onOpenDossier: (person: Person) => void;
  onOpenCalendarModal: () => void;
  onOpenDebrief?: (person: Person) => void;
}

export const MeetingRadarBanner: React.FC<MeetingRadarBannerProps> = ({
  imminentMeeting,
  onOpenDossier,
  onOpenCalendarModal,
  onOpenDebrief
}) => {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) return null;

  // 매칭된 미팅이 없을 때
  if (!imminentMeeting) {
    return (
      <aside aria-label="일정 동기화 알림" className="w-full bg-slate-900/90 border-b border-slate-800 px-4 py-2 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="flex h-2 w-2 rounded-full bg-slate-500" />
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span>실시간 미팅 레이더: 예정된 일정이 없습니다.</span>
          </div>
          <button
            onClick={onOpenCalendarModal}
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
          >
            <span>캘린더 (.ics) 동기화</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </aside>
    );
  }

  const { title, minutesUntil, matchedPerson, location } = imminentMeeting;

  // 상태 배지 결정
  const isNow = minutesUntil !== undefined && minutesUntil <= 0 && minutesUntil >= -60;
  const isUrgent = minutesUntil !== undefined && minutesUntil > 0 && minutesUntil <= 30;

  return (
    <aside aria-label="실시간 미팅 레이더" className="relative w-full bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-4 py-2 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 text-xs">
        
        {/* Left: Status & Meeting Info */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Pulsing indicator */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                isNow ? 'bg-rose-400' : isUrgent ? 'bg-amber-400' : 'bg-blue-400'
              }`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${
                isNow ? 'bg-rose-500' : isUrgent ? 'bg-amber-500' : 'bg-blue-600'
              }`} />
            </span>
            <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border whitespace-nowrap ${
              isNow 
                ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/80 dark:text-rose-300 dark:border-rose-500/40' 
                : isUrgent 
                ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-500/40' 
                : 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-indigo-950/80 dark:text-indigo-300 dark:border-indigo-500/40'
            }`}>
              {isNow ? 'LIVE' : isUrgent ? `${minutesUntil}분 전` : '미팅 레이더'}
            </span>
          </div>

          {/* Meeting Title & Person Summary */}
          <div className="flex items-center gap-2 min-w-0 truncate">
            <span className="font-semibold text-slate-800 dark:text-slate-200 truncate text-xs">{title}</span>
            {location && (
              <span className="hidden md:inline-flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
                <Clock className="w-3 h-3 text-slate-400" />
                {location}
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {matchedPerson ? (
            <>
              <button
                onClick={() => onOpenDossier(matchedPerson)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-2xs active:scale-95 text-xs whitespace-nowrap group cursor-pointer"
                title="미팅 10분 전 AI 브리핑 열기"
              >
                <FileText className="w-3.5 h-3.5 text-blue-200 group-hover:text-white shrink-0" />
                <span className="hidden sm:inline">
                  [{matchedPerson.name} {matchedPerson.currentTitle}] 1-Page AI 브리핑
                </span>
                <span className="sm:hidden">
                  AI 브리핑
                </span>
                {matchedPerson.sourceType === 'DART_FACT' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
                )}
                <Sparkles className="w-3 h-3 text-blue-200 shrink-0" />
              </button>

              {onOpenDebrief && (
                <button
                  onClick={() => onOpenDebrief(matchedPerson)}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-rose-950/80 dark:hover:bg-rose-900 border border-slate-200 dark:border-rose-500/40 text-rose-600 dark:text-rose-300 font-bold transition-all text-xs active:scale-95 shadow-2xs whitespace-nowrap cursor-pointer"
                  title="미팅 직후 빠른 회고 & AI 액션 추출"
                >
                  <Mic className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                  <span>회고</span>
                </button>
              )}
            </>
          ) : (
            <button
              onClick={onOpenCalendarModal}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer shadow-2xs"
            >
              <span>캘린더 관리</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onOpenCalendarModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="캘린더 설정"
          >
            <Calendar className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
            title="배너 닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
