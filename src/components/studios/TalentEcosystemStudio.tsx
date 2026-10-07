import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import { BusinessDeal, loadDealsFromStorage, saveDealsToStorage } from '../../services/dealPipelineService';
import {
  SQUAD_TEMPLATES,
  SQUAD_ROLES,
  findBestCandidatesForRole,
  analyzeSquadGaps
} from '../../services/projectSquadBuilderService';
import {
  loadVentureSignals,
  getVentureSummaryStats,
  markSignalCongratulated
} from '../../services/ventureRadarService';
import {
  peerTrustCareerService
} from '../../services/peerTrustCareerService';
import {
  networkVitalityService
} from '../../services/networkVitalityService';
import { PeerProblemTicket, ProblemCategory } from '../../types/networkVitality';
import { EarlyStageVentureSignal } from '../../types/ventureRadar';
import { RouletteRole } from '../../types/peerTrustCareer';
import {
  Users,
  Rocket,
  Award,
  Sparkles,
  LifeBuoy,
  X,
  Check,
  Copy,
  QrCode,
  Download,
  Send,
  Coffee,
  Briefcase,
  ShieldCheck
} from 'lucide-react';

export type TalentEcosystemTab = 'squad' | 'venture' | 'trust_card' | 'knowledge';

export interface TalentEcosystemStudioProps {
  isOpen: boolean;
  initialTab?: TalentEcosystemTab;
  people: Person[];
  selectedPerson?: Person | null;
  onClose: () => void;
  onSelectPerson?: (person: Person) => void;
  onOpenTeatimeWithPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const TalentEcosystemStudio: React.FC<TalentEcosystemStudioProps> = ({
  isOpen,
  initialTab = 'squad',
  people,
  selectedPerson: _selectedPerson,
  onClose,
  onSelectPerson: _onSelectPerson,
  onOpenTeatimeWithPerson,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<TalentEcosystemTab>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleCopy = (text: string, key: string, successMsg = '클립보드에 복사되었습니다.') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    setCopiedKey(key);
    onShowToast(successMsg);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // ====================================================
  // TAB 1: 전략 프로젝트 스쿼드 빌더 (squad)
  // [기능 확장: 완성된 스쿼드를 비즈니스 딜 파이프라인에 1-클릭 등록]
  // ====================================================
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>(SQUAD_TEMPLATES[0].id);
  const currentTemplate = useMemo(() => {
    return SQUAD_TEMPLATES.find((t) => t.id === selectedTemplateId) || SQUAD_TEMPLATES[0];
  }, [selectedTemplateId]);

  const [assignedSquad, setAssignedSquad] = useState<Record<string, Person | null>>({
    PRODUCT_LEAD: null,
    TECH_LEAD_AI: null,
    FRONTEND_DEV: null,
    BACKEND_INFRA: null,
    PRODUCT_DESIGN: null,
    BUSINESS_GROWTH: null
  });

  const squadGapAnalysis = useMemo(() => {
    return analyzeSquadGaps(currentTemplate, assignedSquad);
  }, [currentTemplate, assignedSquad]);

  // 비즈니스 딜 파이프라인에 스쿼드 공식 등록 (기능 확장)
  const handleRegisterSquadToDealPipeline = () => {
    const assignedMembers = Object.entries(assignedSquad)
      .filter(([_, person]) => person !== null)
      .map(([roleId, person]) => ({
        personId: person!.id,
        personName: person!.name,
        company: person!.currentCompany,
        title: person!.currentTitle || '파트너',
        role: roleId === 'PRODUCT_LEAD' ? ('CHAMPION' as const) : ('INFLUENCER' as const),
        closeness: person!.closeness || 2,
        isDartExecutive: person!.sourceType === 'DART_FACT'
      }));

    if (assignedMembers.length === 0) {
      onShowToast('스쿼드에 최소 1명 이상의 팀원을 배치해 주세요.');
      return;
    }

    const currentDeals = loadDealsFromStorage(people);
    const newDeal: BusinessDeal = {
      id: `deal-squad-${Date.now()}`,
      title: `[스쿼드] ${currentTemplate.title}`,
      targetCompany: assignedMembers[0]?.company || 'ConnectWe 스쿼드',
      targetIndustry: '전략 프로젝트 파트너십',
      dealSize: '스쿼드 프로젝트 파트너십',
      stage: 'PROSPECT',
      expectedCloseDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      stakeholders: assignedMembers,
      healthScore: 85,
      notes: `${currentTemplate.description} (편성 준비도: ${squadGapAnalysis.readinessScore}%)`
    };

    const nextDeals = [newDeal, ...currentDeals];
    saveDealsToStorage(nextDeals);
    onShowToast(`🚀 '${currentTemplate.title}' 스쿼드가 비즈니스 파트너십 딜로 등록되었습니다!`);
  };

  // ====================================================
  // TAB 2: 동문·동료 초기 창업 & 시드 레이더 (venture)
  // [기능 확장: 축하 서신 생성 + 즉시 커피챗 룰렛 초대 동봉]
  // ====================================================
  const [ventureSignals, setVentureSignals] = useState<EarlyStageVentureSignal[]>(() =>
    loadVentureSignals(people)
  );
  const ventureStats = useMemo(() => getVentureSummaryStats(ventureSignals), [ventureSignals]);
  const [selectedSignal, setSelectedSignal] = useState<EarlyStageVentureSignal | null>(
    ventureSignals[0] || null
  );

  const congratulatoryLetter = useMemo(() => {
    if (!selectedSignal) return '';
    return `[축하 서신] 안녕하세요, ${selectedSignal.personName} 대표님!\n\n` +
      `최근 '${selectedSignal.companyName}'의 새로운 도약(${selectedSignal.fundingStage} 단계) 소식을 접하고 깊은 축하와 응원의 마음을 전합니다.\n` +
      `소중한 인연으로서 대표님의 새로운 도전을 진심으로 응원합니다.\n\n` +
      `[15분 캐주얼 티타임 / 커피챗 제안]\n` +
      `• 언제든 편하신 시간에 차 한 잔 나누며 응원과 함께 시너지 가능성을 나누고 싶습니다.\n` +
      `• 여의도/강남 거점 또는 온라인 비대면 15분 티타임 모두 환영합니다.\n\n` +
      `앞으로도 큰 성장을 기대하며 늘 함께하겠습니다.\n\n` +
      `ConnectWe 드림`;
  }, [selectedSignal]);

  const handleMarkCongratulated = (signalId: string) => {
    const updated = markSignalCongratulated(signalId, ventureSignals);
    setVentureSignals(updated);
    onShowToast('축하 서신 전송 및 소통 완료 상태로 기록되었습니다.');
  };

  // ====================================================
  // TAB 3: 피어 신뢰 보증 & 디지털 vCard 명함 (trust_card)
  // [기능 확장: 표준 vCard 3.0 모바일 다운로드 & 커피챗 룰렛]
  // ====================================================
  const myDigitalCard = useMemo(() => peerTrustCareerService.getMyDigitalProfile(), []);
  const endorsements = useMemo(() => peerTrustCareerService.getEndorsements(), []);
  const [rouletteRole, setRouletteRole] = useState<RouletteRole>('frontend');
  const [rouletteMatch, setRouletteMatch] = useState(() =>
    peerTrustCareerService.spinCoffeeRoulette('frontend')
  );

  const handleDownloadVCard = () => {
    const vCardData = peerTrustCareerService.generateVCard(myDigitalCard);
    const blob = new Blob([vCardData.vcfString], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${myDigitalCard.name}_digital_card.vcf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast(`📇 ${myDigitalCard.name} 님의 표준 vCard 연락처가 다운로드되었습니다.`);
  };

  const handleSpinRoulette = (role: RouletteRole) => {
    setRouletteRole(role);
    const match = peerTrustCareerService.spinCoffeeRoulette(role);
    setRouletteMatch(match);
    onShowToast(`☕ ${role.toUpperCase()} 분야의 새로운 커피챗 파트너가 매칭되었습니다!`);
  };

  // ====================================================
  // TAB 4: 슈퍼파워 지식 교환 & 실무 SOS (knowledge)
  // ====================================================
  const [tickets, setTickets] = useState<PeerProblemTicket[]>(() =>
    networkVitalityService.getProblemTickets()
  );
  const [newSosTitle, setNewSosTitle] = useState('');
  const [newSosCategory, setNewSosCategory] = useState<ProblemCategory>('infra_cloud');

  const handleCreateTicket = () => {
    if (!newSosTitle.trim()) {
      onShowToast('문의 또는 공유할 실무 내용을 입력해 주세요.');
      return;
    }
    const created = networkVitalityService.createProblemTicket(
      {
        title: newSosTitle,
        category: newSosCategory,
        categoryLabel:
          newSosCategory === 'infra_cloud'
            ? '클라우드 & 인프라'
            : newSosCategory === 'frontend_ux'
            ? '프론트엔드 & UX'
            : newSosCategory === 'ai_data'
            ? 'AI & 데이터'
            : '과금 & 비즈니스',
        description: '실무 긴급 자문 SOS 문의입니다.',
        confidentialMasked: false
      },
      people
    );
    setTickets([created, ...tickets]);
    setNewSosTitle('');
    onShowToast('💡 실무 지식 교환 티켓이 동문 생태계에 등록되었습니다.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="talent-ecosystem-title"
        className="relative w-full max-w-5xl h-[92vh] max-h-[920px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* ========================================================
            헤더 (Header)
            ======================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="talent-ecosystem-title" className="text-lg font-bold text-white tracking-tight">
                  실무 인재 &amp; 커리어 성장 생태계 스튜디오
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-[11px] font-semibold">
                  통합 메가스튜디오 3
                </span>
              </div>
              <p className="text-xs text-slate-400">
                전략 프로젝트 스쿼드 ↔ 초기 창업 레이더 ↔ 피어 신뢰 vCard 명함 ↔ 슈퍼파워 지식 교환
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================
            4대 통합 네비게이션 탭바 (Tab Navigation)
            ======================================================== */}
        <div className="flex items-center gap-1 px-6 bg-slate-950/60 border-b border-slate-800 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('squad')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'squad'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            전략 프로젝트 스쿼드 빌더
          </button>

          <button
            onClick={() => setActiveTab('venture')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'venture'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Rocket className="w-4 h-4" />
            초기 창업 &amp; 시드 레이더 ({ventureStats.totalSignals}건)
          </button>

          <button
            onClick={() => setActiveTab('trust_card')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'trust_card'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Award className="w-4 h-4" />
            피어 신뢰 보증 &amp; vCard 명함
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'knowledge'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            슈퍼파워 지식 교환 &amp; SOS
          </button>
        </div>

        {/* ========================================================
            본문 뷰 (Tab Body)
            ======================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: 전략 프로젝트 스쿼드 빌더 */}
          {activeTab === 'squad' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400" />
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => setSelectedTemplateId(e.target.value)}
                      className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white font-bold"
                    >
                      {SQUAD_TEMPLATES.map((t) => (
                        <option key={t.id} value={t.id}>{t.title}</option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-400">{currentTemplate.description}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs font-bold text-emerald-400">
                      편성 완성도 {squadGapAnalysis.readinessScore}%
                    </span>
                    <p className="text-[10px] text-slate-400">
                      {squadGapAnalysis.filledSlots} / {squadGapAnalysis.totalSlots} 역할 확보
                    </p>
                  </div>
                  <button
                    onClick={handleRegisterSquadToDealPipeline}
                    className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center gap-1.5 transition-all"
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    비즈니스 딜로 공식 등록
                  </button>
                </div>
              </div>

              {/* 역할별 팀원 배치 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentTemplate.roles.map((roleId) => {
                  const roleDef = SQUAD_ROLES[roleId];
                  const assigned = assignedSquad[roleId];
                  const candidates = findBestCandidatesForRole(people, roleId, 2);

                  return (
                    <div
                      key={roleId}
                      className={`p-4 rounded-xl border transition-all space-y-3 ${
                        assigned
                          ? 'bg-emerald-950/20 border-emerald-600/60'
                          : 'bg-slate-800/40 border-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-xs font-bold text-white">{roleDef.label}</span>
                          <p className="text-[10px] text-slate-400">{roleDef.description}</p>
                        </div>
                        {assigned ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-900/60 text-emerald-300 text-[10px] font-bold">
                            배치 완료
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-amber-950 text-amber-300 text-[10px] font-bold">
                            후보 추천 중
                          </span>
                        )}
                      </div>

                      {assigned ? (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-emerald-800/60 flex items-center justify-between text-xs">
                          <div>
                            <p className="font-bold text-white">{assigned.name}</p>
                            <p className="text-[10px] text-slate-400">
                              {assigned.currentCompany} · {assigned.currentTitle || '임직원'}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setAssignedSquad(prev => ({ ...prev, [roleId]: null }))
                            }
                            className="text-[11px] text-rose-400 hover:underline"
                          >
                            해제
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1.5">
                          <p className="text-[11px] text-slate-400">추천 후보:</p>
                          {candidates.slice(0, 2).map((cand) => (
                            <button
                              key={cand.person.id}
                              onClick={() =>
                                setAssignedSquad(prev => ({ ...prev, [roleId]: cand.person }))
                              }
                              className="w-full p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 flex items-center justify-between text-xs text-left transition-colors"
                            >
                              <div>
                                <span className="font-semibold text-white">{cand.person.name}</span>
                                <span className="text-[10px] text-slate-400 ml-1.5">
                                  {cand.person.currentCompany}
                                </span>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-400">
                                매칭 {cand.score}%
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: 초기 창업 & 시드 레이더 */}
          {activeTab === 'venture' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>동문·동료 초기 창업 리스트</span>
                  <span className="text-[11px] text-emerald-400 font-normal">
                    전체 {ventureStats.totalSignals}건 / 축하 {ventureStats.congratulatedCount}건
                  </span>
                </div>

                <div className="space-y-2.5">
                  {ventureSignals.map((signal) => (
                    <div
                      key={signal.id}
                      onClick={() => setSelectedSignal(signal)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        selectedSignal?.id === signal.id
                          ? 'bg-emerald-950/40 border-emerald-500/80 shadow-md'
                          : 'bg-slate-800/30 border-slate-700/60 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-white">{signal.companyName}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          signal.isCongratulated ? 'bg-slate-800 text-slate-400' : 'bg-emerald-950 text-emerald-300'
                        }`}>
                          {signal.isCongratulated ? '축하 완료' : '신규 포착'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        {signal.personName} ({signal.ventureRole})
                      </p>
                      <p className="text-[10px] text-slate-400 mt-1">
                        {signal.techFocus} · {signal.detectedDate}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* 우측: 축하 서신 & 커피챗 초대 */}
              <div className="lg:col-span-7 space-y-4">
                {selectedSignal && (
                  <div className="bg-slate-800/50 p-5 rounded-xl border border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Rocket className="w-4 h-4 text-emerald-400" />
                        <h4 className="text-xs font-bold text-white">
                          {selectedSignal.personName} 대표님 맞춤 축하 서신
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(congratulatoryLetter, 'congrat_letter')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 shadow-md"
                        >
                          {copiedKey === 'congrat_letter' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          서신 복사
                        </button>
                        {!selectedSignal.isCongratulated && (
                          <button
                            onClick={() => handleMarkCongratulated(selectedSignal.id)}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-800/60 text-xs font-semibold"
                          >
                            소통 완료 기록
                          </button>
                        )}
                      </div>
                    </div>

                    <textarea
                      readOnly
                      value={congratulatoryLetter}
                      rows={11}
                      className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-300 font-sans leading-relaxed resize-none focus:outline-none"
                    />

                    {onOpenTeatimeWithPerson && (
                      <button
                        onClick={() => {
                          const person = people.find(p => p.id === selectedSignal.personId) || people[0];
                          onOpenTeatimeWithPerson(person);
                        }}
                        className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2 border border-emerald-800/50 transition-colors"
                      >
                        <Coffee className="w-4 h-4" />
                        대표님과 15분 축하 티타임 즉시 일정 조율
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: 피어 신뢰 보증 & 디지털 vCard 명함 */}
          {activeTab === 'trust_card' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 좌측: 디지털 명함 카드 미리보기 */}
                <div className="p-6 rounded-2xl bg-gradient-to-tr from-slate-900 via-slate-850 to-slate-800 border border-slate-700 shadow-xl space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white font-bold text-base shadow-md">
                        {myDigitalCard.name.slice(0, 1)}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-white">{myDigitalCard.name}</h3>
                        <p className="text-xs text-slate-300">
                          {myDigitalCard.company} · {myDigitalCard.title}
                        </p>
                      </div>
                    </div>
                    <QrCode className="w-8 h-8 text-slate-400" />
                  </div>

                  <div className="space-y-1.5 text-xs text-slate-400 pt-2 border-t border-slate-800">
                    <p>• 연락처: {myDigitalCard.phone}</p>
                    <p>• 이메일: {myDigitalCard.email}</p>
                    <p>• 주력 스택: {(myDigitalCard.productionStack || []).join(', ')}</p>
                  </div>

                  {/* 피어 신뢰 보증 내역 */}
                  <div className="pt-2">
                    <p className="text-[11px] font-semibold text-emerald-400 mb-2">동문·동료 신뢰 보증 내역</p>
                    <div className="flex flex-wrap gap-1.5">
                      {endorsements.slice(0, 4).map((end) => (
                        <span
                          key={end.id}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950/80 border border-emerald-800/80 text-emerald-300 text-[11px] font-semibold"
                        >
                          ⭐️ {end.endorserName} 추천: {(end.selectedStrengths || []).join(', ')}
                        </span>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleDownloadVCard}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all"
                  >
                    <Download className="w-4 h-4" />
                    표준 vCard 모바일 연락처 다운로드 (.vcf)
                  </button>
                </div>

                {/* 우측: 15분 캐주얼 커피챗 룰렛 설정 */}
                <div className="bg-slate-800/40 p-5 rounded-2xl border border-slate-700/60 space-y-4">
                  <div className="flex items-center gap-2">
                    <Coffee className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white">사내/동문 15분 캐주얼 커피챗 룰렛</h4>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    격식 없는 15분 티타임으로 새로운 동문 및 타 직군과의 캐주얼 접점을 형성합니다.
                  </p>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-300 font-semibold block mb-1">관심 직군 선택</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['frontend', 'backend', 'pm'] as RouletteRole[]).map((role) => (
                          <button
                            key={role}
                            type="button"
                            onClick={() => handleSpinRoulette(role)}
                            className={`py-2 rounded-xl text-xs font-semibold border ${
                              rouletteRole === role
                                ? 'bg-emerald-600 text-white border-emerald-400'
                                : 'bg-slate-900 border-slate-700 text-slate-300'
                            }`}
                          >
                            {role.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>

                    {rouletteMatch && (
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-emerald-800/50 space-y-2">
                        <span className="text-[10px] font-bold text-emerald-400">매칭된 커피챗 파트너:</span>
                        <p className="text-xs font-bold text-white">
                          {rouletteMatch.partner?.name || '동문 파트너'} ({rouletteMatch.partner?.company || '협력사'}) · {rouletteMatch.partner?.roleLabel}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          추천 토픽: {rouletteMatch.matchedTopics?.[0] || '프로덕트 아키텍처 및 성장 경험 교류'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 슈퍼파워 지식 교환 & 실무 SOS */}
          {activeTab === 'knowledge' && (
            <div className="space-y-6">
              {/* 등록 폼 */}
              <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newSosTitle}
                  onChange={(e) => setNewSosTitle(e.target.value)}
                  placeholder="예: GPU 클러스터 분산 학습 최적화 경험 있으신 분 찾습니다..."
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <select
                  value={newSosCategory}
                  onChange={(e) => setNewSosCategory(e.target.value as ProblemCategory)}
                  className="px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  <option value="infra_cloud">클라우드 &amp; 인프라</option>
                  <option value="frontend_ux">프론트엔드 &amp; UX</option>
                  <option value="ai_data">AI &amp; 데이터</option>
                </select>
                <button
                  onClick={handleCreateTicket}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  SOS 지식 티켓 발행
                </button>
              </div>

              {/* 티켓 목록 */}
              <div className="space-y-3">
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-slate-800/30 border border-slate-700/60 hover:border-slate-600 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 text-[10px] font-bold">
                          {t.categoryLabel}
                        </span>
                        <span className="text-xs font-bold text-white">{t.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        티켓ID: #{t.id.slice(0, 8)} · 상태: {t.status} · {t.createdAt?.slice(0, 10)}
                      </p>
                    </div>

                    <button
                      onClick={() => onShowToast(`🤝 티켓 #${t.id.slice(0, 8)}에 대한 지식 교환 팟이 연결되었습니다.`)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold shrink-0 border border-emerald-900/40"
                    >
                      해결 조언 제안
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ========================================================
            하단 액션바 (Footer)
            ======================================================== */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>상호 존중 기반 인간 중심 네트워크 인텔리전스</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
