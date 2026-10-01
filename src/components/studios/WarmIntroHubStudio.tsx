import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import { findBestIntroPaths, WarmIntroPath } from '../../services/warmIntroPathFinder';
import { 
  X, Compass, Sparkles, Copy, Check, ArrowRight,
  MessageCircle, ExternalLink, Link2
} from 'lucide-react';

export interface WarmIntroHubStudioProps {
  isOpen: boolean;
  initialTab?: 'find_path' | 'connect_two';
  people: Person[];
  targetPerson?: Person | null;
  personA?: Person | null;
  personB?: Person | null;
  onClose: () => void;
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const WarmIntroHubStudio: React.FC<WarmIntroHubStudioProps> = ({
  isOpen,
  initialTab = 'find_path',
  people,
  targetPerson: initialTargetPerson,
  personA: initialPersonA,
  personB: initialPersonB,
  onClose,
  onSelectPerson,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'find_path' | 'connect_two'>(initialTab);

  // '나'에 해당하는 인물
  const me = useMemo<Person>(() => {
    return people.find(p => p.closeness === 1) || {
      id: 'p-me',
      name: '나 (대표)',
      currentCompany: 'ConnectWe',
      currentDepartment: '경영총괄',
      currentTitle: '대표이사',
      mobile: '010-0000-0000',
      email: 'me@connectwe.com',
      closeness: 1,
      sourceType: 'SOURCE_DATA',
      skills: [],
      careers: [],
      academics: [],
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: '경영/전략',
      isStale: false,
      connectionChannel: 'manual'
    };
  }, [people]);

  // --- TAB 1: 소개받기 (최단 경로) 상태 ---
  const [selectedTarget, setSelectedTarget] = useState<Person | null>(() => {
    if (initialTargetPerson) return initialTargetPerson;
    return people.find(p => p.id !== me.id && (p.closeness >= 2 || !p.closeness)) || people[1] || null;
  });
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 최단 신뢰 경로 목록 산출
  const paths: WarmIntroPath[] = useMemo(() => {
    if (!selectedTarget) return [];
    return findBestIntroPaths(me, selectedTarget, people);
  }, [me, selectedTarget, people]);

  const activePath = paths[selectedPathIndex] || paths[0] || null;

  // --- TAB 2: 두 사람 이어주기 (Double Opt-in) 상태 ---
  const otherPeople = useMemo(() => people.filter(p => p.id !== me.id), [people, me]);
  const [selectedPersonA, setSelectedPersonA] = useState<Person | null>(() => initialPersonA || otherPeople[0] || null);
  const [selectedPersonB, setSelectedPersonB] = useState<Person | null>(() => initialPersonB || otherPeople[1] || null);
  const [introReason, setIntroReason] = useState<string>('상호 비즈니스 시너지 모색 및 티타임 교류');
  const [copiedIntroForA, setCopiedIntroForA] = useState(false);
  const [copiedIntroForB, setCopiedIntroForB] = useState(false);

  // ESC 키 핸들링
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // 서신 복사 (소개 부탁)
  const handleCopyLetter = () => {
    if (!activePath) return;
    navigator.clipboard.writeText(activePath.suggestedIntroLetter).then(() => {
      setCopiedKey(activePath.id);
      onShowToast(`[${activePath.intermediary.name}] 님께 보낼 소개 부탁 서신이 복사되었습니다.`);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  // 두 사람 잇기 서신 생성
  const letterForA = selectedPersonA && selectedPersonB ? `${selectedPersonA.name} ${selectedPersonA.currentTitle}님, 안녕하십니까.

평소 존경하는 ${selectedPersonB.currentCompany}의 ${selectedPersonB.name} ${selectedPersonB.currentTitle}님과 비즈니스 교류를 나누던 중, ${selectedPersonA.name} 대표님과 함께 나누시면 큰 시너지가 날 만한 주제(${introReason})가 있어 정중히 연결해 드리고자 합니다.

혹시 결례가 되지 않는다면 두 분께서 가볍게 차 한 잔 나누실 수 있도록 자리를 주선해 드려도 괜찮을지 여쭙고자 합니다. 편히 의견 주시면 감사하겠습니다.

감사합니다.
배상` : '';

  const letterForB = selectedPersonA && selectedPersonB ? `${selectedPersonB.name} ${selectedPersonB.currentTitle}님, 안녕하십니까.

지난번 말씀 나누었던 ${introReason}과 관련하여, 제가 각별히 신뢰하는 ${selectedPersonA.currentCompany}의 ${selectedPersonA.name} ${selectedPersonA.currentTitle}님을 정중히 소개해 드리고자 합니다.

두 분께서 귀한 인연으로 발전하시기를 기대하며, 양측 모두 일정이 편안하실 때 따뜻한 티타임 모실 수 있도록 안내해 드리겠습니다.

감사합니다.
배상` : '';

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Studio Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  신뢰 소개 허브 스튜디오 (Warm Intro Hub Studio)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  Trust Path &amp; Double Opt-in
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                만나고 싶은 인재와의 최단 신뢰 소개 경로 탐색과 두 인연을 품격 있게 이어주는 Double Opt-in을 원스톱으로 지원합니다.
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

        {/* Sub Header Tabs */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('find_path')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'find_path'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-indigo-400" />
              <span>최단 신뢰 소개 경로 (소개받기)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('connect_two')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'connect_two'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              <span>두 인연 이어주기 (Double Opt-in)</span>
            </button>
          </div>

          <span className="text-[11px] text-slate-500 font-medium">
            상호 존중과 신뢰 기반의 품격 있는 네트워크 가교를 구축합니다.
          </span>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: 최단 신뢰 소개 경로 파인더 */}
          {activeTab === 'find_path' && (
            <div className="space-y-6">
              {/* Target Selector */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {selectedTarget?.name?.[0] || 'T'}
                  </div>
                  <div>
                    <span className="text-[11px] font-bold text-indigo-600 block">만나고 싶은 관심 인재 (도착지)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900">{selectedTarget?.name || '인재를 선택해주세요'}</span>
                      <span className="text-xs text-slate-500">{selectedTarget?.currentCompany} · {selectedTarget?.currentTitle}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 whitespace-nowrap">인재 변경:</span>
                  <select
                    value={selectedTarget?.id || ''}
                    onChange={(e) => {
                      const p = people.find(item => item.id === e.target.value);
                      setSelectedTarget(p || null);
                      setSelectedPathIndex(0);
                    }}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 cursor-pointer"
                  >
                    {people.filter(p => p.id !== me.id).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.currentCompany} · {p.currentTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Node Hop Visualizer */}
              {activePath ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>발견된 최단 신뢰 경로 (총 {paths.length}개 후보 중 1순위 추천)</span>
                    </span>
                    <span className="font-bold text-slate-500">
                      신뢰 지수: <strong className="text-indigo-600">{activePath.trustScore}점</strong> / 100점
                    </span>
                  </div>

                  <div className="rounded-2xl border-2 border-indigo-200/80 bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 p-5 shadow-xs">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                      {/* Node 1: Me */}
                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs w-full md:w-auto">
                        <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          나
                        </div>
                        <div className="truncate">
                          <span className="text-[10px] font-bold text-slate-400 block">출발 노드</span>
                          <span className="text-xs font-bold text-slate-900 truncate">{me.name} ({me.currentCompany})</span>
                        </div>
                      </div>

                      {/* Hop 1 */}
                      <div className="flex flex-col items-center justify-center px-2">
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                          1촌 직접 신뢰
                        </span>
                        <ArrowRight className="w-5 h-5 text-indigo-400 rotate-90 md:rotate-0 my-1 md:my-0" />
                      </div>

                      {/* Node 2: Intermediary */}
                      <div className="flex items-center gap-3 bg-indigo-600 text-white p-3.5 rounded-xl shadow-md shadow-indigo-600/20 ring-2 ring-indigo-400/40 w-full md:w-auto">
                        <div className="w-10 h-10 rounded-lg bg-white/20 text-white flex items-center justify-center font-bold text-sm shrink-0">
                          {activePath.intermediary.name[0]}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 uppercase">
                              최적 신뢰 가교
                            </span>
                            <span className="text-xs font-black">{activePath.intermediary.name}</span>
                          </div>
                          <span className="text-[11px] text-indigo-100 truncate block">
                            {activePath.intermediary.currentCompany} · {activePath.intermediary.currentTitle}
                          </span>
                        </div>
                      </div>

                      {/* Hop 2 */}
                      <div className="flex flex-col items-center justify-center px-2">
                        <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 whitespace-nowrap">
                          {activePath.connectionTags[0] || '공통 인연'}
                        </span>
                        <ArrowRight className="w-5 h-5 text-indigo-400 rotate-90 md:rotate-0 my-1 md:my-0" />
                      </div>

                      {/* Node 3: Target */}
                      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs w-full md:w-auto">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {selectedTarget?.name?.[0]}
                        </div>
                        <div className="truncate">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-purple-600 block">최종 도착지</span>
                            {selectedTarget && onSelectPerson && (
                              <button
                                type="button"
                                onClick={() => onSelectPerson(selectedTarget)}
                                className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
                                title="프로필 상세 열기"
                              >
                                <span>상세</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </button>
                            )}
                          </div>
                          <span className="text-xs font-bold text-slate-900 truncate">
                            {selectedTarget?.name} ({selectedTarget?.currentCompany})
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-indigo-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] font-bold text-slate-500">인연 연결 고리:</span>
                        {activePath.connectionTags.map((tag, idx) => (
                          <span key={idx} className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white border border-indigo-200 text-indigo-800 shadow-2xs">
                            ✓ {tag}
                          </span>
                        ))}
                      </div>
                      <div className="text-[11px] text-slate-600 font-medium italic">
                        "{activePath.synergyReason}"
                      </div>
                    </div>
                  </div>

                  {/* Multiple Path Tabs */}
                  {paths.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                      <span className="font-bold text-slate-500 whitespace-nowrap">다른 소개 경로 후보:</span>
                      {paths.map((p, idx) => (
                        <button
                          key={p.id}
                          onClick={() => setSelectedPathIndex(idx)}
                          className={`px-3 py-1.5 rounded-full font-semibold whitespace-nowrap transition-all cursor-pointer ${
                            selectedPathIndex === idx
                              ? 'bg-slate-900 text-white shadow-2xs'
                              : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                          }`}
                        >
                          {idx + 1}순위: {p.intermediary.name} (신뢰도 {p.trustScore}점)
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Letter Draft Box */}
                  <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-indigo-600" />
                        <span className="font-black text-slate-900">
                          [{activePath.intermediary.name} {activePath.intermediary.currentTitle}] 님께 보낼 소개 부탁 서신:
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleCopyLetter}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all active:scale-95 shadow-xs cursor-pointer"
                      >
                        {copiedKey === activePath.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === activePath.id ? '복사 완료' : '원터치 서신 복사'}</span>
                      </button>
                    </div>

                    <pre className="text-xs text-slate-700 bg-slate-50 p-4 rounded-xl border border-slate-200 whitespace-pre-wrap font-sans leading-relaxed">
                      {activePath.suggestedIntroLetter}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  선택된 인물과 연결된 소개 경로가 존재하지 않습니다.
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 두 사람 이어주기 (Double Opt-in) */}
          {activeTab === 'connect_two' && (
            <div className="space-y-6">
              {/* Select Person A and Person B */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">소개할 첫 번째 인연 (인재 A):</span>
                  <select
                    value={selectedPersonA?.id || ''}
                    onChange={e => {
                      const p = people.find(item => item.id === e.target.value);
                      setSelectedPersonA(p || null);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                  >
                    {otherPeople.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.currentCompany} · {p.currentTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                  <span className="font-bold text-slate-700 block">소개받을 두 번째 인연 (인재 B):</span>
                  <select
                    value={selectedPersonB?.id || ''}
                    onChange={e => {
                      const p = people.find(item => item.id === e.target.value);
                      setSelectedPersonB(p || null);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-semibold text-slate-800"
                  >
                    {otherPeople.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.currentCompany} · {p.currentTitle})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Intro Reason Input */}
              <div className="space-y-1.5 text-xs">
                <label className="font-bold text-slate-700 block">소개 주선 사유 및 기대 시너지 화두:</label>
                <input 
                  type="text" 
                  value={introReason}
                  onChange={e => setIntroReason(e.target.value)}
                  placeholder="예: AI 에이전트 인프라 도입 협력, 시리즈B 투자 검토, 전략적 사업 제휴"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Double Opt-in Letters */}
              {selectedPersonA && selectedPersonB && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Step 1: Letter to A */}
                  <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="font-black text-slate-900">1단계: [{selectedPersonA.name}] 님께 사전 의사 타진</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(letterForA);
                          setCopiedIntroForA(true);
                          onShowToast(`[${selectedPersonA.name}] 님 의사 타진 서신이 복사되었습니다.`);
                          setTimeout(() => setCopiedIntroForA(false), 2000);
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        {copiedIntroForA ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIntroForA ? '복사됨' : '서신 복사'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {letterForA}
                    </pre>
                  </div>

                  {/* Step 2: Letter to B */}
                  <div className="rounded-2xl border border-slate-200 p-4 bg-white space-y-2 text-xs">
                    <div className="flex items-center justify-between pb-1 border-b border-slate-100">
                      <span className="font-black text-slate-900">2단계: [{selectedPersonB.name}] 님께 정중한 소개 서신</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(letterForB);
                          setCopiedIntroForB(true);
                          onShowToast(`[${selectedPersonB.name}] 님 소개 서신이 복사되었습니다.`);
                          setTimeout(() => setCopiedIntroForB(false), 2000);
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800"
                      >
                        {copiedIntroForB ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedIntroForB ? '복사됨' : '서신 복사'}</span>
                      </button>
                    </div>
                    <pre className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {letterForB}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
