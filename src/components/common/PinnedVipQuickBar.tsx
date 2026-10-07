import React from 'react';
import { Person } from '../../types/network';
import { Pin } from 'lucide-react';

export interface PinnedVipQuickBarProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
}

export const PinnedVipQuickBar: React.FC<PinnedVipQuickBarProps> = ({
  people,
  onSelectPerson
}) => {
  const pinnedList = people.filter((p) => p.isPinned);
  if (pinnedList.length === 0) return null;

  return (
    <div className="flex items-center gap-2 p-2 px-3 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 shadow-2xs overflow-x-auto no-scrollbar animate-in fade-in duration-200">
      <div className="flex items-center gap-1.5 shrink-0 pr-2.5 border-r border-amber-200 dark:border-amber-900">
        <Pin className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
        <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
          VIP 핀 ({pinnedList.length})
        </span>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {pinnedList.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelectPerson(p)}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-xl bg-white dark:bg-slate-800 border border-amber-200/90 dark:border-amber-800 text-xs text-slate-800 dark:text-slate-200 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer group shrink-0"
          >
            <span className="font-bold text-amber-950 dark:text-amber-100 group-hover:text-amber-600 transition-colors">
              {p.name}
            </span>
            <span className="text-[10px] text-slate-400">
              {p.currentCompany} {p.currentTitle}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

