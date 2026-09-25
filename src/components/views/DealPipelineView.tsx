import React, { useState } from 'react';
import { Person } from '../../types/network';
import { 
  BusinessDeal, 
  DealStage, 
  KeymanRole, 
  loadDealsFromStorage, 
  saveDealsToStorage, 
  calculateDealHealthScore 
} from '../../services/dealPipelineService';
import { 
  Briefcase, Plus, ShieldCheck, 
  DollarSign, ChevronRight, X, Trash2, FileText, Send
} from 'lucide-react';

interface DealPipelineViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
  onOpenDossier?: (person: Person) => void;
  onOpenBridgeModal?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

const STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: 'PROSPECT', label: '1. 기회 탐색', color: 'border-slate-200 dark:border-slate-700 bg-slate-100/60 dark:bg-slate-900/60' },
  { id: 'WARM_CONTACT', label: '2. 신뢰 접점 형성', color: 'border-blue-200 dark:border-indigo-500/40 bg-blue-50/40 dark:bg-indigo-950/20' },
  { id: 'MEETING_HELD', label: '3. 미팅 완료', color: 'border-purple-200 dark:border-purple-500/40 bg-purple-50/40 dark:bg-purple-950/20' },
  { id: 'PROPOSAL', label: '4. 제안서 송부', color: 'border-sky-200 dark:border-sky-500/40 bg-sky-50/40 dark:bg-sky-950/20' },
  { id: 'NEGOTIATION', label: '5. 조건 협상', color: 'border-amber-200 dark:border-amber-500/40 bg-amber-50/40 dark:bg-amber-950/20' },
  { id: 'WON', label: '6. 수주 완료', color: 'border-emerald-200 dark:border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20' },
];

export const DealPipelineView: React.FC<DealPipelineViewProps> = ({
  people,
  onSelectPerson,
  onOpenDossier,
  onOpenBridgeModal,
  onShowToast
}) => {
  const [deals, setDeals] = useState<BusinessDeal[]>(() => loadDealsFromStorage(people));
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [activeDealForAddStakeholder, setActiveDealForAddStakeholder] = useState<BusinessDeal | null>(null);

  // 신규 딜 생성 폼 상태
  const [newTitle, setNewTitle] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newDealSize, setNewDealSize] = useState('10억원 규모');
  const [newCloseDate, setNewCloseDate] = useState('2026-12-31');

  // 스테이지 변경
  const handleStageChange = (dealId: string, newStage: DealStage) => {
    const updated = deals.map(d => d.id === dealId ? { ...d, stage: newStage } : d);
    setDeals(updated);
    saveDealsToStorage(updated);
    onShowToast('딜 파이프라인 단계가 업데이트되었습니다.');
  };

  // 딜 삭제
  const handleDeleteDeal = (dealId: string) => {
    if (!confirm('이 비즈니스 딜을 삭제하시겠습니까?')) return;
    const updated = deals.filter(d => d.id !== dealId);
    setDeals(updated);
    saveDealsToStorage(updated);
    onShowToast('딜이 안전하게 삭제되었습니다.');
  };

  // 신규 딜 추가
  const handleCreateDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newCompany.trim()) return;

    // 해당 기업의 인맥 자동 탐색하여 1차 stakeholder로 추천 배정
    const matchedPeople = people.filter(p => 
      p.currentCompany.toLowerCase().includes(newCompany.toLowerCase())
    );

    const initialStakeholders = matchedPeople.slice(0, 2).map((p, idx) => ({
      personId: p.id,
      personName: p.name,
      company: p.currentCompany,
      title: p.currentTitle,
      role: (idx === 0 ? 'CHAMPION' : 'INFLUENCER') as KeymanRole,
      closeness: p.closeness,
      isDartExecutive: p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector
    }));

    const newDeal: BusinessDeal = {
      id: `deal-${Date.now()}`,
      title: newTitle.trim(),
      targetCompany: newCompany.trim(),
      targetIndustry: 'IT / 엔터프라이즈',
      dealSize: newDealSize.trim(),
      stage: 'PROSPECT',
      expectedCloseDate: newCloseDate,
      stakeholders: initialStakeholders,
      healthScore: calculateDealHealthScore(initialStakeholders),
      notes: '신규 전략 딜 파이프라인 수립됨'
    };

    const updated = [newDeal, ...deals];
    setDeals(updated);
    saveDealsToStorage(updated);
    onShowToast(`[${newDeal.title}] 딜이 성공적으로 생성되었습니다.`);
    setIsAddModalOpen(false);
    setNewTitle('');
    setNewCompany('');
  };

  // 키맨 추가
  const handleAddStakeholder = (personId: string, role: KeymanRole) => {
    if (!activeDealForAddStakeholder) return;
    const target = people.find(p => p.id === personId);
    if (!target) return;

    const newStakeholder = {
      personId: target.id,
      personName: target.name,
      company: target.currentCompany,
      title: target.currentTitle,
      role,
      closeness: target.closeness,
      isDartExecutive: target.sourceType === 'DART_FACT' || !!target.dartInfo?.isPublicDirector
    };

    const updatedDeals = deals.map(d => {
      if (d.id === activeDealForAddStakeholder.id) {
        const updatedStakeholders = [...d.stakeholders.filter(s => s.personId !== target.id), newStakeholder];
        return {
          ...d,
          stakeholders: updatedStakeholders,
          healthScore: calculateDealHealthScore(updatedStakeholders)
        };
      }
      return d;
    });

    setDeals(updatedDeals);
    saveDealsToStorage(updatedDeals);
    onShowToast(`[${target.name}] 님과 함께하는 프로젝트 파트너십이 등록되었습니다.`);
    setActiveDealForAddStakeholder(null);
  };

  return (
    <div className="space-y-4">
      {/* 1. Header & Control Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-indigo-950/80 border border-blue-200 dark:border-indigo-500/40 text-blue-600 dark:text-indigo-400">
            <Briefcase className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">전략 비즈니스 딜 파이프라인 협업 룸</h2>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 font-semibold">
                C-Level Deal Pipeline
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              비즈니스 딜별 의사결정권자(Key Decision Maker)와 신뢰 지지자(Champion)를 소중한 인맥과 연결하여 프로젝트 성공 가능성을 높입니다.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>신규 딜 생성</span>
          </button>
        </div>
      </div>

      {/* 2. Kanban Board Columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 overflow-x-auto pb-4">
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.id);

          return (
            <div
              key={stage.id}
              className={`rounded-2xl border p-3 flex flex-col min-h-[480px] space-y-3 ${stage.color}`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800 text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">{stage.label}</span>
                <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[11px] font-mono border border-slate-200 dark:border-slate-700">
                  {stageDeals.length}
                </span>
              </div>

              {/* Deal Cards in this Stage */}
              <div className="space-y-3 flex-1 overflow-y-auto">
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-indigo-500/50 transition-all space-y-3 shadow-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200 dark:bg-slate-800 dark:text-indigo-300 dark:border-transparent">
                          {deal.targetCompany}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="text-slate-400 hover:text-rose-500 p-0.5"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                        {deal.title}
                      </h4>
                    </div>

                    {deal.dealSize && (
                      <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                        <DollarSign className="w-3 h-3 text-emerald-500" />
                        <span>{deal.dealSize}</span>
                      </div>
                    )}

                    {/* Health Score Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 dark:text-slate-400">인맥 연결 건전도</span>
                        <span className="font-bold text-blue-600 dark:text-indigo-300 font-mono">{deal.healthScore}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-indigo-500 dark:to-emerald-400 rounded-full transition-all"
                          style={{ width: `${deal.healthScore}%` }}
                        />
                      </div>
                    </div>

                    {/* Keyman Stakeholders Mapping */}
                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>매핑된 키맨 ({deal.stakeholders.length})</span>
                        <button
                          onClick={() => setActiveDealForAddStakeholder(deal)}
                          className="text-blue-600 dark:text-indigo-400 hover:text-blue-700 font-bold"
                        >
                          + 키맨 추가
                        </button>
                      </div>

                      <div className="space-y-1">
                        {deal.stakeholders.map(s => {
                          const originalPerson = people.find(p => p.id === s.personId);

                          return (
                            <div
                              key={s.personId}
                              className="p-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800/60 flex items-center justify-between text-[11px]"
                            >
                              <div className="truncate flex-1 min-w-0">
                                <span className="font-bold text-slate-900 dark:text-slate-200">{s.personName}</span>
                                <span className="text-slate-500 dark:text-slate-400 ml-1 font-normal">({s.title})</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                                  s.role === 'DECISION_MAKER' 
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-500/30' 
                                    : s.role === 'CHAMPION'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-500/30'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-400'
                                }`}>
                                  {s.role === 'DECISION_MAKER' ? '의사결정권자' : s.role === 'CHAMPION' ? '챔피언' : '지지자'}
                                </span>

                                {originalPerson && (
                                  <div className="flex items-center gap-0.5">
                                    {s.isDartExecutive && onOpenDossier && (
                                      <button
                                        onClick={() => onOpenDossier(originalPerson)}
                                        className="p-0.5 text-emerald-400 hover:text-emerald-300"
                                        title="DART 공시 다면 분석 보고서"
                                      >
                                        <FileText className="w-3 h-3" />
                                      </button>
                                    )}
                                    {originalPerson.closeness === 2 && onOpenBridgeModal && (
                                      <button
                                        onClick={() => onOpenBridgeModal(originalPerson)}
                                        className="p-0.5 text-indigo-400 hover:text-indigo-300"
                                        title="2촌 소개 요청 시퀀스"
                                      >
                                        <Send className="w-3 h-3" />
                                      </button>
                                    )}
                                    <button
                                      onClick={() => onSelectPerson(originalPerson)}
                                      className="p-0.5 text-slate-400 hover:text-white"
                                      title="인맥 상세 열기"
                                    >
                                      <ChevronRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Stage Selector */}
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
                      <select
                        value={deal.stage}
                        onChange={(e) => handleStageChange(deal.id, e.target.value as DealStage)}
                        className="w-full px-2 py-1 rounded bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 text-[11px] focus:outline-none"
                      >
                        {STAGES.map(s => (
                          <option key={s.id} value={s.id}>{s.label}</option>
                        ))}
                      </select>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* New Deal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                <span>신규 비즈니스 딜 파이프라인 생성</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">프로젝트 / 딜 명칭 *</label>
                <input
                  type="text"
                  placeholder="예: 카카오뱅크 금융 LLM 솔루션 도입 계약"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-semibold">타깃 기업명 *</label>
                <input
                  type="text"
                  placeholder="예: 카카오뱅크 또는 삼성전자"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">예상 계약 규모</label>
                  <input
                    type="text"
                    value={newDealSize}
                    onChange={(e) => setNewDealSize(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-semibold">목표 완료일</label>
                  <input
                    type="date"
                    value={newCloseDate}
                    onChange={(e) => setNewCloseDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold"
                >
                  딜 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Keyman Modal */}
      {activeDealForAddStakeholder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white">
                  [{activeDealForAddStakeholder.targetCompany}] 딜에 키맨 매핑
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">내 인맥 중 적합한 의사결정권자나 챔피언을 지정하세요.</p>
              </div>
              <button onClick={() => setActiveDealForAddStakeholder(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              {people.map(p => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 hover:border-slate-700"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <span>{p.name}</span>
                      <span className="text-indigo-400 text-[11px]">({p.currentTitle})</span>
                      {p.sourceType === 'DART_FACT' && (
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400">{p.currentCompany}</div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleAddStakeholder(p.id, 'DECISION_MAKER')}
                      className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/40 text-rose-300 font-bold text-[11px]"
                    >
                      의사결정권자
                    </button>
                    <button
                      onClick={() => handleAddStakeholder(p.id, 'CHAMPION')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 font-bold text-[11px]"
                    >
                      챔피언
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
