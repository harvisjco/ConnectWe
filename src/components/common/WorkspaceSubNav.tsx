import React from 'react';
import { NavViewType } from './SidebarLNB';
import { Person } from '../../types/network';
import { 
  LayoutDashboard, Building2, GitBranch, ShieldAlert,
  Briefcase, Award, Gift, Users,
  Share2, Orbit, Compass, Clock, Calendar
} from 'lucide-react';

interface WorkspaceSubNavProps {
  activeView: NavViewType;
  onNavigateView: (view: NavViewType) => void;
  people: Person[];
  displayPeopleCount: number;
}

interface NavTabItem {
  id: NavViewType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  workspace: 'core' | 'biz' | 'space';
}

const ALL_TABS: NavTabItem[] = [
  // 1. 인맥 인텔리전스 (CORE)
  { id: 'command', label: '사령탑 관제', icon: LayoutDashboard, workspace: 'core' },
  { id: 'orgchart', label: '기업 지배구조 & 조직도', icon: GitBranch, workspace: 'core' },
  { id: 'company', label: '회사·알럼나이', icon: Building2, workspace: 'core' },
  { id: 'audit', label: '인맥 건강도', icon: ShieldAlert, workspace: 'core' },
  { id: 'age', label: '나이대별 분석', icon: Calendar, workspace: 'core' },
  // 2. 비즈니스 & 딜 실행 (BIZ)
  { id: 'deals', label: '전략 딜 협업 룸', icon: Briefcase, workspace: 'biz' },
  { id: 'promotion', label: '영전 골든타임', icon: Award, workspace: 'biz' },
  { id: 'referral', label: '추천 리워드', icon: Gift, workspace: 'biz' },
  { id: 'team', label: '팀 인맥', icon: Users, workspace: 'biz' },
  // 3. 다차원 공간 & 시계열 (SPACE)
  { id: 'canvas', label: '2D 관계망', icon: Share2, workspace: 'space' },
  { id: 'galaxy', label: '3D 은하수', icon: Orbit, workspace: 'space' },
  { id: 'proximity', label: '거점 레이더', icon: Compass, workspace: 'space' },
  { id: 'timeline', label: '소통 타임라인', icon: Clock, workspace: 'space' },
];

const WORKSPACE_LABELS = {
  core: { name: '인맥 인텔리전스', tag: 'CORE', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-500/30' },
  biz: { name: '비즈니스 & 딜', tag: 'BIZ', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-500/30' },
  space: { name: '다차원 공간 & 시계열', tag: 'SPACE', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-500/30' }
};

export const WorkspaceSubNav: React.FC<WorkspaceSubNavProps> = ({
  activeView,
  onNavigateView,
  people,
  displayPeopleCount
}) => {
  const currentTab = ALL_TABS.find(t => t.id === activeView) || ALL_TABS[0];
  const currentWs = WORKSPACE_LABELS[currentTab.workspace];

  const dartCount = people.filter(p => p.sourceType === 'DART_FACT' || p.dartInfo?.isPublicDirector).length;

  return (
    <div className="flex flex-col gap-2.5 p-2 sm:p-2.5 rounded-2xl bg-white/90 dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800 shadow-2xs backdrop-blur-md">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        
        {/* Left: Active Workspace Breadcrumb Tag & Tabs Container */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-0.5">
          {/* Current Workspace Pill */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-xl border shrink-0 text-xs font-bold font-mono">
            <span className={`px-1.5 py-0.2 rounded text-[11px] font-bold border ${currentWs.badgeColor}`}>
              {currentWs.tag}
            </span>
            <span className="text-slate-600 dark:text-slate-300 text-[11px]">
              {currentWs.name}
            </span>
          </div>

          {/* Unified All Tabs with testid preserved */}
          <div className="flex items-center gap-1 p-1 rounded-full bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60 overflow-x-auto max-w-full scrollbar-none shrink-0">
            {ALL_TABS.map((tab) => {
              const isActive = activeView === tab.id;
              const IconComponent = tab.icon;

              return (
                <button
                  key={tab.id}
                  type="button"
                  data-testid={`tab-${tab.id}`}
                  onClick={() => onNavigateView(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-bold shadow-2xs border border-slate-200/80 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-900/60 font-medium border border-transparent'
                  }`}
                >
                  <IconComponent className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Status Summary Counters */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 shrink-0 self-end sm:self-center font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-[11px] font-medium">
            전체 <strong className="text-slate-900 dark:text-white">{displayPeopleCount}</strong>명
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-[11px] font-medium">
            공시 임원 <strong className="text-emerald-800 dark:text-emerald-200">{dartCount}</strong>명
          </span>
        </div>
      </div>
    </div>
  );
};
