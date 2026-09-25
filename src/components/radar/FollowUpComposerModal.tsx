import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { DebriefResult } from '../../services/meetingDebriefService';
import { generateFollowUpDrafts, FollowUpTone } from '../../services/followUpComposerService';
import { 
  Mail, MessageSquare, Copy, Check, X, 
  Sparkles, ShieldCheck
} from 'lucide-react';

interface FollowUpComposerModalProps {
  person: Person;
  debrief?: DebriefResult;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const FollowUpComposerModal: React.FC<FollowUpComposerModalProps> = ({
  person,
  debrief,
  onClose,
  onShowToast
}) => {
  const drafts = useMemo(() => generateFollowUpDrafts(person, debrief), [person, debrief]);
  const [selectedTone, setSelectedTone] = useState<FollowUpTone>('formal');
  const [channelMode, setChannelMode] = useState<'email' | 'kakao'>('email');
  const [copied, setCopied] = useState(false);

  const currentDraft = drafts.find(d => d.tone === selectedTone) || drafts[0];

  const handleCopy = () => {
    const textToCopy = channelMode === 'email'
      ? `제목: ${currentDraft.emailSubject}\n\n${currentDraft.emailBody}`
      : currentDraft.kakaoMessage;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    onShowToast(`${channelMode === 'email' ? '이메일 본문과 제목이' : '카카오톡 메시지가'} 클립보드에 복사되었습니다.`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Mail className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <span>미팅 감사 &amp; 정중한 후속 서신 제안</span>
                {person.sourceType === 'DART_FACT' ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300 font-bold flex items-center gap-0.5 font-mono">
                    <ShieldCheck className="w-3 h-3" />
                    공시 공인 임원
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold flex items-center gap-0.5">
                    혁신 비즈니스 파트너
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-slate-400">
                수신자: <strong className="text-white">{person.name}</strong> ({person.currentCompany} · {person.currentTitle})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tone Selector & Channel Toggle */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Tone Tabs */}
          <div className="flex items-center gap-1.5">
            {drafts.map(d => (
              <button
                key={d.tone}
                onClick={() => setSelectedTone(d.tone)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                  selectedTone === d.tone
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Channel Mode Toggle */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setChannelMode('email')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                channelMode === 'email'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>이메일</span>
            </button>
            <button
              onClick={() => setChannelMode('kakao')}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                channelMode === 'kakao'
                  ? 'bg-amber-500 text-slate-950'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>카카오톡 / DM</span>
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          
          {channelMode === 'email' ? (
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">이메일 제목</label>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 font-medium">
                  {currentDraft.emailSubject}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">이메일 본문</label>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 whitespace-pre-wrap leading-relaxed font-sans min-h-[220px]">
                  {currentDraft.emailBody}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-amber-400" />
                <span>모바일 메신저 최적화 문구 (카카오톡, 슬랙, 링크드인 DM)</span>
              </label>
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 whitespace-pre-wrap leading-relaxed font-sans min-h-[160px]">
                {currentDraft.kakaoMessage}
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800 bg-slate-950/60">
          <span className="text-[11px] text-slate-500">
            * 복사 후 메일 클라이언트 또는 메신저에 붙여넣기 하세요.
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs"
            >
              닫기
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all shadow-md shadow-indigo-600/30 active:scale-95 text-xs"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? '복사 완료!' : '문구 클립보드 복사'}</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
