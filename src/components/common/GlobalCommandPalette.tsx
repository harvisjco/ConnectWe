import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Person } from '../../types/network';
import { NavViewType } from './SidebarLNB';
import { 
  Search, User, Briefcase, Zap, 
  MapPin, Award, Building2, Sparkles, 
  ArrowRight, X, Mic, Compass, BarChart2, UploadCloud, Coffee, Bell,
  Gift, Headphones, GitMerge, Users, Rocket
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
  onOpenVoiceDebrief?: () => void;
  onOpenWarmIntroPath?: () => void;
  onOpenWeeklyBrief?: () => void;
  onOpenBatchCardScanner?: () => void;
  onOpenTeaTimeModal?: (targetPerson?: Person) => void;
  onOpenGoldenCare?: (targetPerson?: Person) => void;
  onOpenProtocol?: (targetPerson?: Person) => void;
  onOpenAudioBriefing?: (targetPerson?: Person) => void;
  onOpenCrossBoardSynergy?: (targetCorp?: string) => void;
  onOpenSquadBuilder?: () => void;
  onOpenVentureRadar?: () => void;
  onNavigateView: (view: NavViewType) => void;
}

export const GlobalCommandPalette: React.FC<GlobalCommandPaletteProps> = ({
  isOpen,
  onClose,
  people,
  onSelectPerson,
  onOpenMeetingBriefing,
  onOpenVoiceDebrief,
  onOpenWarmIntroPath,
  onOpenWeeklyBrief,
  onOpenBatchCardScanner,
  onOpenTeaTimeModal,
  onOpenGoldenCare,
  onOpenProtocol,
  onOpenAudioBriefing,
  onOpenCrossBoardSynergy,
  onOpenSquadBuilder,
  onOpenVentureRadar,
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

    // 2. 스마트 C-Level 액션
    const smartActions = [
      onOpenVoiceDebrief && {
        id: 'action-voice-debrief',
        category: '스마트 액션',
        title: '🎙️ 이동 중 30초 음성 회고 AI (Voice Debrief)',
        subtitle: '마이크 원터치로 요약·액션아이템·딜·감사서신 자동 정리',
        icon: Mic,
        badge: 'C-Level AI',
        keywords: ['음성', '회고', '음성회고', 'debrief', 'voice', '미팅', '회의'],
        onExecute: () => {
          onOpenVoiceDebrief();
          onClose();
        }
      },
      onOpenWarmIntroPath && {
        id: 'action-warm-intro',
        category: '스마트 액션',
        title: '🧭 최단 신뢰 소개 경로 파인더 (Warm Intro 2.0)',
        subtitle: '관심 인재를 가장 높은 성공 확률로 소개해 줄 최적의 신뢰 가교 탐색',
        icon: Compass,
        badge: '신뢰 경로',
        keywords: ['소개', '경로', '소개경로', 'warm', 'intro', '다리', '인연', '가교'],
        onExecute: () => {
          onOpenWarmIntroPath();
          onClose();
        }
      },
      onOpenWeeklyBrief && {
        id: 'action-weekly-brief',
        category: '스마트 액션',
        title: '📊 C-Level 월요 전략 주간 브리프 (Weekly Board Report)',
        subtitle: '핵심 딜, DART 공시 변동, 소통 공백 VIP 1-Page A4 인쇄/PDF 리포트',
        icon: BarChart2,
        badge: '전략 리포트',
        keywords: ['주간', '브리프', '주간브리프', 'weekly', 'report', '리포트', '보고서', '이사회'],
        onExecute: () => {
          onOpenWeeklyBrief();
          onClose();
        }
      },
      onOpenBatchCardScanner && {
        id: 'action-batch-scan',
        category: '스마트 액션',
        title: '📇 연속 명함 일괄 스캔 & 실시간 DART 결합 (Batch Scanner)',
        subtitle: '최대 20장 명함 이미지 일괄 드롭 & 상장사 임원 팩트 자동 매칭',
        icon: UploadCloud,
        badge: '일괄 등록',
        keywords: ['명함', '스캔', '명함스캔', 'batch', '일괄', '카드', 'dart'],
        onExecute: () => {
          onOpenBatchCardScanner();
          onClose();
        }
      },
      onOpenTeaTimeModal && {
        id: 'action-tea-time',
        category: '스마트 액션',
        title: '☕ 경영진 티타임 의제 AI 코파일럿 & 캘린더 초대 (.ICS)',
        subtitle: 'DART 팩트 기반 3대 맞춤 의제 카드 자동 생성 & 표준 캘린더 초대장 원클릭',
        icon: Coffee,
        badge: '의제 코파일럿',
        keywords: ['티타임', '의제', 'teatime', 'agenda', 'ics', '캘린더', '초대장', '커피'],
        onExecute: () => {
          onOpenTeaTimeModal();
          onClose();
        }
      },
      onOpenGoldenCare && {
        id: 'action-golden-care',
        category: '스마트 액션',
        title: '🔔 VIP 골든타임 능동형 케어 & 4대 안부 서신 코파일럿',
        subtitle: '60/90/180일 소통 공백 VIP 맞춤 서신 자동 합성 및 데스크톱 알림',
        icon: Bell,
        badge: '골든 케어',
        keywords: ['안부', '골든타임', '소통', '서신', '카톡', '문자', '이메일', '공백', 'care', 'cadence'],
        onExecute: () => {
          onOpenGoldenCare();
          onClose();
        }
      },
      onOpenProtocol && {
        id: 'action-protocol',
        category: '스마트 액션',
        title: '🎁 C-Suite 경조사 의전 컨시어지 & 정중 서신',
        subtitle: '부고·혼사·영전·명절·생신 감지 & 청탁금지법 안심 가이드 & 리본 축문',
        icon: Gift,
        badge: '경조사 의전',
        keywords: ['경조사', '의전', '부고', '조의', '결혼', '축의', '영전', '명절', '화환', '김영란법', '청탁금지법', 'protocol'],
        onExecute: () => {
          onOpenProtocol();
          onClose();
        }
      },
      onOpenAudioBriefing && {
        id: 'action-audio-briefing',
        category: '스마트 액션',
        title: '🎧 에어팟 앰비언트 30초 오디오 브리핑 (라디오 모드)',
        subtitle: '미팅 10분 전 차량 이동 중 핸즈프리 3단계 음성 팩트체크 (TTS)',
        icon: Headphones,
        badge: '에어팟 브리핑',
        keywords: ['오디오', '브리핑', '에어팟', '음성', 'tts', '팟캐스트', '핸즈프리', 'audio', 'briefing'],
        onExecute: () => {
          onOpenAudioBriefing();
          onClose();
        }
      },
      onOpenCrossBoardSynergy && {
        id: 'action-cross-board',
        category: '스마트 액션',
        title: '🏢 전략적 M&A & 크로스 보드 시뮬레이터 (Cross-Board Simulator)',
        subtitle: '기업 간 이사회 겹침망·사외이사·알럼나이 분석 & 3대 신뢰 가교 경로 도출',
        icon: GitMerge,
        badge: 'M&A 시너지',
        keywords: ['시너지', '크로스보드', '합작', '제휴', 'm&a', '이사회', '알럼나이', '지분', 'synergy', 'board', 'cross'],
        onExecute: () => {
          onOpenCrossBoardSynergy();
          onClose();
        }
      },
      onOpenSquadBuilder && {
        id: 'action-squad-builder',
        category: '스마트 액션',
        title: '🎯 스마트 프로젝트 팀 빌더 & 스킬 매칭 스튜디오',
        subtitle: '실무 인재(개발/디자인/PM/마케팅) 보유 스킬 매칭 & 가상 스쿼드 편성',
        icon: Users,
        badge: '팀 빌더',
        keywords: ['팀', '스쿼드', '프로젝트', '팀빌더', '인재', '개발자', '디자이너', 'pm', '스킬', 'squad', 'builder'],
        onExecute: () => {
          onOpenSquadBuilder();
          onClose();
        }
      },
      onOpenVentureRadar && {
        id: 'action-venture-radar',
        category: '스마트 액션',
        title: '🚀 초기 스타트업 창업 & 시드 펀딩 레이더 (파운더스 클럽)',
        subtitle: '동문·동료의 스텔스 창업, 팁스(TIPS) 선정, 시드 투자 유치 감지 & 파운딩 스쿼드 지원',
        icon: Rocket,
        badge: '창업 레이더',
        keywords: ['창업', '스타트업', '시드', '펀딩', '파운더', 'tips', 'stealth', '스텔스', '투자', 'founder', 'venture'],
        onExecute: () => {
          onOpenVentureRadar();
          onClose();
        }
      }
    ].filter(Boolean) as Array<CommandAction & { keywords: string[] }>;

    smartActions.forEach(action => {
      const isMatch = !q || 
        action.title.toLowerCase().includes(q) || 
        action.subtitle.toLowerCase().includes(q) || 
        action.keywords.some(kw => kw.toLowerCase().includes(q) || q.includes(kw.toLowerCase()));
      if (isMatch) {
        result.push(action);
      }
    });

    // 3. 인물 검색 및 1초 브리핑 액션 (상위 6명)
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
                  role="button"
                  tabIndex={0}
                  onClick={() => action.onExecute()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      action.onExecute();
                    }
                  }}
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
