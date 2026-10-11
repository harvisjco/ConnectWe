import React, { useEffect } from 'react';
import { X, Command, EyeOff, LayoutDashboard, Users, Network, Clock, Compass, HelpCircle } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose
}) => {
  // ESC 키로 닫기
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: '글로벌 액션 & 보안',
      shortcuts: [
        { key: '⌘ K / Ctrl K', desc: '인텔리전트 전역 커맨드 팔레트 & 고속 검색', icon: Command },
        { key: 'Shift + P', desc: 'VIP 프라이버시 쉴드 & 다이내믹 워터마크 모드', icon: EyeOff },
        { key: '?', desc: '단축키 도움말 가이드 (현재 화면)', icon: HelpCircle },
        { key: 'Esc', desc: '열린 모달 / 드로어 / 팔레트 닫기', icon: X }
      ]
    },
    {
      title: '핵심 뷰 다이렉트 전환',
      shortcuts: [
        { key: '1', desc: '경영 사령탑 (Executive Command Center)', icon: LayoutDashboard },
        { key: '2', desc: '전체 인맥 명부 & 도메인 필터', icon: Users },
        { key: '3', desc: '2D 관계 캔버스 시각화', icon: Network },
        { key: '4', desc: '소통 타임라인 & 골든타임 환기', icon: Clock },
        { key: '5', desc: '7대 거점별 레이더 뷰', icon: Compass }
      ]
    }
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/60 dark:bg-slate-800/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/20">
              <Command className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                키보드 단축키 안내
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                마우스 없이 C-Level 인텔리전스를 초고속으로 탐색하세요
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {shortcutGroups.map((group, gIdx) => (
            <div key={gIdx} className="space-y-2.5">
              <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((sc, sIdx) => {
                  const Icon = sc.icon;
                  return (
                    <div
                      key={sIdx}
                      className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                    >
                      <div className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                        <Icon className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span>{sc.desc}</span>
                      </div>
                      <kbd className="px-2 py-1 text-[11px] font-mono font-bold rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-600 shadow-2xs">
                        {sc.key}
                      </kbd>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-800/20 text-center text-[11px] text-slate-400">
          어디서나 <kbd className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 font-mono text-[10px] text-slate-700 dark:text-slate-300 font-bold">?</kbd> 키를 누르면 이 도움말을 다시 열 수 있습니다.
        </div>
      </div>
    </div>
  );
};
