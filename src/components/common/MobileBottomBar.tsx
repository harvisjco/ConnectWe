import React from 'react';
import { 
  Zap, 
  Users, 
  Compass, 
  Briefcase, 
  Award 
} from 'lucide-react';

interface MobileBottomBarProps {
  currentView: string;
  onSelectView: (view: string) => void;
  uncelebratedPromosCount?: number;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  currentView,
  onSelectView,
  uncelebratedPromosCount = 0
}) => {
  const navItems = [
    {
      id: 'executive',
      label: '사령탑',
      icon: Zap,
      badge: null
    },
    {
      id: 'network',
      label: '소중한 인연',
      icon: Users,
      badge: null
    },
    {
      id: 'geo',
      label: '외근 레이더',
      icon: Compass,
      badge: null
    },
    {
      id: 'promotions',
      label: '영전·승진',
      icon: Award,
      badge: uncelebratedPromosCount > 0 ? uncelebratedPromosCount : null
    },
    {
      id: 'deals',
      label: '전략 딜',
      icon: Briefcase,
      badge: null
    }
  ];

  return (
    <aside 
      aria-label="모바일 하단 내비게이션 바"
      className="fixed bottom-3 inset-x-3 z-40 lg:hidden pointer-events-auto"
    >
      <div className="bg-slate-900/90 dark:bg-slate-950/90 backdrop-blur-xl border border-slate-700/60 dark:border-slate-800/80 rounded-2xl shadow-2xl p-1.5 flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              data-testid={`mobile-tab-${item.id}`}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all duration-200 active:scale-95 ${
                isActive
                  ? 'text-white bg-indigo-600/90 shadow-sm shadow-indigo-600/40'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <div className="relative">
                <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                {item.badge && (
                  <span className="absolute -top-1 -right-2 flex h-3.5 min-w-[14px] px-1 items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-bold font-mono">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] mt-0.5 font-medium tracking-tight ${isActive ? 'font-bold text-white' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </aside>
  );
};
