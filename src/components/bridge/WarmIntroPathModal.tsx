import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { findBestIntroPaths, WarmIntroPath } from '../../services/warmIntroPathFinder';
import { 
  X, Compass, Sparkles, Copy, Check, ArrowRight,
  MessageCircle, ExternalLink
} from 'lucide-react';

interface WarmIntroPathModalProps {
  people: Person[];
  initialTargetPerson?: Person | null;
  onClose: () => void;
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const WarmIntroPathModal: React.FC<WarmIntroPathModalProps> = ({
  people,
  initialTargetPerson,
  onClose,
  onSelectPerson,
  onShowToast
}) => {
  // '나'에 해당하는 인물 (closeness === 1 중 첫 번째 또는 people[0])
  const me = useMemo<Person>(() => {
    return people.find(p => p.closeness === 1) || people[0];
  }, [people]);

  // 타깃 인물 선택 상태
  const [targetPerson, setTargetPerson] = useState<Person | null>(() => {
    if (initialTargetPerson) return initialTargetPerson;
    // 기본값: 2촌 또는 3촌 인물 중 첫 번째
    const candidate = people.find(p => p.id !== me.id && (p.closeness >= 2 || !p.closeness));
    return candidate || people[1] || null;
  });

  // 선택된 소개 경로
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 최단 신뢰 경로 목록 산출
  const paths: WarmIntroPath[] = useMemo(() => {
    if (!targetPerson) return [];
    return findBestIntroPaths(me, targetPerson, people);
  }, [me, targetPerson, people]);

  const activePath = paths[selectedPathIndex] || paths[0] || null;

  // 서신 복사 핸들러
  const handleCopyLetter = () => {
    if (!activePath) return;
    navigator.clipboard.writeText(activePath.suggestedIntroLetter).then(() => {
      setCopiedKey(activePath.id);
      onShowToast(`[${activePath.intermediary.name}] 님께 보낼 소개 부탁 서신이 복사되었습니다.`);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Compass className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  최단 신뢰 소개 경로 파인더 (Warm Intro 2.0)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/40">
                  Dijkstra Trust Path
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                만나고 싶은 인재를 가장 높은 호감도와 성공 확률로 소개해 줄 수 있는 최적의 신뢰 가교를 탐색합니다.
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

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* Target Person Selector Header Card */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                {targetPerson?.name?.[0] || 'T'}
              </div>
              <div>
                <span className="text-[11px] font-bold text-indigo-600 block">만나고 싶은 관심 인재 (도착지)</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-slate-900">{targetPerson?.name || '인재를 선택해주세요'}</span>
                  <span className="text-xs text-slate-500">{targetPerson?.currentCompany} · {targetPerson?.currentTitle}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600 whitespace-nowrap">인재 변경:</span>
              <select
                value={targetPerson?.id || ''}
                onChange={(e) => {
                  const p = people.find(item => item.id === e.target.value);
                  setTargetPerson(p || null);
                  setSelectedPathIndex(0);
                }}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                {people.filter(p => p.id !== me.id).map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.currentCompany} · {p.currentTitle})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Intro Path Visualizer (The Core Node Hop Architecture) */}
          {activePath ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>발견된 최단 신뢰 경로 (총 {paths.length}개 후보 중 1순위 추천)</span>
                </span>
                <span className="text-xs font-bold text-slate-500">
                  신뢰 지수: <strong className="text-indigo-600">{activePath.trustScore}점</strong> / 100점
                </span>
              </div>

              {/* Graphical Path Visualizer Node Card */}
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

                  {/* Hop 1 Connection */}
                  <div className="flex flex-col items-center justify-center px-2">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 whitespace-nowrap">
                      1촌 직접 신뢰
                    </span>
                    <ArrowRight className="w-5 h-5 text-indigo-400 rotate-90 md:rotate-0 my-1 md:my-0" />
                  </div>

                  {/* Node 2: Intermediary (Key Bridge) */}
                  <div 
                    onClick={() => {
                      if (onSelectPerson) {
                        onSelectPerson(activePath.intermediary);
                        onClose();
                      }
                    }}
                    title="클릭 시 중개자 인맥 상세 프로필 열기"
                    className="flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 transition-colors text-white p-3.5 rounded-xl shadow-md shadow-indigo-600/20 ring-2 ring-indigo-400/40 w-full md:w-auto cursor-pointer"
                  >
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

                  {/* Hop 2 Connection */}
                  <div className="flex flex-col items-center justify-center px-2">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200 whitespace-nowrap">
                      {activePath.connectionTags[0] || '공통 인연'}
                    </span>
                    <ArrowRight className="w-5 h-5 text-indigo-400 rotate-90 md:rotate-0 my-1 md:my-0" />
                  </div>

                  {/* Node 3: Target Person */}
                  <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs w-full md:w-auto">
                    <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {targetPerson?.name?.[0]}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-purple-600 block">최종 도착지</span>
                        {targetPerson && onSelectPerson && (
                          <button
                            type="button"
                            onClick={() => onSelectPerson(targetPerson)}
                            className="text-[10px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5 cursor-pointer"
                            title="인재 프로필 상세 열기"
                          >
                            <span>상세</span>
                            <ExternalLink className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {targetPerson?.name} ({targetPerson?.currentCompany})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Connection Tags & Synergy Reason */}
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

              {/* Multiple Path Tabs (if more than 1 candidate) */}
              {paths.length > 1 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  <span className="text-xs font-bold text-slate-500 whitespace-nowrap">다른 소개 경로 후보:</span>
                  {paths.map((p, idx) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPathIndex(idx)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
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
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-black text-slate-900">
                      [{activePath.intermediary.name} {activePath.intermediary.currentTitle}] 님께 보낼 정중한 소개 부탁 서신:
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

                <p className="text-[11px] text-slate-400">
                  ※ 카카오톡, 이메일, 링크드인 메시지로 복사하여 즉시 보내실 수 있도록 완벽히 다듬어진 비즈니스 품격 서신입니다.
                </p>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-500 text-xs">
              선택된 인물과 연결된 소개 경로가 존재하지 않습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
