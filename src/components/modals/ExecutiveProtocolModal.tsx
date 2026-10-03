import React, { useState, useMemo } from 'react';
import { 
  X, 
  ShieldCheck, 
  Gift, 
  HeartHandshake, 
  Copy, 
  Check, 
  MessageSquare, 
  FileText, 
  Sparkles
} from 'lucide-react';
import { Person } from '../../types/network';
import { 
  ProtocolEventType, 
  generateProtocolMessage, 
  resolveProtocolAction 
} from '../../services/executiveProtocolService';

interface ExecutiveProtocolModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  initialEventType?: ProtocolEventType;
  onUpdatePerson: (updatedPerson: Person) => void;
  onShowToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const ExecutiveProtocolModal: React.FC<ExecutiveProtocolModalProps> = ({
  isOpen,
  onClose,
  person,
  initialEventType = 'CONDOLENCE',
  onUpdatePerson,
  onShowToast
}) => {
  const [selectedType, setSelectedType] = useState<ProtocolEventType>(initialEventType);
  const [activeFormat, setActiveFormat] = useState<'short' | 'formal' | 'ribbon'>('short');
  const [customText, setCustomText] = useState<string>('');
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // 이벤트 타입이 변경될 때마다 서신 템플릿 재생성
  const messageResult = useMemo(() => {
    if (!person) return null;
    return generateProtocolMessage(person, selectedType);
  }, [person, selectedType]);

  // 포맷 탭 전환 시 텍스트 동기화
  React.useEffect(() => {
    if (!messageResult) return;
    if (activeFormat === 'short') {
      setCustomText(messageResult.shortMessage);
    } else if (activeFormat === 'formal') {
      setCustomText(messageResult.formalLetter);
    } else {
      setCustomText(messageResult.ribbonCardText);
    }
  }, [messageResult, activeFormat]);

  if (!isOpen || !person || !messageResult) return null;

  const compliance = messageResult.compliance;

  // 서신 복사 및 소통 완결 루프
  const handleCopyAndResolve = async () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(customText).catch(() => {});
      }
    } catch {
      // headless fallback
    }

    setIsCopied(true);
    const updated = resolveProtocolAction(person, selectedType, customText);
    onUpdatePerson(updated);

    onShowToast(
      `[${person.name}] 님께 보낼 의전 서신이 복사되었으며, 오늘 소통 이력이 안전하게 보존되었습니다.`,
      'success'
    );

    setTimeout(() => {
      setIsCopied(false);
      onClose();
    }, 1200);
  };

  const eventTypes: { type: ProtocolEventType; label: string; icon: string }[] = [
    { type: 'CONDOLENCE', label: '삼가 조의 (부고)', icon: '🕯️' },
    { type: 'CONGRATULATION_WEDDING', label: '혼사 축의 (결혼)', icon: '💍' },
    { type: 'CONGRATULATION_PROMOTION', label: '영전/취임 축하', icon: '🎉' },
    { type: 'HOLIDAY_GREETING', label: '명절(설/추석) 의전', icon: '🎑' },
    { type: 'FOUNDING_ANNIVERSARY', label: '창립기념일', icon: '🏢' },
    { type: 'BIRTHDAY', label: '생신 축하', icon: '🎂' }
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Gift className="w-4 h-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                C-Suite 경조사 의전 & 정중 서신 컨시어지
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {person.name} {person.currentTitle} ({person.currentCompany}) · 비즈니스 결례 0% 안심 의전
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* 청탁금지법(김영란법) 안심 체크 박스 */}
          <div className={`p-4 rounded-xl border ${
            compliance.isSubjectToLaw 
              ? 'bg-amber-50/70 border-amber-200 dark:bg-amber-950/30 dark:border-amber-900/60 text-amber-900 dark:text-amber-200'
              : 'bg-emerald-50/70 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-900/60 text-emerald-900 dark:text-emerald-200'
          }`}>
            <div className="flex items-start gap-2.5">
              <ShieldCheck className={`w-4 h-4 mt-0.5 shrink-0 ${
                compliance.isSubjectToLaw ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
              }`} />
              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <span>{compliance.categoryLabel}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                    compliance.isSubjectToLaw 
                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                  }`}>
                    {compliance.isSubjectToLaw ? '청탁금지법 적용 대상' : '기업 컴플라이언스 준수'}
                  </span>
                </div>
                <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
                  {compliance.guidanceNote}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div className="bg-white/70 dark:bg-slate-900/70 p-1.5 rounded-lg border border-black/5 dark:border-white/5">
                    <span className="block text-[10px] text-slate-400">축의·조의금</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{compliance.cashLimit}</span>
                  </div>
                  <div className="bg-white/70 dark:bg-slate-900/70 p-1.5 rounded-lg border border-black/5 dark:border-white/5">
                    <span className="block text-[10px] text-slate-400">화환·조화</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{compliance.wreathLimit}</span>
                  </div>
                  <div className="bg-white/70 dark:bg-slate-900/70 p-1.5 rounded-lg border border-black/5 dark:border-white/5">
                    <span className="block text-[10px] text-slate-400">선물 한도</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{compliance.giftLimit}</span>
                  </div>
                  <div className="bg-white/70 dark:bg-slate-900/70 p-1.5 rounded-lg border border-black/5 dark:border-white/5">
                    <span className="block text-[10px] text-slate-400">식사 가액</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{compliance.diningLimit}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 6대 경조사 탭 */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              경조사 및 의전 이벤트 선택
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {eventTypes.map(item => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setSelectedType(item.type)}
                  className={`py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    selectedType === item.type
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 3대 서신 포맷 탭 (단문 / 장문 / 리본) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                서신 템플릿 & 맞춤 편집
              </label>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl text-xs">
                <button
                  type="button"
                  onClick={() => setActiveFormat('short')}
                  className={`py-1 px-2.5 rounded-lg font-medium transition-all ${
                    activeFormat === 'short'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <MessageSquare className="w-3 h-3" />
                    <span>모바일 (단문)</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormat('formal')}
                  className={`py-1 px-2.5 rounded-lg font-medium transition-all ${
                    activeFormat === 'formal'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    <span>격식 서신 (장문)</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveFormat('ribbon')}
                  className={`py-1 px-2.5 rounded-lg font-medium transition-all ${
                    activeFormat === 'ribbon'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>화환/난 리본 축문</span>
                  </span>
                </button>
              </div>
            </div>

            <textarea
              rows={6}
              value={customText}
              onChange={e => setCustomText(e.target.value)}
              className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="서신 내용을 자유롭게 수정하십시오..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <HeartHandshake className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>복사 즉시 오늘 자 의전 활동 로그가 자동 저장됩니다.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleCopyAndResolve}
              className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-md shadow-indigo-600/20 active:scale-[0.98] cursor-pointer"
            >
              {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              <span>{isCopied ? '복사 및 의전 완료!' : '서신 복사 & 의전 완료'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
