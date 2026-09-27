import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import { 
  findSynergyPairs, 
  generateDoubleOptInDrafts, 
  SynergyPair, 
  DoubleOptInTone, 
  DoubleOptInDrafts 
} from '../../services/warmIntroBridgeService';
import { 
  X, Share2, Sparkles, Copy, Check, ArrowRight, 
  UserCheck, ShieldCheck, HeartHandshake, CheckCircle2
} from 'lucide-react';

interface WarmIntroConnectorModalProps {
  people: Person[];
  initialPersonA?: Person;
  initialPersonB?: Person;
  onClose: () => void;
  onSelectPerson: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const WarmIntroConnectorModal: React.FC<WarmIntroConnectorModalProps> = ({
  people,
  initialPersonA,
  initialPersonB,
  onClose,
  onSelectPerson,
  onShowToast
}) => {
  // 시스템 AI 시너지 매칭 페어 목록 산출
  const synergyPairs = useMemo(() => {
    return findSynergyPairs(people);
  }, [people]);

  // 선택된 두 인물 슬롯
  const [selectedPersonA, setSelectedPersonA] = useState<Person | null>(() => {
    return initialPersonA || (synergyPairs.length > 0 ? synergyPairs[0].personA : (people[0] || null));
  });

  const [selectedPersonB, setSelectedPersonB] = useState<Person | null>(() => {
    return initialPersonB || (synergyPairs.length > 0 ? synergyPairs[0].personB : (people[1] || null));
  });

  // 서신 설정 상태
  const [stepTab, setStepTab] = useState<'step1' | 'step2' | 'step3'>('step1');
  const [tone, setTone] = useState<DoubleOptInTone>('formal');
  const [purpose, setPurpose] = useState<string>('비즈니스 시너지 탐색 및 친교 티타임');
  const [customDraft, setCustomDraft] = useState<string>('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 실시간 서신 생성
  const drafts: DoubleOptInDrafts | null = useMemo(() => {
    if (!selectedPersonA || !selectedPersonB) return null;
    return generateDoubleOptInDrafts('홍길동', selectedPersonA, selectedPersonB, purpose, tone);
  }, [selectedPersonA, selectedPersonB, purpose, tone]);

  // 탭 변경 시 에디터 텍스트 동기화
  useEffect(() => {
    if (!drafts) return;
    if (stepTab === 'step1') setCustomDraft(drafts.step1AskPersonA);
    else if (stepTab === 'step2') setCustomDraft(drafts.step2AskPersonB);
    else setCustomDraft(drafts.step3DirectThreeWayIntro);
  }, [stepTab, drafts]);

  const handleApplySynergyPair = (pair: SynergyPair) => {
    setSelectedPersonA(pair.personA);
    setSelectedPersonB(pair.personB);
    onShowToast(`[${pair.personA.name} ↔ ${pair.personB.name}] 시너지 조합이 선택되었습니다.`);
  };

  const handleCopyMessage = () => {
    if (!customDraft) return;
    navigator.clipboard.writeText(customDraft).then(() => {
      setCopiedKey(stepTab);
      onShowToast(
        stepTab === 'step1'
          ? `[${selectedPersonA?.name}] 님 사전 동의 서신이 복사되었습니다.`
          : stepTab === 'step2'
          ? `[${selectedPersonB?.name}] 님 사전 동의 서신이 복사되었습니다.`
          : '3자 다이렉트 연결 최종 서신이 복사되었습니다.'
      );
      setTimeout(() => setCopiedKey(null), 2500);
    }).catch(() => {
      onShowToast('클립보드 복사에 실패했습니다.');
    });
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-2xs">
              <Share2 className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">두 인연을 잇는 지능형 커넥터</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 font-mono">
                  Double Opt-in Engine
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                신뢰할 수 있는 주선자로서 두 사람에게 사전에 정중히 의사를 타진하고, 동의 시 3자 연결 서신을 완성합니다.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          
          {/* AI Synergy Pair Recommended Strip */}
          {synergyPairs.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>AI 상호 시너지 매칭 추천 조합</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  클릭 시 바로 연결 슬롯에 장착됩니다
                </span>
              </div>

              <div className="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
                {synergyPairs.map(pair => {
                  const isCurrent = 
                    selectedPersonA?.id === pair.personA.id && selectedPersonB?.id === pair.personB.id;
                  return (
                    <button
                      key={pair.id}
                      onClick={() => handleApplySynergyPair(pair)}
                      className={`p-3 rounded-2xl border text-left shrink-0 w-72 transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-indigo-50/70 border-indigo-300 ring-2 ring-indigo-200 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-indigo-700 font-mono">
                          시너지 {pair.matchScore}점
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200">
                          {pair.synergyTitle.slice(0, 14)}...
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-xs font-bold text-slate-900">
                        <span className="truncate max-w-[110px]">{pair.personA.name} ({pair.personA.currentCompany})</span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[110px]">{pair.personB.name} ({pair.personB.currentCompany})</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-1">
                        {pair.synergyReason}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2-Slot Connector Visualizer */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border border-slate-200/90 flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Slot A */}
            <div className="w-full md:w-5/12 p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>첫 번째 인연 (Person A)</span>
                <span className="text-indigo-600 font-semibold">소개 제안 대상</span>
              </div>
              <select
                aria-label="첫 번째 인연 (Person A) 선택"
                value={selectedPersonA?.id || ''}
                onChange={e => {
                  const p = people.find(item => item.id === e.target.value);
                  if (p) setSelectedPersonA(p);
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {people.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.currentCompany} · {p.currentTitle})
                  </option>
                ))}
              </select>
              {selectedPersonA && (
                <div 
                  onClick={() => onSelectPerson(selectedPersonA)}
                  className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer hover:underline"
                >
                  <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{selectedPersonA.currentCompany} {selectedPersonA.currentTitle}</span>
                  {selectedPersonA.sourceType === 'DART_FACT' && (
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  )}
                </div>
              )}
            </div>

            {/* Center Bridge Icon */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <div className="p-3 rounded-2xl bg-indigo-600 text-white shadow-md">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold text-indigo-600 mt-1 uppercase font-mono">Bridge</span>
            </div>

            {/* Slot B */}
            <div className="w-full md:w-5/12 p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                <span>두 번째 인연 (Person B)</span>
                <span className="text-emerald-600 font-semibold">파트너십 연결 대상</span>
              </div>
              <select
                aria-label="두 번째 인연 (Person B) 선택"
                value={selectedPersonB?.id || ''}
                onChange={e => {
                  const p = people.find(item => item.id === e.target.value);
                  if (p) setSelectedPersonB(p);
                }}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              >
                {people.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.currentCompany} · {p.currentTitle})
                  </option>
                ))}
              </select>
              {selectedPersonB && (
                <div 
                  onClick={() => onSelectPerson(selectedPersonB)}
                  className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer hover:underline"
                >
                  <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>{selectedPersonB.currentCompany} {selectedPersonB.currentTitle}</span>
                  {selectedPersonB.sourceType === 'DART_FACT' && (
                    <ShieldCheck className="w-3 h-3 text-emerald-500" />
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Double Opt-in 3단계 탭 인터페이스 */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
              {/* 3단계 프로세스 탭 */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setStepTab('step1')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    stepTab === 'step1'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] text-white flex items-center justify-center">1</span>
                  <span>A님 사전 동의 서신</span>
                </button>

                <button
                  onClick={() => setStepTab('step2')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    stepTab === 'step2'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <span className="w-4 h-4 rounded-full bg-indigo-500 text-[10px] text-white flex items-center justify-center">2</span>
                  <span>B님 사전 동의 서신</span>
                </button>

                <button
                  onClick={() => setStepTab('step3')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                    stepTab === 'step3'
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>3자 연결 최종 서신</span>
                </button>
              </div>

              {/* 톤 선택기 */}
              <div className="flex items-center gap-1">
                {(['formal', 'warm', 'executive'] as DoubleOptInTone[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTone(t)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition-all ${
                      tone === t
                        ? 'bg-indigo-100 text-indigo-900 font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {t === 'formal' ? '정중한 비즈니스' : t === 'warm' ? '따뜻한 친교' : '경영진 파트너십'}
                  </button>
                ))}
              </div>
            </div>

            {/* 서신 에디터 & 카피 영역 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {stepTab === 'step1' && `1단계: ${selectedPersonA?.name || 'A'} 님께 ${selectedPersonB?.name || 'B'} 님을 소개해드려도 괜찮을지 먼저 여쭙는 서신입니다.`}
                  {stepTab === 'step2' && `2단계: ${selectedPersonA?.name || 'A'} 님의 호응을 바탕으로 ${selectedPersonB?.name || 'B'} 님의 의사를 확인하는 서신입니다.`}
                  {stepTab === 'step3' && `3단계: 양측 모두 흔쾌히 동의하셨을 때, 세 사람이 함께 있는 대화방이나 이메일로 발송하는 공식 연결 서신입니다.`}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">수정 가능</span>
              </div>

              <textarea
                aria-label="Double Opt-in 서신 내용"
                value={customDraft}
                onChange={e => setCustomDraft(e.target.value)}
                rows={9}
                className="w-full p-4 rounded-2xl bg-slate-50 border border-slate-200/90 text-xs text-slate-800 leading-relaxed font-sans focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:bg-white transition-all resize-none"
              />

              <div className="flex items-center justify-between">
                <input
                  type="text"
                  value={purpose}
                  onChange={e => setPurpose(e.target.value)}
                  placeholder="연결 목적 (예: AI 딥테크 협력, 투자 IR, 가벼운 친교 티타임)"
                  className="w-2/3 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />

                <button
                  onClick={handleCopyMessage}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer ${
                    copiedKey === stepTab
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 hover:bg-slate-800 text-white'
                  }`}
                >
                  {copiedKey === stepTab ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>클립보드 복사 완료!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>이 단계 서신 복사하기</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
          <div className="text-xs text-slate-500">
            글로벌 비즈니스 표준 Double Opt-in을 준수하여 양측의 프라이버시를 지키고 주선자의 품격을 높입니다.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-semibold transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
