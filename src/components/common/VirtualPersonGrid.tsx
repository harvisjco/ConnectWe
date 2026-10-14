import React, { useState, useEffect, useRef } from 'react';
import { Person } from '../../types/network';
import { BirthdayContact } from '../../types/community';
import { Cake, GraduationCap, Phone, Mail, ChevronDown, CheckCircle2 } from 'lucide-react';
import { PersonMiniPreviewTooltip } from './PersonMiniPreviewTooltip';
import { getExecutiveStatusBadge } from '../../services/executiveToneService';
import { triggerHaptic } from '../../utils/hapticFeedback';

export interface VirtualPersonGridProps {
  people: Person[];
  birthdays?: BirthdayContact[];
  onSelectPerson: (person: Person) => void;
  pageSize?: number;
  className?: string;
}

export const VirtualPersonGrid: React.FC<VirtualPersonGridProps> = ({
  people,
  birthdays = [],
  onSelectPerson,
  pageSize = 30,
  className = ''
}) => {
  const [visibleCount, setVisibleCount] = useState<number>(pageSize);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // 검색어나 필터 변경 시 첫 페이지 청크로 리셋
  useEffect(() => {
    setVisibleCount(pageSize);
  }, [people, pageSize]);

  // IntersectionObserver를 통한 무감각 자동 인피니트 로딩
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          setVisibleCount((prev) => {
            if (prev >= people.length) return prev;
            return Math.min(prev + pageSize, people.length);
          });
        }
      },
      { rootMargin: '300px 0px', threshold: 0.05 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [people.length, pageSize]);

  const visiblePeople = people.slice(0, visibleCount);
  const hasMore = visibleCount < people.length;

  const handleLoadMoreManual = () => {
    triggerHaptic('light');
    setVisibleCount((prev) => Math.min(prev + pageSize, people.length));
  };

  return (
    <div className={`space-y-4 ${className}`} data-testid="virtual-person-grid">
      {/* 3열 반응형 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visiblePeople.map((person) => {
          const bdayInfo = birthdays.find((b) => b.id === person.id);
          const badge = getExecutiveStatusBadge(person);

          return (
            <div
              key={person.id}
              onClick={() => {
                triggerHaptic('light');
                onSelectPerson(person);
              }}
              className="group bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer relative"
              data-testid={`person-card-${person.id}`}
            >
              {/* 생일 인디케이터 */}
              {bdayInfo && (
                <div
                  className={`absolute top-4 right-4 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                    bdayInfo.isToday
                      ? 'bg-rose-500 text-white animate-bounce'
                      : 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-pink-300 border border-pink-200 dark:border-pink-800'
                  }`}
                >
                  <Cake className="w-3 h-3" />
                  {bdayInfo.isToday ? '오늘 생일!' : `생일 D-${bdayInfo.daysUntil}`}
                </div>
              )}

              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white font-bold text-base flex items-center justify-center shadow-sm shrink-0">
                  {person.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-emerald-600 transition-colors">
                      <PersonMiniPreviewTooltip person={person} onSelectPerson={onSelectPerson}>
                        <span>{person.name}</span>
                      </PersonMiniPreviewTooltip>
                    </h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.badgeClass}`}
                      title={badge.subLabel}
                    >
                      {badge.label}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    {person.currentCompany} · {person.currentTitle}
                  </p>
                </div>
              </div>

              {/* 학력 및 소속 정보 */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                {person.academics && person.academics.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate">
                      {person.academics.map((a) => `${a.schoolName} ${a.major || ''}`).join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{person.mobile || '연락처 미등록'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{person.email || '이메일 미등록'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 가상 윈도잉 센티넬 및 상태 인디케이터 바 */}
      {people.length > pageSize && (
        <div className="pt-2 pb-4 flex flex-col items-center justify-center gap-2">
          {hasMore ? (
            <>
              {/* 무한 스크롤 감지 센티넬 */}
              <div ref={sentinelRef} className="h-6 w-full opacity-0 pointer-events-none" />
              <button
                type="button"
                onClick={handleLoadMoreManual}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold border border-slate-200/80 dark:border-slate-700 transition-all active:scale-95 cursor-pointer shadow-2xs"
              >
                <ChevronDown className="w-3.5 h-3.5" />
                <span>
                  인맥 더 보기 (+{Math.min(pageSize, people.length - visibleCount)}명)
                </span>
              </button>
              <span className="text-[11px] text-slate-400 font-mono">
                {`총 ${people.length.toLocaleString()}명 중 ${visiblePeople.length.toLocaleString()}명 로드됨 (스크롤 시 자동 로딩)`}
              </span>
            </>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium py-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{`모든 인맥을 불러왔습니다 (총 ${people.length.toLocaleString()}명)`}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
