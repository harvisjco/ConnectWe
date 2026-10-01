import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Person } from '../../types/network';
import { NavViewType } from './SidebarLNB';
import { 
  Search, User, Briefcase, Zap, 
  MapPin, Award, Building2, Sparkles, 
  ArrowRight, X
} from 'lucide-react';

interface CommandAction {
  id: string;
  category: '인물 인텔리전스' | '경영 네비게이션' | '스마트 액션';
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  onExecute: () => void;
}

interface GlobalCommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  people: Person[];
  onSelectPerson: (person: Person) => void;
  onOpenMeetingBriefing?: (person: Person) => void;
  onNavigateView: (view: NavViewType) => void;
}

export const GlobalCommandPalette: React.FC<GlobalCommandPaletteProps> = ({
  isOpen,
  onClose,
  people,
  onSelectPerson,
  onOpenMeetingBriefing,
  onNavigateView
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // 모달 오픈 시 인풋 포커스 & 초기화
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // 검색 쿼리에 따른 동적 액션 리스트 생성
  const actions = useMemo<CommandAction[]>(() => {
    const q = query.trim().toLowerCase();
    const result: CommandAction[] = [];

    // 1. 메뉴 네비게이션 액션
    const menuActions: Array<{ id: NavViewType; title: string; subtitle: string; icon: React.ComponentType<{ className?: string }> }> = [
      { id: 'command', title: '오늘의 비즈니스 경영 사령탑', subtitle: '핵심 딜 파이프라인 · 외근 접점 · DART 영전 레이더', icon: Zap },
      { id: 'company', title: 'DART 상장사 공시 팩트', subtitle: '금융감독원 전자공시 검증 임원 및 알럼나이 네트워크', icon: Building2 },
      { id: 'deals', title: '비즈니스 파트너십 & 딜 파이프라인', subtitle: '6단계 칸반 보드 및 의사결정권자(Keyman) 건전도 관리', icon: Briefcase },
      { id: 'proximity', title: '지리적 근접 레이더', subtitle: '7대 거점별 외근 동선 매핑 및 티타임 번들러', icon: MapPin },
      { id: 'promotion', title: '정기 승진 & 인사 레이더', subtitle: 'DART 임원 영전 공시 조기 감지 및 공식 축전 생성', icon: Award },
    ];

    const matchedMenus = menuActions.filter(m => 
      !q || m.title.toLowerCase().includes(q) || m.subtitle.toLowerCase().includes(q)
    );

    matchedMenus.forEach(m => {
      result.push({
        id: `nav-${m.id}`,
        category: '경영 네비게이션',
        title: m.title,
        subtitle: m.subtitle,
        icon: m.icon,
        badge: '화면 전환',
        onExecute: () => {
          onNavigateView(m.id);
          onClose();
        }
      });
    });

    // 2. 인물 검색 및 1초 브리핑 액션 (상위 6명)
    const matchedPeople = people.filter(p => {
      if (!q) return p.closeness <= 2; // 초기에는 1~2촌 핵심 인물 표시
      return (
        p.name.toLowerCase().includes(q) ||
        p.currentCompany.toLowerCase().includes(q) ||
        p.currentTitle.toLowerCase().includes(q) ||
        (p.primaryDomain && p.primaryDomain.toLowerCase().includes(q))
      );
    }).slice(0, 6);

    matchedPeople.forEach(p => {
      const isDart = p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector;
      
      // A. 미팅 10분 전 스마트 브리핑 열기 액션
      result.push({
        id: `briefing-${p.id}`,
        category: '인물 인텔리전스',
        title: `${p.name} (${p.currentCompany} ${p.currentTitle})`,
        subtitle: `C-Level 미팅 10분 전 스마트 브리핑 룸 즉시 열기 (1-Page Brief)`,
        icon: Sparkles,
        badge: isDart ? 'DART FACT' : '1-Page Brief',
        onExecute: () => {
          if (onOpenMeetingBriefing) {
            onOpenMeetingBriefing(p);
          } else {
            onSelectPerson(p);
          }
          onClose();
        }
      });

      // B. 프로필 상세 보기 액션
      result.push({
        id: `profile-${p.id}`,
        category: '인물 인텔리전스',
        title: `${p.name} 프로필 인스펙터`,
        subtitle: `${p.currentCompany} · 소통 타임라인 & 비즈니스 메모 열람`,
        icon: User,
        onExecute: () => {
          onSelectPerson(p);
          onClose();
        }
      });
    });

    return result;
  }, [query, people, onNavigateView, onSelectPerson, onOpenMeetingBriefing, onClose]);

  // 키보드 방향키 및 Enter / Escape 핸들링
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % Math.max(1, actions.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + actions.length) % Math.max(1, actions.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (actions[selectedIndex]) {
        actions[selectedIndex].onExecute();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] sm:pt-[15vh] p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      data-testid="global-command-palette"
    >
      <div 
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden flex flex-col transform transition-all animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-100 dark:border-slate-800 gap-3 bg-white dark:bg-slate-900">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="인맥 검색, 미팅 브리핑, 메뉴 이동... (예: 네이버, 김경영, 칸반, 테헤란로)"
            className="flex-1 bg-transparent text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded">
            ESC
          </kbd>
        </div>

        {/* Action Items List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {actions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              일치하는 인맥이나 메뉴 액션을 찾지 못했습니다.
            </div>
          ) : (
            actions.map((action, idx) => {
              const isSelected = idx === selectedIndex;
              const IconComp = action.icon;

              return (
                <div
                  key={action.id}
                  onClick={() => action.onExecute()}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-950 dark:text-white'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      isSelected
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                    }`}>
                      <IconComp className="w-4 h-4" />
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold truncate">
                          {action.title}
                        </span>
                        {action.badge && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                            action.badge.includes('DART')
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}>
                            {action.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                        {action.subtitle}
                      </p>
                    </div>
                  </div>

                  <ArrowRight className={`w-4 h-4 shrink-0 transition-transform ${
                    isSelected ? 'text-indigo-600 dark:text-indigo-400 translate-x-0.5' : 'text-slate-300 dark:text-slate-600'
                  }`} />
                </div>
              );
            })
          )}
        </div>

        {/* Footer Navigation Hints */}
        <div className="px-4 py-2.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↑</kbd>
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↓</kbd>
              <span>이동</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono text-[10px]">↵</kbd>
              <span>선택</span>
            </span>
          </div>
          <span>ConnectWe Spotlight · 마우스리스 초고속 제어</span>
        </div>
      </div>
    </div>
  );
};
