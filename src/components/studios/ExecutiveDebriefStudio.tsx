import React, { useState, useEffect, useRef } from 'react';
import { Person, ActivityLog } from '../../types/network';
import { 
  analyzeVoiceDebrief, 
  VoiceDebriefAnalysis 
} from '../../services/voiceDebriefEngine';
import { 
  Mic, MicOff, Sparkles, X, Check, Copy,
  Briefcase, CheckSquare, 
  UserCheck, RotateCcw, Save, Keyboard
} from 'lucide-react';

interface ISpeechRecognitionEvent {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface ISpeechRecognition {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

export interface ExecutiveDebriefStudioProps {
  isOpen: boolean;
  initialMode?: 'voice' | 'text';
  person: Person | null;
  people: Person[];
  onClose: () => void;
  onUpdatePerson: (updatedPerson: Person) => void;
  onShowToast: (msg: string) => void;
}

export const ExecutiveDebriefStudio: React.FC<ExecutiveDebriefStudioProps> = ({
  isOpen,
  initialMode = 'voice',
  person,
  people,
  onClose,
  onUpdatePerson,
  onShowToast
}) => {
  const [activeMode, setActiveMode] = useState<'voice' | 'text'>(initialMode);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(person || (people.length > 0 ? people[0] : null));
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<VoiceDebriefAnalysis | null>(null);
  const [activeResultTab, setActiveResultTab] = useState<'summary' | 'actions' | 'deal' | 'letter'>('summary');
  const [isCopied, setIsCopied] = useState(false);

  // 음성 인식 Web Speech API 참조
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    if (person) {
      setSelectedPerson(person);
    } else if (!selectedPerson && people.length > 0) {
      setSelectedPerson(people[0]);
    }
  }, [person, people]);

  // ESC 키 핸들링
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Web Speech API 초기화
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const win = window as unknown as {
        SpeechRecognition?: new () => ISpeechRecognition;
        webkitSpeechRecognition?: new () => ISpeechRecognition;
      };
      const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;
      if (SpeechRec) {
        const recognition = new SpeechRec();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'ko-KR';

        recognition.onresult = (event: ISpeechRecognitionEvent) => {
          let currentText = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentText += event.results[i][0].transcript;
          }
          setTranscript(prev => (prev ? `${prev} ${currentText}` : currentText).trim());
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  if (!isOpen) return null;

  // 음성 녹음 토글
  const handleToggleVoice = () => {
    if (!recognitionRef.current) {
      alert('사용하시는 브라우저가 실시간 음성 인식을 지원하지 않습니다. 텍스트 모드로 입력해 주세요.');
      setActiveMode('text');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  // AI 분석 실행
  const handleAnalyze = async () => {
    if (!transcript.trim()) return;
    setIsAnalyzing(true);
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    await new Promise(r => setTimeout(r, 600));

    try {
      const res = analyzeVoiceDebrief(transcript, people, selectedPerson || undefined);
      setAnalysis(res);
      if (!selectedPerson && res.matchedPerson) {
        setSelectedPerson(res.matchedPerson);
      }
      onShowToast(`미팅 회고 분석이 완료되었습니다. [${res.matchedPerson.name}] 님 매칭.`);
    } catch {
      onShowToast('회고 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 감사 서신 복사
  const handleCopyLetter = () => {
    if (!analysis) return;
    navigator.clipboard.writeText(analysis.followUpLetter);
    setIsCopied(true);
    onShowToast('24시간 내 발송용 감사 서신이 복사되었습니다.');
    setTimeout(() => setIsCopied(false), 2000);
  };

  // 인맥 정보에 저장
  const handleSaveToPerson = () => {
    if (!analysis) return;
    const target = selectedPerson || analysis.matchedPerson;

    const todayStr = new Date().toISOString().slice(0, 10);
    const loggedAtStr = new Date().toISOString().replace('T', ' ').slice(0, 16);
    const newActivity: ActivityLog = {
      id: `act-${Date.now()}`,
      personId: target.id,
      type: 'meeting',
      title: `[30초 회고] ${analysis.summary.slice(0, 40)}...`,
      content: `${analysis.summary}\n\n[실행 과제]:\n${analysis.actionItems.map(a => `• ${a.task} (${a.dueDate})`).join('\n')}`,
      loggedAt: loggedAtStr
    };

    const updatedPerson: Person = {
      ...target,
      lastContactDate: todayStr,
      isStale: false,
      activityLogs: [newActivity, ...(target.activityLogs || [])],
      memo: target.memo 
        ? `${target.memo}\n[${todayStr} 미팅 회고]: ${analysis.summary}`
        : `[${todayStr} 미팅 회고]: ${analysis.summary}`
    };

    onUpdatePerson(updatedPerson);
    onShowToast(`[${target.name}] 님의 인맥 정보에 미팅 회고가 성공적으로 업데이트되었습니다.`);
    onClose();
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Studio Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Mic className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  미팅 회고 &amp; 감사 서신 스튜디오 (Executive Debrief Studio)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  Voice &amp; Text Debrief
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                미팅 직후 30초 음성 또는 텍스트로 요약·액션아이템·딜·24h 감사서신을 원스톱 정리합니다.
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

        {/* Sub Header: Person Selector & Input Mode Switcher */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          {/* Target Person Selector */}
          <div className="flex items-center gap-2 min-w-0">
            <UserCheck className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-bold text-slate-700 whitespace-nowrap">미팅 인물:</span>
            <select
              value={selectedPerson?.id || ''}
              onChange={(e) => {
                const p = people.find(item => item.id === e.target.value);
                setSelectedPerson(p || null);
              }}
              className="text-xs font-semibold px-2.5 py-1 rounded-xl border border-slate-200 bg-white text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[220px] truncate"
            >
              <option value="">(자동 감지 모드)</option>
              {people.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.currentCompany})
                </option>
              ))}
            </select>
          </div>

          {/* Input Mode Tabs */}
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveMode('voice')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'voice'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-amber-300" />
              <span>🎙️ 이동 중 음성 모드</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveMode('text')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeMode === 'text'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Keyboard className="w-3.5 h-3.5" />
              <span>⌨️ 텍스트 타이핑 모드</span>
            </button>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Input Box: Voice or Text */}
          <div className="relative rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50/60 to-white p-5 flex flex-col items-center justify-center text-center space-y-4">
            {activeMode === 'voice' && (
              <div className="relative">
                {isListening && (
                  <div className="absolute -inset-3 rounded-full bg-rose-500/20 animate-ping pointer-events-none" />
                )}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 cursor-pointer active:scale-95 ${
                    isListening
                      ? 'bg-rose-600 text-white ring-4 ring-rose-300 shadow-rose-600/30'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30'
                  }`}
                  title={isListening ? '음성 녹음 중지' : '음성 녹음 시작'}
                >
                  {isListening ? (
                    <MicOff className="w-7 h-7 animate-pulse text-white" />
                  ) : (
                    <Mic className="w-7 h-7 text-white" />
                  )}
                </button>
              </div>
            )}

            <div className="space-y-1">
              <span className={`text-xs font-bold ${isListening ? 'text-rose-600 font-mono animate-pulse' : 'text-slate-700'}`}>
                {activeMode === 'voice' 
                  ? (isListening ? '🎙️ 실시간 음성 청취 중... (다 말씀하신 후 아래 분석 버튼을 눌러주세요)' : '마이크를 눌러 음성으로 말씀하시거나 아래 스크립트를 수정하세요')
                  : '미팅에서 나눈 핵심 대화와 결정 사항을 편안하게 입력하세요'}
              </span>
              <p className="text-[11px] text-slate-400">
                예: "오늘 카카오 김대표 만나서 시리즈B 50억 라운드 참여 긍정적 검토 확정했고, 다음 주 수요일까지 IR 자료 보내주기로 했어."
              </p>
            </div>

            {/* Transcript Textarea */}
            <div className="w-full text-left space-y-1.5 pt-1">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span>미팅 회고 스크립트</span>
                {transcript && (
                  <button 
                    type="button"
                    onClick={() => setTranscript('')} 
                    className="text-[11px] text-slate-400 hover:text-rose-500 flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" /> 초기화
                  </button>
                )}
              </div>
              <textarea
                rows={3}
                value={transcript}
                onChange={(e) => setTranscript(e.target.value)}
                placeholder="음성으로 말씀하시거나 직접 타이핑하여 내용을 입력하실 수 있습니다..."
                className="w-full text-xs text-slate-800 p-3 rounded-xl border border-slate-200/90 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            {/* Run Analysis Button */}
            <button
              type="button"
              disabled={!transcript.trim() || isAnalyzing}
              onClick={handleAnalyze}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
            >
              {isAnalyzing ? (
                <>
                  <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
                  <span>C-Level AI 회고 심층 분석 중...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>30초 회고 분석 및 구조화 실행</span>
                </>
              )}
            </button>
          </div>

          {/* Analysis Results */}
          {analysis && (
            <div className="rounded-2xl border border-indigo-150 bg-indigo-50/30 p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-indigo-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-xs font-black text-slate-900">
                    분석 완료: [{analysis.matchedPerson.name} {analysis.matchedPerson.currentTitle}]
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {analysis.sentiment}
                  </span>
                </div>

                {/* Sub Tab Switcher */}
                <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-slate-200/80 text-xs">
                  <button
                    onClick={() => setActiveResultTab('summary')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      activeResultTab === 'summary' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    핵심 요약
                  </button>
                  <button
                    onClick={() => setActiveResultTab('actions')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      activeResultTab === 'actions' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    실행 과제 ({analysis.actionItems.length})
                  </button>
                  {analysis.dealUpdate && (
                    <button
                      onClick={() => setActiveResultTab('deal')}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                        activeResultTab === 'deal' ? 'bg-indigo-600 text-white' : 'text-indigo-600 hover:bg-indigo-50'
                      }`}
                    >
                      딜 연계
                    </button>
                  )}
                  <button
                    onClick={() => setActiveResultTab('letter')}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                      activeResultTab === 'letter' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    감사 서신
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Summary */}
              {activeResultTab === 'summary' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                  <span className="font-bold text-slate-800 block">3문장 핵심 브리핑:</span>
                  <p className="text-slate-700 leading-relaxed font-medium">{analysis.summary}</p>
                  {analysis.keyTopics.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-2">
                      <span className="text-[11px] font-bold text-slate-400">주요 키워드:</span>
                      {analysis.keyTopics.map((topic, i) => (
                        <span key={i} className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                          #{topic}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Action Items */}
              {activeResultTab === 'actions' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
                  <span className="font-bold text-slate-800 block">자동 추출된 후속 실행 과제:</span>
                  <div className="space-y-2">
                    {analysis.actionItems.map((item) => (
                      <div key={item.id} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                        <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <span className="font-semibold text-slate-800">{item.task}</span>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 font-medium">
                            <span>담당: {item.assignee === 'ME' ? '본인' : item.assignee === 'PARTNER' ? '상대방' : '공동'}</span>
                            <span>·</span>
                            <span className="text-indigo-600 font-semibold">마감: {item.dueDate}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Deal Update */}
              {activeResultTab === 'deal' && analysis.dealUpdate && (
                <div className="bg-white p-4 rounded-xl border border-indigo-200 space-y-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900">감지된 비즈니스 딜 파이프라인 연계</span>
                  </div>
                  <div className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-150 space-y-1.5">
                    <div className="font-bold text-slate-900">{analysis.dealUpdate.dealTitle}</div>
                    <div className="flex items-center gap-2 text-slate-600 text-[11px]">
                      <span>단계: <strong className="text-indigo-700">{analysis.dealUpdate.stageLabel}</strong></span>
                      {analysis.dealUpdate.estimatedAmount && (
                        <>
                          <span>·</span>
                          <span>추정 규모: <strong className="text-slate-900">{analysis.dealUpdate.estimatedAmount}</strong></span>
                        </>
                      )}
                      <span>·</span>
                      <span>성사 확률: <strong>{analysis.dealUpdate.probability}%</strong></span>
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 4: Follow-up Letter */}
              {activeResultTab === 'letter' && (
                <div className="bg-white p-4 rounded-xl border border-slate-200/80 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">24시간 내 품격 감사 서신 (C-Level Executive Tone):</span>
                    <button
                      type="button"
                      onClick={handleCopyLetter}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-bold border border-indigo-200 transition-all cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? '복사 완료' : '서신 복사'}</span>
                    </button>
                  </div>
                  <pre className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-lg border border-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                    {analysis.followUpLetter}
                  </pre>
                </div>
              )}

              {/* Final Confirm Save Button */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleSaveToPerson}
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 active:scale-95 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>인맥 정보 &amp; 소통 이력에 즉시 반영 저장</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
