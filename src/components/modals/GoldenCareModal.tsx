import React, { useState, useEffect } from 'react';
import { Person } from '../../types/network';
import {
  GoldenCareMessageDraft,
  calculateGapDays,
  generateGoldenCareDrafts,
  resolveGoldenCareContact,
  requestNotificationPermission
} from '../../services/goldenCareService';
import {
  BellRing,
  Sparkles,
  Clock,
  Copy,
  Check,
  MessageSquare,
  Mail,
  Coffee,
  ShieldCheck,
  X,
  CheckCircle2,
  Calendar
} from 'lucide-react';

interface GoldenCareModalProps {
  isOpen: boolean;
  person: Person | null;
  onClose: () => void;
  onUpdatePerson: (updatedPerson: Person) => void;
  onShowToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  onOpenMeetingStudio?: (person: Person) => void;
}

export const GoldenCareModal: React.FC<GoldenCareModalProps> = ({
  isOpen,
  person,
  onClose,
  onUpdatePerson,
  onShowToast,
  onOpenMeetingStudio
}) => {
  if (!isOpen || !person) return null;

  const gapDays = calculateGapDays(person.lastContactDate);
  const [drafts, setDrafts] = useState<GoldenCareMessageDraft[]>(() =>
    generateGoldenCareDrafts(person)
  );
  const [selectedThemeIndex, setSelectedThemeIndex] = useState<number>(0);
  const [activeChannel, setActiveChannel] = useState<'sms' | 'email'>('sms');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      return Notification.permission === 'granted';
    }
    return false;
  });

  // Re-generate drafts when person changes
  useEffect(() => {
    setDrafts(generateGoldenCareDrafts(person));
    setSelectedThemeIndex(0);
    setIsCopied(false);
  }, [person]);

  // 전역 ESC 키 닫기 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const activeDraft = drafts[selectedThemeIndex] || drafts[0];

  // Editable body state
  const [customSms, setCustomSms] = useState<string>(activeDraft.smsBody);
  const [customEmailSubject, setCustomEmailSubject] = useState<string>(activeDraft.emailSubject);
  const [customEmailBody, setCustomEmailBody] = useState<string>(activeDraft.emailBody);

  // Sync custom state when theme changes
  useEffect(() => {
    if (activeDraft) {
      setCustomSms(activeDraft.smsBody);
      setCustomEmailSubject(activeDraft.emailSubject);
      setCustomEmailBody(activeDraft.emailBody);
    }
  }, [selectedThemeIndex, drafts]);

  // Request browser notification
  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setHasNotificationPermission(granted);
    if (granted) {
      onShowToast('데스크톱 안심 알림이 활성화되었습니다. 출근 시 골든타임 VIP를 알려드립니다.', 'success');
    } else {
      onShowToast('브라우저 설정에서 알림 권한을 확인해주세요.', 'info');
    }
  };

  // One-click Copy & Resolve Loop
  const handleCopyAndComplete = async () => {
    const textToCopy = activeChannel === 'sms' 
      ? customSms 
      : `${customEmailSubject}\n\n${customEmailBody}`;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(textToCopy).catch(() => {});
      }
    } catch {
      // Graceful fallback for non-secure / headless browser contexts
    }

    setIsCopied(true);

    // Resolve contact in person record
    const updated = resolveGoldenCareContact(person, textToCopy);
    onUpdatePerson(updated);

    onShowToast(
      `[${person.name}] 님께 보낼 서신이 복사되었으며, 오늘 소통 이력이 안전하게 기록되었습니다.`,
      'success'
    );

    setTimeout(() => {
      setIsCopied(false);
      onClose();
    }, 1200);
  };

  // Urgency color helper
  const getUrgencyBadge = () => {
    if (gapDays >= 180) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-rose-500" />
          {gapDays}일 소통 공백 (최우선 케어)
        </span>
      );
    }
    if (gapDays >= 90) {
      return (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
          <Clock className="w-3.5 h-3.5 text-amber-500" />
          {gapDays}일 소통 공백 (주의)
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 flex items-center gap-1">
        <Clock className="w-3.5 h-3.5 text-indigo-500" />
        {gapDays}일 소통 공백 (안부 권장)
      </span>
    );
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-2xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center shrink-0">
              <BellRing className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  VIP 골든타임 능동형 케어 &amp; 안부 서신 코파일럿
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-200 border border-amber-400/30">
                  Golden Care Radar
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                소중한 인연이 소홀해지지 않도록 계절과 공시 팩트에 맞춘 정중한 안부 서신을 원터치로 완성합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Profile Card */}
        <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
              {person.name.slice(0, 1)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">{person.name}</span>
                <span className="text-slate-500">{person.currentTitle}</span>
                <span className="font-semibold text-slate-700">· {person.currentCompany}</span>
              </div>
              <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                {person.dartInfo?.isPublicDirector && (
                  <span className="px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-700 font-semibold flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-indigo-600" />
                    DART 공시 임원
                  </span>
                )}
                {person.primaryDomain && (
                  <span className="px-1.5 py-0.2 rounded bg-slate-200/70 text-slate-700">
                    {person.primaryDomain}
                  </span>
                )}
                <span>마지막 소통: {person.lastContactDate || '소통 기록 없음'}</span>
              </div>
            </div>
          </div>
          <div>{getUrgencyBadge()}</div>
        </div>

        {/* Desktop Notification Banner */}
        {!hasNotificationPermission && (
          <div className="px-4 sm:px-6 py-2.5 bg-amber-50/70 border-b border-amber-200/60 flex items-center justify-between gap-2 text-xs text-amber-900 shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                매일 아침 출근 시 골든타임 도래 VIP를 데스크톱 알림으로 받아보시겠습니까?
              </span>
            </div>
            <button
              type="button"
              onClick={handleRequestPermission}
              className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-all cursor-pointer whitespace-nowrap shadow-2xs"
            >
              알림 허용하기
            </button>
          </div>
        )}

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {/* 4-Theme Tabs */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              4대 맞춤형 안부 테마 선택
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {drafts.map((d, idx) => {
                const isSelected = idx === selectedThemeIndex;
                return (
                  <button
                    key={d.theme}
                    type="button"
                    onClick={() => setSelectedThemeIndex(idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-500/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-bold text-slate-900 flex items-center justify-between">
                      {d.themeLabel}
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                    </span>
                    <span className="text-[10px] text-slate-500 line-clamp-1">
                      {d.theme === 'seasonal_greeting' && '계절/환절기 맞춤'}
                      {d.theme === 'congratulations' && '최근 공시·성과 축하'}
                      {d.theme === 'casual_coffee' && '부담 없는 티타임'}
                      {d.theme === 'business_synergy' && '산업 동향 및 협업'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Channel Selector: SMS vs Email */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveChannel('sms')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChannel === 'sms'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>카카오톡 / 문자 (단문)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveChannel('email')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeChannel === 'email'
                    ? 'bg-slate-900 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>이메일 서신 (장문)</span>
              </button>
            </div>
            <span className="text-[11px] text-slate-400">
              {activeChannel === 'sms'
                ? `${customSms.length}자 (품격 에티켓 톤)`
                : '정중한 비즈니스 격식'}
            </span>
          </div>

          {/* Editor Area */}
          {activeChannel === 'sms' ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold">문자/카톡 발송 문구</span>
                <span className="text-[11px] text-slate-400">자유롭게 편집 가능합니다</span>
              </div>
              <textarea
                value={customSms}
                onChange={(e) => setCustomSms(e.target.value)}
                rows={5}
                className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none shadow-2xs font-sans"
              />
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  이메일 제목
                </label>
                <input
                  type="text"
                  value={customEmailSubject}
                  onChange={(e) => setCustomEmailSubject(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs font-semibold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  이메일 본문
                </label>
                <textarea
                  value={customEmailBody}
                  onChange={(e) => setCustomEmailBody(e.target.value)}
                  rows={8}
                  className="w-full p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 text-slate-800 text-xs leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none shadow-2xs font-sans"
                />
              </div>
            </div>
          )}

          {/* Bridge CTA: Teatime Copilot */}
          {onOpenMeetingStudio && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/40 border border-indigo-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-indigo-950">
                <Coffee className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  안부와 함께 즉시 미팅 일정을 잡고 싶으신가요?
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenMeetingStudio(person);
                }}
                className="px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>티타임 코파일럿 조율</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-all cursor-pointer"
          >
            닫기
          </button>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyAndComplete}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>복사 및 소통 기록 완료!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>서신 복사 &amp; 오늘 소통 완료 처리</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
