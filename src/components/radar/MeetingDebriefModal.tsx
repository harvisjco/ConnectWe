import React, { useState } from 'react';
import { Person } from '../../types/network';
import { 
  analyzeMeetingDebrief, 
  createActivityLogFromDebrief, 
  DebriefResult, 
  ExtractedActionItem 
} from '../../services/meetingDebriefService';
import { 
  Mic, MicOff, Sparkles, CheckSquare, Plus, Trash2, 
  X, Save, ArrowRight, FileText
} from 'lucide-react';

interface MeetingDebriefModalProps {
  person: Person;
  onUpdatePerson: (updated: Person) => void;
  onOpenFollowUpComposer: (person: Person, debrief: DebriefResult) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const MeetingDebriefModal: React.FC<MeetingDebriefModalProps> = ({
  person,
  onUpdatePerson,
  onOpenFollowUpComposer,
  onClose,
  onShowToast
}) => {
  const [memoText, setMemoText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [debriefResult, setDebriefResult] = useState<DebriefResult | null>(null);

  // 음성 인식 (Web Speech API)
  const handleToggleVoice = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('현재 브라우저에서는 Web Speech 음성 인식을 지원하지 않습니다. 텍스트로 입력해주세요.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ko-KR';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setMemoText(prev => prev ? `${prev} ${transcript}` : transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // AI 분석 실행
  const handleAnalyze = () => {
    if (!memoText.trim()) {
      alert('미팅 메모 내용을 입력하거나 음성으로 말씀해주세요.');
      return;
    }

    setIsAnalyzing(true);
    setTimeout(() => {
      const result = analyzeMeetingDebrief(memoText, person);
      setDebriefResult(result);
      setIsAnalyzing(false);
    }, 400);
  };

  // 액션 아이템 추가
  const handleAddActionItem = () => {
    if (!debriefResult) return;
    const newItem: ExtractedActionItem = {
      id: `action-${Date.now()}`,
      task: '새로운 후속 액션 아이템',
      dueDate: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      assignee: 'ME',
      completed: false
    };
    setDebriefResult({
      ...debriefResult,
      actionItems: [...debriefResult.actionItems, newItem]
    });
  };

  // 액션 아이템 삭제
  const handleDeleteAction = (id: string) => {
    if (!debriefResult) return;
    setDebriefResult({
      ...debriefResult,
      actionItems: debriefResult.actionItems.filter(a => a.id !== id)
    });
  };

  // 최종 저장
  const handleSaveToPerson = () => {
    if (!debriefResult) return;

    const newLog = createActivityLogFromDebrief(person.id, debriefResult, memoText);
    const updatedPerson: Person = {
      ...person,
      lastContactDate: new Date().toISOString().slice(0, 10),
      isStale: false,
      activityLogs: [newLog, ...(person.activityLogs || [])]
    };

    onUpdatePerson(updatedPerson);
    onShowToast(`[${person.name}] 님과의 미팅 회고 및 액션 아이템이 활동 이력에 영구 기록되었습니다.`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-rose-600 flex items-center justify-center shadow-md shadow-rose-600/30">
              <Mic className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                미팅 직후 빠른 회고 &amp; AI 액션 아이템 추출
              </h2>
              <p className="text-[11px] text-slate-400">
                상대: <strong className="text-white">{person.name}</strong> ({person.currentCompany} · {person.currentTitle})
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

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-300">
          
          {/* Memo Input Area */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-slate-300 font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-indigo-400" />
                <span>미팅 내용 구두/텍스트 메모 (이동 중에 편하게 적어보세요)</span>
              </label>

              <button
                type="button"
                onClick={handleToggleVoice}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                  isListening 
                    ? 'bg-rose-600 text-white animate-pulse' 
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-3 h-3" />
                    <span>녹음 중... (클릭 시 중지)</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-3 h-3 text-rose-400" />
                    <span>음성으로 말하기</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={4}
              placeholder="예: 오늘 카카오 김도현 상무님 만나서 하반기 LLM PoC 도입 제안했고 반응 매우 우호적이었음. 다음 주 화요일까지 기술 견적서 보내주기로 약속함. 상대방 측에서는 예산안 결재 올릴 예정."
              value={memoText}
              onChange={(e) => setMemoText(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-xs leading-relaxed"
            />

            <div className="flex justify-end">
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !memoText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-all shadow-md shadow-indigo-600/30 active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isAnalyzing ? 'AI 분석 중...' : 'AI 액션 아이템 추출'}</span>
              </button>
            </div>
          </div>

          {/* AI Extraction Result Section */}
          {debriefResult && (
            <div className="space-y-4 pt-4 border-t border-slate-800 animate-in fade-in duration-300">
              
              {/* Summary & Mood Banner */}
              <div className="p-3.5 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>AI 미팅 브리핑 요약</span>
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                    debriefResult.sentiment === 'POSITIVE'
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                      : debriefResult.sentiment === 'CRITICAL'
                      ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                      : 'bg-slate-800 text-slate-300 border-slate-600'
                  }`}>
                    {debriefResult.sentiment === 'POSITIVE' ? '🟢 우호적 협의' : debriefResult.sentiment === 'CRITICAL' ? '🔴 신중 검토' : '🟡 중립 미팅'}
                  </span>
                </div>
                <p className="text-slate-300 text-xs leading-relaxed">
                  {debriefResult.summary}
                </p>
              </div>

              {/* Action Items List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1 text-[11px]">
                    <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    <span>도출된 후속 액션 아이템 ({debriefResult.actionItems.length}건)</span>
                  </span>
                  <button
                    onClick={handleAddActionItem}
                    className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-[11px] font-semibold"
                  >
                    <Plus className="w-3 h-3" /> 항목 추가
                  </button>
                </div>

                <div className="space-y-2">
                  {debriefResult.actionItems.map((action, i) => (
                    <div
                      key={action.id}
                      className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-bold text-slate-500 text-[11px] font-mono">0{i + 1}</span>
                        <input
                          type="text"
                          value={action.task}
                          onChange={(e) => {
                            const updated = [...debriefResult.actionItems];
                            updated[i].task = e.target.value;
                            setDebriefResult({ ...debriefResult, actionItems: updated });
                          }}
                          className="flex-1 bg-transparent text-white border-b border-transparent focus:border-indigo-500 focus:outline-none text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <input
                          type="date"
                          value={action.dueDate}
                          onChange={(e) => {
                            const updated = [...debriefResult.actionItems];
                            updated[i].dueDate = e.target.value;
                            setDebriefResult({ ...debriefResult, actionItems: updated });
                          }}
                          className="px-2 py-1 rounded bg-slate-800 text-[11px] text-indigo-300 border border-slate-700 focus:outline-none"
                        />
                        <button
                          onClick={() => handleDeleteAction(action.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bottom Actions: Log to Profile & Go to Follow-up */}
              <div className="pt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-800">
                <button
                  onClick={() => onOpenFollowUpComposer(person, debriefResult)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-indigo-500/30 font-semibold transition-all active:scale-95 text-xs"
                >
                  <span>✉️ 24시간 감사 팔로업 작성</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <div className="flex items-center gap-2 ml-auto">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 font-semibold text-xs"
                  >
                    닫기
                  </button>
                  <button
                    onClick={handleSaveToPerson}
                    className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all shadow-md shadow-emerald-600/30 active:scale-95 text-xs"
                  >
                    <Save className="w-4 h-4" />
                    <span>인맥 활동 이력에 영구 저장</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
