import React, { useState, useEffect, useMemo } from 'react';
import { Person } from '../../types/network';
import { BusinessDeal, loadDealsFromStorage } from '../../services/dealPipelineService';
import { 
  GratitudeSettlement,
  GratitudeRewardType,
  SettlementStatus,
  GRATITUDE_REWARD_PRESETS,
  loadSettlementsFromStorage,
  saveSettlementsToStorage,
  matchPotentialReferrers,
  generateThankYouLetter,
  generateMockSettlements
} from '../../services/gratitudeSettlementService';
import { 
  X, Gift, CheckCircle2, Send, 
  Copy, Plus, Briefcase, 
  HeartHandshake, FileText, Check
} from 'lucide-react';

interface GratitudeSettlementModalProps {
  people: Person[];
  initialDeal?: BusinessDeal | null;
  onClose: () => void;
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const GratitudeSettlementModal: React.FC<GratitudeSettlementModalProps> = ({
  people,
  initialDeal,
  onClose,
  onSelectPerson,
  onShowToast
}) => {
  const [deals] = useState<BusinessDeal[]>(() => loadDealsFromStorage(people));
  const [settlements, setSettlements] = useState<GratitudeSettlement[]>(() => {
    const loaded = loadSettlementsFromStorage();
    if (loaded.length === 0) {
      const mocks = generateMockSettlements(people, loadDealsFromStorage(people));
      saveSettlementsToStorage(mocks);
      return mocks;
    }
    return loaded;
  });

  const [activeTab, setActiveTab] = useState<'list' | 'create'>('list');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // 신규 답례 등록 폼 상태
  const [selectedDealId, setSelectedDealId] = useState<string>(initialDeal?.id || (deals[0]?.id || ''));
  const currentDeal = useMemo(() => deals.find(d => d.id === selectedDealId), [deals, selectedDealId]);

  // 해당 딜에 대한 추천인 추천 후보군 (교차 매칭)
  const candidateReferrers = useMemo(() => {
    if (!currentDeal) return [];
    return matchPotentialReferrers(currentDeal, people);
  }, [currentDeal, people]);

  const [selectedReferrerId, setSelectedReferrerId] = useState<string>(candidateReferrers[0]?.id || (people[1]?.id || ''));
  const currentReferrer = useMemo(() => people.find(p => p.id === selectedReferrerId), [people, selectedReferrerId]);

  const [rewardType, setRewardType] = useState<GratitudeRewardType>('DINING');
  const [rewardValue, setRewardValue] = useState<string>(GRATITUDE_REWARD_PRESETS.DINING.defaultValue);
  const [plannedDate, setPlannedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [customNotes, setCustomNotes] = useState<string>('');

  // 딜 변경 시 추천인 기본값 자동 세팅
  useEffect(() => {
    if (candidateReferrers.length > 0 && !candidateReferrers.some(r => r.id === selectedReferrerId)) {
      setSelectedReferrerId(candidateReferrers[0].id);
    }
  }, [candidateReferrers, selectedReferrerId]);

  // 보상 프리셋 변경 시 기본값 자동 세팅
  const handleSelectRewardType = (type: GratitudeRewardType) => {
    setRewardType(type);
    setRewardValue(GRATITUDE_REWARD_PRESETS[type].defaultValue);
  };

  // 실시간 생성 감사 서신 미리보기
  const liveLetter = useMemo(() => {
    if (!currentDeal || !currentReferrer) return '';
    return generateThankYouLetter({
      referrerName: currentReferrer.name,
      referrerCompany: currentReferrer.currentCompany,
      dealTitle: currentDeal.title,
      rewardType,
      rewardValue
    });
  }, [currentDeal, currentReferrer, rewardType, rewardValue]);

  // 신규 답례 등록 핸들러
  const handleCreateSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentDeal || !currentReferrer) {
      onShowToast('딜과 추천인 인맥을 모두 선택해 주세요.');
      return;
    }

    const newSettlement: GratitudeSettlement = {
      id: `settlement-${Date.now()}`,
      dealId: currentDeal.id,
      dealTitle: currentDeal.title,
      dealSize: currentDeal.dealSize,
      referrerPersonId: currentReferrer.id,
      referrerName: currentReferrer.name,
      referrerCompany: currentReferrer.currentCompany,
      referrerTitle: currentReferrer.currentTitle,
      rewardType,
      rewardValue,
      status: 'PLANNED',
      plannedDate,
      thankYouLetter: liveLetter,
      notes: customNotes,
      createdAt: new Date().toISOString()
    };

    const next = [newSettlement, ...settlements];
    setSettlements(next);
    saveSettlementsToStorage(next);
    setActiveTab('list');
    onShowToast(`[${currentReferrer.name}] 리더님을 위한 추천 감사 답례 일정이 성공적으로 등록되었습니다.`);
  };

  // 상태 전환 핸들러 (PLANNED -> SENT -> COMPLETED)
  const handleUpdateStatus = (id: string, nextStatus: SettlementStatus) => {
    const updated = settlements.map(s => {
      if (s.id === id) {
        return {
          ...s,
          status: nextStatus,
          completedDate: nextStatus === 'COMPLETED' ? new Date().toISOString().slice(0, 10) : s.completedDate
        };
      }
      return s;
    });
    setSettlements(updated);
    saveSettlementsToStorage(updated);
    onShowToast(`감사 답례 진행 상태가 [${nextStatus === 'SENT' ? '전달 완료' : nextStatus === 'COMPLETED' ? '감사 회신 완료' : '답례 준비 중'}] 상태로 갱신되었습니다.`);
  };

  // 감사 서신 클립보드 복사
  const handleCopyLetter = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    onShowToast('정중한 C-Level 감사 서신 전문이 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // 통계 계산
  const totalCount = settlements.length;
  const plannedCount = settlements.filter(s => s.status === 'PLANNED').length;
  const sentCount = settlements.filter(s => s.status === 'SENT').length;
  const completedCount = settlements.filter(s => s.status === 'COMPLETED').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 text-white flex items-center justify-center shadow-md">
              <Gift className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  추천 감사 리워드 &amp; 딜 답례 정산 대시보드
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Gratitude Pipeline
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                성사된 비즈니스 딜의 기여 인연을 원터치 매칭하고, 따뜻한 티타임과 품격 있는 감사를 정산합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Header Navigation Tabs & Action */}
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              정산 내역 목록 ({totalCount})
            </button>
            <button
              onClick={() => setActiveTab('create')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'create'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>새 답례 등록</span>
            </button>
          </div>

          {/* Quick Metrics */}
          <div className="hidden sm:flex items-center gap-3 text-xs">
            <span className="text-slate-500">
              준비 중 <b className="text-amber-600">{plannedCount}</b>건
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              전달 완료 <b className="text-sky-600">{sentCount}</b>건
            </span>
            <span className="text-slate-300">|</span>
            <span className="text-slate-500">
              회신 완료 <b className="text-emerald-600">{completedCount}</b>건
            </span>
          </div>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'list' ? (
            <div className="space-y-4">
              {settlements.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <Gift className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    아직 등록된 딜 추천 감사 답례 내역이 없습니다.
                  </p>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    성사된 비즈니스 딜에 결정적 도움을 준 추천인에게 따뜻한 차 한 잔 또는 격조 높은 감사의 마음을 등록해 보세요.
                  </p>
                  <button
                    onClick={() => setActiveTab('create')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-500 transition-all cursor-pointer shadow-md"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>첫 감사 답례 등록하기</span>
                  </button>
                </div>
              ) : (
                settlements.map(item => {
                  const preset = GRATITUDE_REWARD_PRESETS[item.rewardType];
                  const isCopied = copiedId === item.id;

                  return (
                    <div
                      key={item.id}
                      className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs space-y-4"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{preset.emoji}</span>
                          <div>
                            <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                              {onSelectPerson ? (
                                <button
                                  onClick={() => {
                                    const p = people.find(person => person.id === item.referrerPersonId);
                                    if (p) {
                                      onClose();
                                      onSelectPerson(p);
                                    }
                                  }}
                                  className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline cursor-pointer text-left"
                                >
                                  {item.referrerName} 리더님
                                </button>
                              ) : (
                                <span>{item.referrerName} 리더님</span>
                              )}
                              <span className="text-xs font-normal text-slate-500">
                                ({item.referrerCompany} {item.referrerTitle})
                              </span>
                            </div>
                            <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                              <Briefcase className="w-3 h-3 text-slate-400" />
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{item.dealTitle}</span>
                              {item.dealSize && <span className="text-emerald-600 font-mono">({item.dealSize})</span>}
                            </div>
                          </div>
                        </div>

                        {/* Status Badge */}
                        <div className="flex items-center gap-2 self-start sm:self-center">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : item.status === 'SENT'
                                ? 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300'
                                : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}>
                            {item.status === 'COMPLETED' ? '✓ 감사 회신 완료' : item.status === 'SENT' ? '● 전달 완료' : '○ 답례 준비 중'}
                          </span>
                        </div>
                      </div>

                      {/* Reward Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 dark:bg-slate-850 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800">
                        <div>
                          <span className="text-slate-400 block text-[11px]">답례 형태 및 세부 내용</span>
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {preset.label}: {item.rewardValue}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">예정 / 완료 일자</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {item.plannedDate} {item.completedDate ? `(완료: ${item.completedDate})` : ''}
                          </span>
                        </div>
                        {item.notes && (
                          <div className="sm:col-span-2 pt-1 border-t border-slate-200/60 dark:border-slate-800">
                            <span className="text-slate-400 block text-[11px]">비고 및 전략 메모</span>
                            <p className="text-slate-600 dark:text-slate-300 text-xs">{item.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleCopyLetter(item.id, item.thankYouLetter)}
                            className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                          >
                            {isCopied ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="text-emerald-600 font-bold">복사 완료</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-500" />
                                <span>감사 서신 복사</span>
                              </>
                            )}
                          </button>
                        </div>

                        {/* Status Toggle Steps */}
                        <div className="flex items-center gap-1 text-xs">
                          {item.status === 'PLANNED' && (
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'SENT')}
                              className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Send className="w-3 h-3" />
                              <span>답례 전달 완료 처리</span>
                            </button>
                          )}
                          {item.status === 'SENT' && (
                            <button
                              onClick={() => handleUpdateStatus(item.id, 'COMPLETED')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>감사 회신 완료</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          ) : (
            /* Create Form Tab */
            <form onSubmit={handleCreateSettlement} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. Target Deal Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    성사 / 진행 비즈니스 딜 선택
                  </label>
                  <select
                    value={selectedDealId}
                    onChange={(e) => setSelectedDealId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    {deals.map(d => (
                      <option key={d.id} value={d.id}>
                        [{d.stage}] {d.title} ({d.targetCompany})
                      </option>
                    ))}
                  </select>
                </div>

                {/* 2. Referrer Person Select */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center justify-between">
                    <span>핵심 추천인 인맥 (Introducer)</span>
                    {candidateReferrers.length > 0 && (
                      <span className="text-[10px] text-emerald-600 font-bold">
                        ★ 교차 매칭 추천 {candidateReferrers.length}명
                      </span>
                    )}
                  </label>
                  <select
                    value={selectedReferrerId}
                    onChange={(e) => setSelectedReferrerId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    {candidateReferrers.map(p => (
                      <option key={p.id} value={p.id}>
                        ★ [추천] {p.name} ({p.currentCompany} {p.currentTitle} · {p.closeness}촌)
                      </option>
                    ))}
                    {people.filter(p => !candidateReferrers.some(c => c.id === p.id) && p.closeness > 1).map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.currentCompany} {p.currentTitle} · {p.closeness}촌)
                      </option>
                    ))}
                  </select>
                </div>

              </div>

              {/* 3. Reward Type Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  답례 품격 및 리워드 형태 선택
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(['TEA', 'DINING', 'GIFT', 'REWARD'] as GratitudeRewardType[]).map(type => {
                    const preset = GRATITUDE_REWARD_PRESETS[type];
                    const isSelected = rewardType === type;

                    return (
                      <button
                        type="button"
                        key={type}
                        onClick={() => handleSelectRewardType(type)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                          isSelected
                            ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                        }`}
                      >
                        <span className="text-lg">{preset.emoji}</span>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-1">
                          {preset.label}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate mt-0.5">
                          {preset.defaultValue}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Value & Date */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    답례 세부 명칭 / 리워드 상세
                  </label>
                  <input
                    type="text"
                    value={rewardValue}
                    onChange={(e) => setRewardValue(e.target.value)}
                    placeholder="예: 신라호텔 만찬 2인 초대권"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    전달 예정 일자
                  </label>
                  <input
                    type="date"
                    value={plannedDate}
                    onChange={(e) => setPlannedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              {/* Strategy & Gratitude Notes */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  전략 메모 및 참고 사항 (선택)
                </label>
                <textarea
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  placeholder="예: 추천인 대표님과 파트너십 논의 및 다음 프로젝트 제휴 가능성 탐색..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none"
                />
              </div>

              {/* 5. Live Generated Thank You Letter Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-600" />
                    <span>자동 생성된 격조 높은 비즈니스 감사 서신 미리보기</span>
                  </label>
                  <span className="text-[10px] text-slate-400">등록 후 언제든 원터치 복사 가능</span>
                </div>
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/70 text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed whitespace-pre-line max-h-48 overflow-y-auto">
                  {liveLetter}
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md cursor-pointer"
                >
                  감사 답례 파이프라인 등록
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
          <div className="text-xs text-slate-500 flex items-center gap-2">
            <HeartHandshake className="w-4 h-4 text-emerald-600" />
            <span>ConnectWe 인간 중심 헌장 준수: 인연에 대한 진심 어린 감사와 상호 존중 파트너십</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>

      </div>
    </div>
  );
};
