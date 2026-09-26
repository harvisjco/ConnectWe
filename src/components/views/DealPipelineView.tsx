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
  X, Trash2, FileText, Send
} from 'lucide-react';
import { ViewHeader } from '../ui';

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
  const [activeDealForDetail, setActiveDealForDetail] = useState<BusinessDeal | null>(null);
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
    if (activeDealForDetail && activeDealForDetail.id === dealId) {
      setActiveDealForDetail({ ...activeDealForDetail, stage: newStage });
    }
    onShowToast('딜 파이프라인 단계가 업데이트되었습니다.');
  };

  // 딜 삭제
  const handleDeleteDeal = (dealId: string) => {
    if (!confirm('이 비즈니스 딜을 삭제하시겠습니까?')) return;
    const updated = deals.filter(d => d.id !== dealId);
    setDeals(updated);
    saveDealsToStorage(updated);
    if (activeDealForDetail?.id === dealId) {
      setActiveDealForDetail(null);
    }
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
      <ViewHeader
        icon={Briefcase}
        title="전략 비즈니스 딜 파이프라인 협업 룸"
        subtitle="비즈니스 딜별 의사결정권자(Key Decision Maker)와 신뢰 지지자(Champion)를 소중한 인맥과 연결하여 프로젝트 성공 가능성을 높입니다."
        englishTag="C-Level Deal Pipeline"
        actions={
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-bold text-xs shadow-xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-white" />
            <span>신규 딜 생성</span>
          </button>
        }
      />

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

              {/* Deal Cards in this Stage: Compact Summary Mode */}
              <div className="space-y-2.5 flex-1 overflow-y-auto">
                {stageDeals.map(deal => (
                  <div
                    key={deal.id}
                    onClick={() => setActiveDealForDetail(deal)}
                    className="p-3 rounded-xl bg-white border border-slate-200/90 hover:border-blue-400 hover:shadow-xs transition-all space-y-2 shadow-2xs cursor-pointer group"
                  >
                    <div className="flex items-start justify-between gap-1">
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-700 border border-blue-200 truncate max-w-[120px]">
                        {deal.targetCompany}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteDeal(deal.id);
                        }}
                        className="text-slate-300 hover:text-rose-500 p-0.5 transition-colors"
                        title="딜 삭제"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>

                    <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                      {deal.title}
                    </h4>

                    {/* Bottom Info Bar: Deal Size, Health, Keyman count */}
                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="font-mono font-semibold text-emerald-700">
                        {deal.dealSize || '-'}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-blue-700 font-bold bg-blue-50 px-1.5 py-0.2 rounded border border-blue-150">
                          {deal.healthScore}%
                        </span>
                        <span className="text-slate-400 text-[10px]">
                          키맨 {deal.stakeholders.length}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Center Dim Modal: Deal Detail & Keyman Strategy Hub */}
      {activeDealForDetail && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveDealForDetail(null)}
        >
          <div 
            className="w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl p-6 space-y-5 max-h-[88vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    {activeDealForDetail.targetCompany}
                  </span>
                  <span className="text-xs font-mono font-semibold text-emerald-700">
                    {activeDealForDetail.dealSize}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {activeDealForDetail.title}
                </h3>
              </div>
              <button
                onClick={() => setActiveDealForDetail(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Health & Stage Controls */}
            <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 font-medium block mb-1">인맥 연결 건전도</span>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-600 rounded-full" 
                      style={{ width: `${activeDealForDetail.healthScore}%` }} 
                    />
                  </div>
                  <span className="font-mono font-bold text-blue-700">{activeDealForDetail.healthScore}%</span>
                </div>
              </div>
              <div>
                <span className="text-slate-500 font-medium block mb-1">현재 진행 단계</span>
                <select
                  value={activeDealForDetail.stage}
                  onChange={(e) => handleStageChange(activeDealForDetail.id, e.target.value as DealStage)}
                  className="w-full px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 text-xs font-semibold focus:outline-none focus:border-blue-500"
                >
                  {STAGES.map(s => (
                    <option key={s.id} value={s.id}>{s.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stakeholders (Keymen) List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              <div className="flex items-center justify-between text-xs pb-1">
                <span className="font-bold text-slate-800">
                  매핑된 키맨 ({activeDealForDetail.stakeholders.length}명)
                </span>
                <button
                  onClick={() => setActiveDealForAddStakeholder(activeDealForDetail)}
                  className="text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>키맨 추가</span>
                </button>
              </div>

              {activeDealForDetail.stakeholders.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-xl">
                  아직 매핑된 키맨이 없습니다. 우측 상단 '키맨 추가'로 신뢰 인맥을 연결하세요.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeDealForDetail.stakeholders.map(s => {
                    const originalPerson = people.find(p => p.id === s.personId);

                    return (
                      <div
                        key={s.personId}
                        className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900">{s.personName}</span>
                            <span className="text-slate-500">({s.title})</span>
                            <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                              s.role === 'DECISION_MAKER' 
                                ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                                : s.role === 'CHAMPION'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {s.role === 'DECISION_MAKER' ? '의사결정권자' : s.role === 'CHAMPION' ? '챔피언' : '지지자'}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{s.company}</div>
                        </div>

                        {originalPerson && (
                          <div className="flex items-center gap-1.5">
                            {s.isDartExecutive && onOpenDossier && (
                              <button
                                onClick={() => onOpenDossier(originalPerson)}
                                className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium flex items-center gap-1"
                                title="1-Page 미팅 전략 브리프"
                              >
                                <FileText className="w-3 h-3 text-blue-600" />
                                <span>브리프</span>
                              </button>
                            )}
                            {originalPerson.closeness === 2 && onOpenBridgeModal && (
                              <button
                                onClick={() => onOpenBridgeModal(originalPerson)}
                                className="px-2 py-1 rounded bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-medium flex items-center gap-1"
                                title="2촌 소개 요청"
                              >
                                <Send className="w-3 h-3" />
                                <span>소개 요청</span>
                              </button>
                            )}
                            <button
                              onClick={() => onSelectPerson(originalPerson)}
                              className="px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-medium"
                            >
                              프로필
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>목표 클로징: <strong className="text-slate-700 font-mono">{activeDealForDetail.expectedCloseDate}</strong></span>
              <button
                onClick={() => setActiveDealForDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold text-xs hover:bg-slate-800 transition-colors"
              >
                확인 완료
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. New Deal Creation Center Dim Modal */}
      {isAddModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div 
            className="w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-600" />
                <span>신규 비즈니스 딜 파이프라인 수립</span>
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeal} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">프로젝트 / 딜 명칭 *</label>
                <input
                  type="text"
                  placeholder="예: 카카오뱅크 금융 LLM 솔루션 도입 계약"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-semibold">협력 파트너 기업명 *</label>
                <input
                  type="text"
                  placeholder="예: 카카오뱅크 또는 삼성전자"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">예상 계약 규모</label>
                  <input
                    type="text"
                    value={newDealSize}
                    onChange={(e) => setNewDealSize(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-700 font-semibold">목표 완료일</label>
                  <input
                    type="date"
                    value={newCloseDate}
                    onChange={(e) => setNewCloseDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs"
                >
                  딜 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 5. Add Keyman Modal */}
      {activeDealForAddStakeholder && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setActiveDealForAddStakeholder(null)}
        >
          <div 
            className="w-full max-w-lg bg-white border border-slate-200 rounded-3xl shadow-2xl p-6 space-y-4 max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  [{activeDealForAddStakeholder.targetCompany}] 딜에 키맨 매핑
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">내 인맥 중 적합한 의사결정권자나 챔피언을 지정하세요.</p>
              </div>
              <button onClick={() => setActiveDealForAddStakeholder(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 text-xs">
              {people.map(p => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3 hover:bg-slate-100 transition-colors"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{p.name}</span>
                      <span className="text-blue-700 text-[11px]">({p.currentTitle})</span>
                      {p.sourceType === 'DART_FACT' && (
                        <ShieldCheck className="w-3 h-3 text-emerald-500" />
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500">{p.currentCompany}</div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleAddStakeholder(p.id, 'DECISION_MAKER')}
                      className="px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-[11px]"
                    >
                      의사결정권자
                    </button>
                    <button
                      onClick={() => handleAddStakeholder(p.id, 'CHAMPION')}
                      className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-bold text-[11px]"
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
