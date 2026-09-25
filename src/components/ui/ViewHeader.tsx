import React from 'react';

export interface ViewHeaderProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  englishTag?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * ConnectWe Design System (CW-DS) Standardized View Header
 * 일관된 뷰 타이틀, 시맨틱 태그, 목적 설명 및 액션 버튼 슬롯을 제공하는 표준 헤더 컴포넌트
 */
export const ViewHeader: React.FC<ViewHeaderProps> = ({
  icon: Icon,
  title,
  subtitle,
  englishTag,
  badge,
  actions,
  className = ''
}) => {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80 dark:border-slate-800/80 ${className}`}>
      <div className="flex items-center gap-3.5 min-w-0">
        <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 dark:bg-indigo-950/60 dark:border-indigo-500/30 dark:text-indigo-400 flex items-center justify-center shrink-0 shadow-2xs">
          <Icon className="w-5 h-5" />
        </div>

        <div className="min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight truncate">
              {title}
            </h2>

            {englishTag && (
              <span className="hidden md:inline-flex text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700 font-mono font-medium">
                {englishTag}
              </span>
            )}

            {badge}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-1 sm:line-clamp-none">
            {subtitle}
          </p>
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};
