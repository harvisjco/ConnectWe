import React from 'react';
import { Person } from '../../types/network';
import { 
  LayoutDashboard, Building2, GitBranch, ShieldAlert,
  Briefcase, TrendingUp, Gift, Users,
  Share2, Orbit, Compass, Clock,
  Sparkles, ChevronLeft, ChevronRight, X
} from 'lucide-react';

export type NavViewType = 
  | 'command' | 'company' | 'orgchart' | 'audit'
  | 'deals' | 'promotion' | 'referral' | 'team'
  | 'canvas' | 'galaxy' | 'proximity' | 'timeline' | 'age';

interface SidebarLNBProps {
  activeView: NavViewType;
  onSelectView: (view: NavViewType) => void;
  people: Person[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenCopilot: () => void;
}

interface NavItem {
  id: NavViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: {
    text: string;
    variant: 'action-pink' | 'action-amber' | 'action-emerald' | 'subtle';
  };
}

interface NavSection {
  title: string;
  tag: string;
  tagColor: string;
  items: NavItem[];
}

export const SidebarLNB: React.FC<SidebarLNBProps> = ({
  activeView,
  onSelectView,
  people,
  isCollapsed,
  onToggleCollapse,
  isOpenMobile,
  onCloseMobile,
  onOpenCopilot
}) => {
  // 실시간 수치 집계
  const dartFactCount = people.filter(p => p.sourceType === 'DART_FACT' || p.dartInfo?.isPublicDirector).length;
  const staleCoreCount = people.filter(p => p.isStale && p.closeness <= 3).length;
  const todayBirthdayCount = people.filter(p => p.id === 'p_1' || p.id === 'p_6').length;

  const sections: NavSection[] = [
    {
      title: '인맥 자산 & 인텔리전스',
      tag: 'CORE',
      tagColor: '',
      items: [
        {
          id: 'command',
          label: '대시보드 총괄 관제',
          icon: LayoutDashboard,
          badge: todayBirthdayCount > 0 
            ? { text: `생일 ${todayBirthdayCount}`, variant: 'action-pink' } 
            : staleCoreCount > 0 
              ? { text: `미소통 ${staleCoreCount}`, variant: 'action-amber' }
              : undefined
        },
        {
          id: 'company',
          label: 'DART 상장사 공시 팩트',
          icon: Building2,
          badge: dartFactCount > 0 ? { text: `${dartFactCount}`, variant: 'subtle' } : undefined
        },
        {
          id: 'orgchart',
          label: '기업 지배구조 & 조직도',
          icon: GitBranch
        },
        {
          id: 'audit',
          label: '동문 & 인맥 건강도',
          icon: ShieldAlert
        }
      ]
    },
    {
      title: '비즈니스 & 딜 실행',
      tag: 'BIZ',
      tagColor: '',
      items: [
        {
          id: 'deals',
          label: '딜 파이프라인 칸반',
          icon: Briefcase,
          badge: { text: '3', variant: 'action-amber' }
        },
        {
          id: 'promotion',
          label: '정기 승진 & 인사 레이더',
          icon: TrendingUp
        },
        {
          id: 'referral',
          label: '소개 보상 파이프라인',
          icon: Gift
        },
        {
          id: 'team',
          label: '팀 네트워크 협업',
          icon: Users
        }
      ]
    },
    {
      title: '다차원 공간 & 시계열',
      tag: 'SPACE',
      tagColor: '',
      items: [
        {
          id: 'canvas',
          label: '2D 관계망 캔버스',
          icon: Share2
        },
        {
          id: 'galaxy',
          label: '3D 은하수 우주 뷰',
          icon: Orbit
        },
        {
          id: 'proximity',
          label: '지리적 근접 레이더',
          icon: Compass
        },
        {
          id: 'timeline',
          label: '타임라인 & 세대 분석',
          icon: Clock
        }
      ]
    }
  ];

  const renderBadge = (badge: NavItem['badge']) => {
    if (!badge) return null;
    if (badge.variant === 'action-pink') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-pink-50 text-pink-600 border border-pink-200/80 dark:bg-pink-950/40 dark:text-pink-300 dark:border-pink-500/30 shrink-0 font-mono">
          {badge.text}
        </span>
      );
    }
    if (badge.variant === 'action-amber') {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-500/30 shrink-0 font-mono">
          {badge.text}
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700/60 shrink-0 font-mono">
        {badge.text}
      </span>
    );
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* LNB Top Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
          {!isCollapsed && (
            <span className="text-xs font-bold tracking-tight text-slate-800 dark:text-slate-200 truncate">
              ConnectWe 콘솔
            </span>
          )}
        </div>
        {/* Desktop Collapse Button */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          title={isCollapsed ? '사이드바 펼치기' : '사이드바 축소'}
          aria-label="사이드바 토글"
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="lg:hidden flex items-center justify-center w-7 h-7 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="사이드바 닫기"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav Menu Items List */}
      <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 scrollbar-none">
        {sections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-1">
            {/* Section Header with GoodPartner Pill Tag */}
            {!isCollapsed ? (
              <div className="flex items-center justify-between px-2.5 pt-2 pb-1">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 tracking-tight">
                  {section.title}
                </span>
                {section.tag && (
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
                    {section.tag}
                  </span>
                )}
              </div>
            ) : (
              <div className="w-full flex justify-center py-1">
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
              </div>
            )}

            {/* Menu Items */}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = activeView === item.id;
                const IconComponent = item.icon;

                return (
                  <button
                    key={item.id}
                    data-testid={`lnb-${item.id}`}
                    onClick={() => {
                      onSelectView(item.id);
                      onCloseMobile();
                    }}
                    title={isCollapsed ? item.label : undefined}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs transition-all duration-150 active:scale-[0.98] cursor-pointer ${
                      isActive
                        ? 'bg-indigo-50/90 text-indigo-700 border border-indigo-150/80 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500/40 shadow-2xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 font-medium'
                    } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && renderBadge(item.badge)}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* LNB Bottom AI Radar Widget */}
      <div className="p-2 border-t border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <button
          onClick={onOpenCopilot}
          className={`w-full p-2.5 rounded-xl border text-left transition-all duration-150 active:scale-[0.98] cursor-pointer group ${
            isCollapsed
              ? 'flex items-center justify-center p-2 bg-indigo-50/60 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-800/50'
              : 'bg-gradient-to-br from-indigo-50/90 via-sky-50/60 to-white dark:from-indigo-950/40 dark:via-slate-900 dark:to-slate-900 border-indigo-200/90 dark:border-indigo-800/60 shadow-xs hover:border-indigo-300 dark:hover:border-indigo-700'
          }`}
          title="ConnectWe AI Copilot 드로어 열기"
        >
          {isCollapsed ? (
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-pulse" />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse shrink-0" />
                  <span>BARS AI Radar</span>
                </div>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300">
                  LIVE
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug line-clamp-2">
                DART 8,500+ 기업 실공시 & AI 인맥 전략 코칭 가동 중
              </p>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Floating LNB Sidebar */}
      <aside
        className={`hidden lg:block sticky top-[73px] z-30 transition-all duration-300 shrink-0 ${
          isCollapsed ? 'w-[68px]' : 'w-[250px]'
        }`}
        style={{ height: 'calc(100vh - 89px)' }}
      >
        <div className="h-full rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800/80 shadow-xs dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl overflow-hidden flex flex-col">
          {navContent}
        </div>
      </aside>

      {/* Mobile Drawer Overlay Backdrop */}
      {isOpenMobile && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={onCloseMobile}
        >
          <div
            className="w-[280px] h-full bg-white dark:bg-slate-900 shadow-2xl border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {navContent}
          </div>
        </div>
      )}
    </>
  );
};
