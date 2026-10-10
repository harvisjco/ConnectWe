import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import {
  LetterScenarioType,
  LETTER_SCENARIOS,
  generateBusinessLetter
} from '../../services/businessLetterTemplateService';
import {
  FileText,
  X,
  Copy,
  Check,
  Send,
  Sparkles
} from 'lucide-react';

export interface BusinessLetterComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: Person | null;
  initialScenario?: LetterScenarioType;
  onShowToast: (msg: string) => void;
}

export const BusinessLetterComposerModal: React.FC<BusinessLetterComposerModalProps> = ({
  isOpen,
  onClose,
  person,
  initialScenario = 'TEA_TIME_INVITE',
  onShowToast
}) => {
  const [selectedScenario, setSelectedScenario] = useState<LetterScenarioType>(initialScenario);
  const [customTopic, setCustomTopic] = useState('');
  const [senderName, setSenderName] = useState('ConnectWe 파트너');
  const [senderOrg, setSenderOrg] = useState('비즈니스 파트너십팀');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialScenario) {
      setSelectedScenario(initialScenario);
    }
  }, [initialScenario]);

  // ESC 키 닫기 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const letterText = useMemo(() => {
    if (!person) return '';
    return generateBusinessLetter(person, selectedScenario, {
      senderName,
      senderCompany: senderOrg,
      customTopic
    });
  }, [person, selectedScenario, senderName, senderOrg, customTopic]);

  if (!isOpen || !person) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(letterText);
    setCopied(true);
    onShowToast('품격 있는 비즈니스 서신 전문이 클립보드에 복사되었습니다.');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent(`[ConnectWe] ${person.currentCompany} ${person.name} ${person.currentTitle}님께 드리는 인사`);
    const body = encodeURIComponent(letterText);
    window.location.href = `mailto:${person.email || ''}?subject=${subject}&body=${body}`;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="letter-modal-title"
    >
      <div
        className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 모달 헤더 */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-blue-900/10 via-indigo-900/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-600/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 id="letter-modal-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                상황별 1초 비즈니스 서신 템플릿 라이브러리
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  실무 에티켓 OS
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                수신인: <strong className="text-slate-800 dark:text-slate-200">{person.name}</strong> ({person.currentCompany} {person.currentTitle})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 바디 영역: 좌측 탭 & 옵션 / 우측 서신 뷰어 */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* 좌측: 5대 시나리오 선택 및 커스텀 옵션 (5 cols) */}
          <div className="lg:col-span-5 p-5 border-b lg:border-b-0 lg:border-r border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50/60 dark:bg-slate-900/40">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 block">
                상황별 표준 서신 선택
              </label>
              <div className="space-y-2">
                {LETTER_SCENARIOS.map((sc) => {
                  const isSelected = selectedScenario === sc.type;
                  return (
                    <button
                      key={sc.type}
                      type="button"
                      onClick={() => setSelectedScenario(sc.type)}
                      className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-white dark:bg-slate-800 border-blue-500/80 shadow-md shadow-blue-500/10'
                          : 'bg-white/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700/60 hover:bg-white dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-bold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'}`}>
                          {sc.title}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {sc.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                        {sc.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 커스텀 아젠다 및 발신자 정보 */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                문맥 커스텀 옵션 (선택)
              </h4>

              <div>
                <label className="text-[11px] font-medium text-slate-500 mb-1 block">
                  핵심 논의 아젠다 (예: 차세대 AI 아키텍처)
                </label>
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="미팅 목적 또는 논의 주제 입력..."
                  className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/30"
                />
                <div className="flex items-center gap-1.5 flex-wrap mt-2">
                  <span className="text-[10px] text-slate-400">추천 화두:</span>
                  {['AI 도메인 전략 협력', '투자 & IR 논의', '신규 사업 제휴', '조직 & 테크 리더십'].map((topic) => (
                    <button
                      key={topic}
                      type="button"
                      onClick={() => setCustomTopic(customTopic === topic ? '' : topic)}
                      className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all cursor-pointer ${
                        customTopic === topic 
                          ? 'bg-blue-600 text-white border-blue-600 font-bold shadow-2xs'
                          : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {topic}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">발신자 서명</label>
                  <input
                    type="text"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 mb-1 block">소속 부서/조직</label>
                  <input
                    type="text"
                    value={senderOrg}
                    onChange={(e) => setSenderOrg(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* 우측: 완성된 서신 뷰어 & 액션 버튼 (7 cols) */}
          <div className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  완성된 비즈니스 서신 미리보기
                </span>
                <span className="text-[11px] text-slate-400">
                  {letterText.length}자 (복사 즉시 전송 가능)
                </span>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50/90 dark:bg-slate-950 border border-slate-200/90 dark:border-slate-800 font-sans text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap select-all max-h-[460px] overflow-y-auto">
                {letterText}
              </div>
            </div>

            {/* 하단 툴바: 복사 & 메일 바로가기 */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                닫기
              </button>

              {person.email && (
                <button
                  type="button"
                  onClick={handleSendEmail}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5 text-slate-500" />
                  <span>이메일 앱으로 전송</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCopy}
                className={`px-5 py-2 text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                    : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>서신 복사 완료!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>원클릭 서신 복사</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

