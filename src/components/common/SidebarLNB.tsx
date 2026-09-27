import React from 'react';
import { Person } from '../../types/network';
import { UserRole, USER_ROLES } from '../../types/userRole';
import { 
  LayoutDashboard, Building2, GitBranch, ShieldAlert,
  Briefcase, TrendingUp, Gift, Users,
  Share2, Orbit, Compass, Clock,
  Sparkles, ChevronLeft, ChevronRight, X,
  GraduationCap
} from 'lucide-react';

export type NavViewType = 
  | 'general'
  | 'command' | 'company' | 'orgchart' | 'audit'
  | 'deals' | 'promotion' | 'referral' | 'team'
  | 'canvas' | 'galaxy' | 'proximity' | 'timeline' | 'age';

interface SidebarLNBProps {
  activeView: NavViewType;
  onSelectView: (view: NavViewType) => void;
  people: Person[];
  userRole?: UserRole;
  onSelectUserRole?: (role: UserRole) => void;
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
  userRole = 'general',
  onSelectUserRole,
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

  // 회원 등급별 네비게이션 섹션 동적 구성
  let sections: NavSection[] = [];

  if (userRole === 'general') {
    // 🟢 일반 회원: 심플 동문 주소록 & 커뮤니티 + 팀 협업
    sections = [
      {
        title: '동문 & 소모임 커뮤니티',
        tag: 'ALUMNI',
        tagColor: '',
        items: [
          {
            id: 'general',
            label: '동문 주소록 & 소모임',
            icon: GraduationCap,
            badge: todayBirthdayCount > 0 
              ? { text: `생일 ${todayBirthdayCount}`, variant: 'action-pink' } 
              : undefined
          },
          {
            id: 'team',
            label: '팀 네트워크 협업',
            icon: Users
          }
        ]
      }
    ];
  } else if (userRole === 'hidden') {
    // 🟣 Hidden 회원: 상업적/정치적 은어를 품격 높은 비즈니스 언어로 순화
    sections = [
      {
        title: '관계 여정 & 소통 관리',
        tag: 'TOUCH',
        tagColor: '',
        items: [
          {
            id: 'command',
            label: '관계 현황 요약',
            icon: LayoutDashboard,
            badge: todayBirthdayCount > 0 
              ? { text: `생일 ${todayBirthdayCount}`, variant: 'action-pink' } 
              : staleCoreCount > 0 
                ? { text: `소통 환기 ${staleCoreCount}`, variant: 'action-amber' }
                : undefined
          },
          {
            id: 'proximity',
            label: '지역별 접점 & 티타임',
            icon: Compass
          },
          {
            id: 'timeline',
            label: '소통 여정 & 관계 히스토리',
            icon: Clock
          }
        ]
      },
      {
        title: '비즈니스 파트너십 & 협력',
        tag: 'PARTNER',
        tagColor: '',
        items: [
          {
            id: 'deals',
            label: '비즈니스 파트너십 & 프로젝트',
            icon: Briefcase,
            badge: { text: '3', variant: 'action-amber' }
          },
          {
            id: 'promotion',
            label: '주요 인사 & 축하 소식',
            icon: TrendingUp
          },
          {
            id: 'referral',
            label: '상생 인재 매칭 & 협력',
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
        title: '다차원 인맥 지도',
        tag: 'MAP',
        tagColor: '',
        items: [
          {
            id: 'canvas',
            label: '2D 관계망 지도',
            icon: Share2
          },
          {
            id: 'galaxy',
            label: '3D 다차원 연결망',
            icon: Orbit
          }
        ]
      }
    ];
  } else {
    // 👑 마스터 등급: 전체 고급 기능 및 C-Level 총괄 사령탑
    sections = [
      {
        title: '👑 마스터 전용 총괄 관제',
        tag: 'ADMIN',
        tagColor: '',
        items: [
          {
            id: 'command',
            label: '사령탑 대시보드 총괄 관제',
            icon: LayoutDashboard,
            badge: todayBirthdayCount > 0 
              ? { text: `생일 ${todayBirthdayCount}`, variant: 'action-pink' } 
              : staleCoreCount > 0 
                ? { text: `소통 환기 ${staleCoreCount}`, variant: 'action-amber' }
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
            label: '동문 & 인맥 건강도 감사',
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
            label: '추천 감사 리워드 (바운티)',
            icon: Gift
          },
          {
            id: 'team',
            label: '팀 네트워크 협업 풀',
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
          },
          {
            id: 'general',
            label: '동문 주소록 & 소모임 (일반 뷰)',
            icon: GraduationCap
          }
        ]
      }
    ];
  }

  const renderBadge = (badge: NavItem['badge'], isActive: boolean) => {
    if (!badge) return null;
    if (isActive) {
      return (
        <span className="w-5 h-5 rounded-full text-[10px] font-bold bg-indigo-600 text-white flex items-center justify-center font-mono shadow-xs shrink-0">
          {badge.text}
        </span>
      );
    }
    return (
      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-500 bg-slate-100 border border-slate-200/60 shrink-0">
        {badge.text}
      </span>
    );
  };

  const navContent = (
    <div className="flex flex-col h-full">
      {/* LNB Top Header */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            userRole === 'master' ? 'bg-amber-500 animate-pulse' : userRole === 'hidden' ? 'bg-indigo-600' : 'bg-emerald-500'
          }`} />
          {!isCollapsed && (
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-bold tracking-tight text-slate-800 dark:text-slate-200">
                ConnectWe
              </span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${USER_ROLES[userRole].colorScheme.bg} ${USER_ROLES[userRole].colorScheme.text} border ${USER_ROLES[userRole].colorScheme.border}`}>
                {USER_ROLES[userRole].badgeLabel}
              </span>
            </div>
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

      {/* Role Switcher in Sidebar (원클릭 전환) */}
      {!isCollapsed && onSelectUserRole && (
        <div className="p-2 border-b border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-900/60 shrink-0">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 mb-1.5 px-1 uppercase tracking-wider">
            <span>회원 등급 전환</span>
            <span className="text-[9px] font-medium text-slate-500">원클릭 전환</span>
          </div>
          <div className="grid grid-cols-3 gap-1 bg-slate-200/70 dark:bg-slate-800/80 p-0.5 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => onSelectUserRole('general')}
              className={`py-1.5 px-1 rounded-md text-center font-bold text-[11px] transition-all cursor-pointer ${
                userRole === 'general'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="일반 회원: 동문 주소록 & 소모임"
            >
              일반
            </button>
            <button
              type="button"
              onClick={() => onSelectUserRole('hidden')}
              className={`py-1.5 px-1 rounded-md text-center font-bold text-[11px] transition-all cursor-pointer ${
                userRole === 'hidden'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="Hidden 회원: 품격 있는 인맥 & 파트너십 관리"
            >
              Hidden
            </button>
            <button
              type="button"
              onClick={() => onSelectUserRole('master')}
              className={`py-1.5 px-1 rounded-md text-center font-bold text-[11px] transition-all cursor-pointer ${
                userRole === 'master'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
              title="마스터: DART 공시 & 기업 지배구조 전용 관제"
            >
              마스터
            </button>
          </div>
        </div>
      )}
      {isCollapsed && onSelectUserRole && (
        <div className="py-2 flex justify-center border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
          <button
            type="button"
            onClick={() => {
              const nextRole = userRole === 'general' ? 'hidden' : userRole === 'hidden' ? 'master' : 'general';
              onSelectUserRole(nextRole);
            }}
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all cursor-pointer ${USER_ROLES[userRole].colorScheme.bg} ${USER_ROLES[userRole].colorScheme.text} border ${USER_ROLES[userRole].colorScheme.border}`}
            title={`현재 등급: ${USER_ROLES[userRole].label} (클릭 시 다음 등급으로 전환)`}
          >
            {userRole === 'master' ? '👑' : userRole === 'hidden' ? 'H' : 'G'}
          </button>
        </div>
      )}

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
                  <span className="text-[11px] font-bold px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 uppercase tracking-wider font-mono">
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
                        ? 'bg-indigo-50/80 text-indigo-700 border border-indigo-150/90 shadow-2xs font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50 font-medium'
                    } ${isCollapsed ? 'justify-center px-0' : 'justify-between'}`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <IconComponent className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      {!isCollapsed && <span className="truncate">{item.label}</span>}
                    </div>

                    {!isCollapsed && renderBadge(item.badge, isActive)}
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
              ? 'flex items-center justify-center p-2 bg-slate-100 border-slate-200'
              : 'bg-gradient-to-b from-slate-100/90 via-slate-50/70 to-white border-slate-200/90 shadow-sm hover:border-slate-300'
          }`}
          title="ConnectWe AI Copilot 드로어 열기"
        >
          {isCollapsed ? (
            <Sparkles className="w-4 h-4 text-slate-700 animate-pulse" />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                  <Sparkles className="w-3.5 h-3.5 text-slate-700 shrink-0" />
                  <span>BARS AI Radar</span>
                </div>
                <span className="text-[11px] px-1.5 py-0.5 rounded-full font-bold bg-slate-200/80 text-slate-700 font-mono">
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
