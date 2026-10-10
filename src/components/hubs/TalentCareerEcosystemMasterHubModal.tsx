import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import { TalentHubTab } from '../../types/masterHub';
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
  CheckCircle2,
  Send,
  Coffee,
  BookOpen
} from 'lucide-react';
import {
  SQUAD_TEMPLATES,
  SQUAD_ROLES,
  SquadRoleId,
  findBestCandidatesForRole,
  analyzeSquadGaps
} from '../../services/projectSquadBuilderService';
import {
  loadVentureSignals,
  getVentureSummaryStats,
  markSignalCongratulated
} from '../../services/ventureRadarService';
import {
  peerTrustCareerService,
  ENDORSEMENT_STRENGTH_TAGS
} from '../../services/peerTrustCareerService';
import {
  networkVitalityService
} from '../../services/networkVitalityService';
import { PeerProblemTicket, ProblemCategory } from '../../types/networkVitality';
import { EarlyStageVentureSignal } from '../../types/ventureRadar';
import { RouletteRole } from '../../types/peerTrustCareer';

export interface TalentCareerEcosystemMasterHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TalentHubTab | string;
  people: Person[];
  selectedPerson?: Person | null;
  onSelectPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const TalentCareerEcosystemMasterHubModal: React.FC<TalentCareerEcosystemMasterHubModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'squad',
  people,
  selectedPerson: _selectedPerson,
  onSelectPerson,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<TalentHubTab>(
    (initialTab as TalentHubTab) || 'squad'
  );

  useEffect(() => {
    if (isOpen && initialTab) {
      if (['squad', 'venture', 'trust_card', 'knowledge_guild', 'sos_desk'].includes(initialTab)) {
        setActiveTab(initialTab as TalentHubTab);
      }
    }
  }, [isOpen, initialTab]);

  // ESC 키 닫기 이벤트 핸들러
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // 1. 스쿼드 빌더 상태
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

  const squadReadiness = useMemo(() => {
    return analyzeSquadGaps(currentTemplate, assignedSquad);
  }, [currentTemplate, assignedSquad]);

  // 2. 창업 & 시드 레이더 상태
  const [ventureSignals, setVentureSignals] = useState<EarlyStageVentureSignal[]>(() => loadVentureSignals(people));
  const ventureStats = useMemo(() => getVentureSummaryStats(ventureSignals), [ventureSignals]);

  // 3. 신뢰 보증 & 디지털 명함 상태
  const endorsements = useMemo(() => peerTrustCareerService.getEndorsements(), []);
  const myDigitalCard = useMemo(() => peerTrustCareerService.getMyDigitalProfile(), []);
  const [copiedVCard, setCopiedVCard] = useState(false);

  // 4. 지식 교환 & 스터디 길드 (커피챗 룰렛) 상태
  const [rouletteRole, setRouletteRole] = useState<RouletteRole>('frontend');
  const [rouletteMatch, setRouletteMatch] = useState(() => peerTrustCareerService.spinCoffeeRoulette('frontend'));

  // 5. 실무 SOS 헬프데스크 상태
  const [tickets, setTickets] = useState<PeerProblemTicket[]>(() => networkVitalityService.getProblemTickets());
  const [newSosTitle, setNewSosTitle] = useState('');
  const [newSosDesc, setNewSosDesc] = useState('');
  const [newSosCategory, setNewSosCategory] = useState<ProblemCategory>('infra_cloud');

  if (!isOpen) return null;

  // vCard 다운로드
  const handleDownloadVCard = () => {
    const vCardData = peerTrustCareerService.generateVCard(myDigitalCard);
    const blob = new Blob([vCardData.vcfString], { type: 'text/vcard;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${myDigitalCard.name}_digital_card.vcf`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('모바일 연락처에 즉시 추가할 수 있는 .vcf 파일이 다운로드되었습니다.');
  };

  // vCard 텍스트 복사
  const handleCopyVCardText = () => {
    const text = `[ConnectWe 디지털 명함]\n${myDigitalCard.name} | ${myDigitalCard.company} ${myDigitalCard.title}\n• 전문 도메인: ${(myDigitalCard.productionStack || []).join(', ')}\n• 연락처: ${myDigitalCard.phone} / ${myDigitalCard.email}`;
    navigator.clipboard.writeText(text);
    setCopiedVCard(true);
    onShowToast('디지털 명함 요약본이 클립보드에 복사되었습니다.');
    setTimeout(() => setCopiedVCard(false), 2500);
  };

  // 신규 SOS 티켓 생성
  const handleCreateSosTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSosTitle.trim()) {
      onShowToast('질문 제목을 입력해 주세요.');
      return;
    }
    const created = networkVitalityService.createProblemTicket(
      {
        title: newSosTitle,
        category: newSosCategory,
        categoryLabel: newSosCategory === 'infra_cloud' ? '클라우드 & 인프라' : newSosCategory === 'frontend_ux' ? '프론트엔드 & UX' : newSosCategory === 'ai_data' ? 'AI & 데이터' : '과금 & 비즈니스',
        description: newSosDesc || '급히 자문이 필요한 아키텍처/배포 문제입니다.',
        confidentialMasked: false
      },
      people
    );
    setTickets([created, ...tickets]);
    setNewSosTitle('');
    setNewSosDesc('');
    onShowToast('24시간 긴급 실무 SOS 티켓이 등록되었습니다. 인맥 네트워크에 전달됩니다.');
  };

  // SOS 티켓 해결 상태 토글
  const handleResolveTicket = (ticketId: string) => {
    setTickets(prev =>
      prev.map(t =>
        t.id === ticketId
          ? { ...t, status: t.status === 'RESOLVED' ? 'OPEN' : 'RESOLVED' }
          : t
      )
    );
    onShowToast('답변 및 지원 연결 상태가 갱신되었습니다.');
  };

  return (
    <div
      data-testid="talent-career-ecosystem-master-hub-modal"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-md animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="talent-hub-title"
    >
      <div
        data-testid="project-squad-builder-modal"
        className="relative w-full max-w-6xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hub Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800/80 bg-gradient-to-r from-indigo-900/10 via-violet-900/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/20">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="talent-hub-title" className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  실무 인재 & 커리어 성장 생태계 마스터 허브
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-100 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/60">
                  Talent Ecosystem
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                프로젝트 스쿼드 가상 편성, 동문 스텔스 창업 신호, 피어 실무 보증, 지식 교환 길드 및 24시간 실무 SOS를 연결합니다.
              </p>
            </div>
          </div>

          <button
            data-testid="close-talent-hub"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label="닫기"
            title="닫기 (ESC)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Master Hub Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('squad')}
            data-testid="tab-hub-squad"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'squad'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>프로젝트 스쿼드 빌더</span>
          </button>

          <button
            onClick={() => setActiveTab('venture')}
            data-testid="tab-hub-venture"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'venture'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Rocket className="w-4 h-4" />
            <span>초기 창업 & 시드 레이더</span>
          </button>

          <button
            onClick={() => setActiveTab('trust_card')}
            data-testid="tab-hub-trust-card"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'trust_card'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>신뢰 보증 & 디지털 명함</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge_guild')}
            data-testid="tab-hub-knowledge-guild"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'knowledge_guild'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>실무 지식 & 스터디 길드</span>
          </button>

          <button
            onClick={() => setActiveTab('sos_desk')}
            data-testid="tab-hub-sos-desk"
            className={`flex items-center gap-2 py-3 px-3.5 border-b-2 text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'sos_desk'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            <LifeBuoy className="w-4 h-4" />
            <span>24h 실무 SOS</span>
          </button>
        </div>

        {/* Hub Body (Tab Panels) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: 프로젝트 스쿼드 빌더 */}
          {activeTab === 'squad' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 스쿼드 템플릿 선택 및 준비도 게이지 */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-sky-50/40 to-white dark:from-indigo-950/30 dark:via-sky-950/20 dark:to-slate-900 border border-indigo-200/80 dark:border-indigo-900/60 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span>스마트 프로젝트 스쿼드 가상 편성기</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    기획, AI, 풀스택, 디자인, 그로스 등 핵심 5대 직군의 실무 인재를 신뢰 인맥에서 스마트 매칭합니다.
                  </p>

                  <div className="flex items-center gap-2 mt-3">
                    {SQUAD_TEMPLATES.map((tmpl) => (
                      <button
                        key={tmpl.id}
                        onClick={() => setSelectedTemplateId(tmpl.id)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                          selectedTemplateId === tmpl.id
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {tmpl.title}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-center shrink-0 min-w-[160px]">
                  <div className="text-[11px] font-semibold text-slate-500">스쿼드 완성도</div>
                  <div className="text-2xl font-extrabold text-indigo-600 dark:text-indigo-400 my-0.5">
                    {squadReadiness.readinessScore}%
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {squadReadiness.filledSlots} / {squadReadiness.totalSlots} 슬롯 충원됨
                  </div>
                </div>
              </div>

              {/* 스쿼드 슬롯 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentTemplate.roles.map((roleId: SquadRoleId) => {
                  const roleDef = SQUAD_ROLES[roleId];
                  const assigned = assignedSquad[roleId];
                  const candidates = findBestCandidatesForRole(people, roleId, 4);
                  const topCandidate = candidates[0];

                  return (
                    <div
                      key={roleId}
                      className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/90 dark:border-slate-700/80 shadow-xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{roleDef.label}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                          {roleDef.category}
                        </span>
                      </div>

                      {assigned ? (
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-white">{assigned.name}</div>
                            <div className="text-[11px] text-slate-500">{assigned.currentCompany} · {assigned.currentTitle}</div>
                          </div>
                          <button
                            onClick={() => setAssignedSquad((prev) => ({ ...prev, [roleId]: null }))}
                            className="text-xs text-rose-500 hover:underline font-semibold cursor-pointer"
                          >
                            해제
                          </button>
                        </div>
                      ) : topCandidate ? (
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{topCandidate.person.name}</span>
                            <span className="text-xs font-extrabold text-indigo-600 dark:text-indigo-400">
                              적합도 {topCandidate.score}%
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{topCandidate.highlightReason}</p>
                          <div className="flex items-center justify-between pt-1">
                            <button
                              onClick={() => {
                                setAssignedSquad((prev) => ({ ...prev, [roleId]: topCandidate.person }));
                                onShowToast(`${topCandidate.person.name}님이 ${roleDef.label} 역할에 배정되었습니다.`);
                              }}
                              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                            >
                              + 스쿼드에 배정
                            </button>
                            {onSelectPerson && (
                              <button
                                onClick={() => onSelectPerson(topCandidate.person)}
                                className="text-[11px] text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                프로필
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 rounded-xl bg-slate-50/50 dark:bg-slate-900/30 border border-dashed border-slate-300 dark:border-slate-700 text-center text-xs text-slate-400">
                          인맥 내 적합 후보 탐색 중
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
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 시드 펀딩 요약 통계 */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700">
                  <div className="text-xs text-slate-500 font-semibold">감지된 창업 시그널</div>
                  <div className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                    {ventureStats.totalSignals}건
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800">
                  <div className="text-xs text-indigo-700 dark:text-indigo-300 font-semibold">스텔스 창업자</div>
                  <div className="text-xl font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                    {ventureStats.stealthCount}명
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800">
                  <div className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">시드·TIPS 선정</div>
                  <div className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {ventureStats.seedTipsCount}팀
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800">
                  <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold">시리즈 A 및 도약</div>
                  <div className="text-xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                    {ventureStats.seriesACount}팀
                  </div>
                </div>
              </div>

              {/* 시그널 목록 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {ventureSignals.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900 dark:text-white">{sig.personName}</span>
                          <span className="text-xs text-slate-500 font-medium">({sig.companyName})</span>
                        </div>
                        <p className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-0.5">{sig.techFocus}</p>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300">
                        {sig.fundingStage}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                      {sig.pitchSummary}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <span className="text-slate-400 font-mono text-[11px]">감지일: {sig.detectedDate}</span>
                      <button
                        onClick={() => {
                          const updated = markSignalCongratulated(sig.id, ventureSignals);
                          setVentureSignals(updated);
                          onShowToast(`${sig.personName}님에게 전할 축하 메시지가 생성되었습니다.`);
                        }}
                        className="font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
                      >
                        {sig.isCongratulated ? '✓ 축하 완료' : '💌 축하 서신 제안'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 신뢰 보증 & 디지털 명함 */}
          {activeTab === 'trust_card' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 내 vCard 디지털 명함 카드 */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg bg-white/10 text-xs font-semibold text-indigo-300">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>모바일 vCard 3.0 디지털 명함</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {myDigitalCard.name} <span className="text-sm font-normal text-slate-300">({myDigitalCard.company} · {myDigitalCard.title})</span>
                  </h3>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(myDigitalCard.productionStack || []).map((tag: string, idx: number) => (
                      <span key={idx} className="px-2 py-0.5 text-xs rounded-md bg-white/10 text-slate-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleDownloadVCard}
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-white text-slate-900 hover:bg-slate-100 transition-all cursor-pointer shadow-md"
                  >
                    <Download className="w-4 h-4 text-indigo-600" />
                    <span>.vcf 다운로드</span>
                  </button>
                  <button
                    onClick={handleCopyVCardText}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all cursor-pointer"
                  >
                    {copiedVCard ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>명함 복사</span>
                  </button>
                </div>
              </div>

              {/* 피어 실무 보증 태그 */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Award className="w-4 h-4 text-amber-500" />
                      <span>4단계 피어 실무 보증 (Peer Endorsement)</span>
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      함께 협업한 동료들이 객관적 프로젝트 결과물을 바탕으로 상호 보증한 핵심 역량
                    </p>
                  </div>
                  <span className="text-xs text-slate-500">등록된 보증 {endorsements.length}건</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {ENDORSEMENT_STRENGTH_TAGS.slice(0, 6).map((tag) => (
                    <div
                      key={tag.id}
                      className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">{tag.label}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {tag.categoryLabel}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 line-clamp-2">{tag.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: 실무 지식 & 스터디 길드 */}
          {activeTab === 'knowledge_guild' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 커피챗 룰렛 매칭 카드 */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50/70 via-indigo-50/30 to-white dark:from-amber-950/30 dark:via-indigo-950/20 dark:to-slate-900 border border-amber-200/80 dark:border-amber-900/60 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-amber-500 text-white">
                      <Coffee className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        1:1 캐주얼 커피챗 룰렛 & 지식 교환 팟
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        부담 없는 20분 커피챗을 통해 서로의 전문 지식과 실무 인사이트를 교환합니다.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(['frontend', 'backend', 'designer', 'pm', 'marketing', 'data'] as const).map((role) => (
                      <button
                        key={role}
                        onClick={() => {
                          setRouletteRole(role as RouletteRole);
                          setRouletteMatch(peerTrustCareerService.spinCoffeeRoulette(role as RouletteRole));
                        }}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer ${
                          rouletteRole === role
                            ? 'bg-amber-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {role === 'frontend' ? '프론트엔드' : role === 'backend' ? '백엔드' : role === 'designer' ? '디자이너' : role === 'pm' ? '기획자' : role === 'marketing' ? '마케터' : '데이터'}
                      </button>
                    ))}
                  </div>
                </div>

                {rouletteMatch ? (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          오늘의 추천 파트너: {rouletteMatch.partner.name}
                        </span>
                        <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold">
                          ({rouletteMatch.partner.company} · {rouletteMatch.partner.title})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                        대화 추천 아젠다: {rouletteMatch.icebreakerQuestions[0] || '최근 실무 경험 및 관심 기술 환담'}
                      </p>
                    </div>

                    <button
                      onClick={() => onShowToast(`${rouletteMatch.partner.name}님에게 따뜻한 커피챗 제안 서신이 준비되었습니다.`)}
                      className="px-4 py-2 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-xs transition-all cursor-pointer shrink-0"
                    >
                      ☕ 커피챗 신청하기
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-slate-400">
                    해당 직군의 매칭 파트너를 탐색 중입니다.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 5: 24h 실무 SOS 헬프데스크 */}
          {activeTab === 'sos_desk' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* 긴급 질문 등록 카드 */}
              <form onSubmit={handleCreateSosTicket} className="p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <LifeBuoy className="w-4 h-4 text-rose-500" />
                    <span>24시간 실무 SOS 긴급 헬프데스크 등록</span>
                  </h3>
                  <span className="text-[11px] text-slate-400">동문 및 실무 네트워크에 비공개 안심 전달됩니다.</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <select
                    value={newSosCategory}
                    onChange={(e) => setNewSosCategory(e.target.value as ProblemCategory)}
                    className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 cursor-pointer"
                  >
                    <option value="infra_cloud">🚨 클라우드 &amp; 인프라</option>
                    <option value="frontend_ux">🎨 프론트엔드 &amp; UX</option>
                    <option value="ai_data">🤖 AI &amp; 데이터</option>
                    <option value="growth_biz">📈 과금 &amp; 비즈니스</option>
                  </select>

                  <input
                    type="text"
                    value={newSosTitle}
                    onChange={(e) => setNewSosTitle(e.target.value)}
                    placeholder="긴급 질문 요약 (예: Next.js 15 빌드 메모리 누수 해결 경험자 계실까요?)"
                    className="sm:col-span-3 px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 placeholder:text-slate-400"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>SOS 티켓 발송</span>
                  </button>
                </div>
              </form>

              {/* 등록된 SOS 티켓 목록 */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500">진행 중인 실무 SOS 티켓</h4>
                {tickets.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 rounded-xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 flex items-start justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                          {t.categoryLabel}
                        </span>
                        <span className="text-sm font-bold text-slate-900 dark:text-white">{t.title}</span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{t.description}</p>
                      <span className="text-[11px] text-slate-400 font-mono">
                        등록일: {t.createdAt} · 상태: {t.status === 'RESOLVED' ? '해결 완료' : '답변 대기 중'}
                      </span>
                    </div>

                    <button
                      onClick={() => handleResolveTicket(t.id)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-200 shrink-0 cursor-pointer"
                    >
                      {t.status === 'RESOLVED' ? '완료됨' : '💡 자문 답변하기'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Hub Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>실무 인재 상호 성장 및 4단계 피어 신뢰 네트워크 가동 중</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-semibold transition-all cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
