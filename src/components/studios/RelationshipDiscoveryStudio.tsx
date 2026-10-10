import React, { useState, useMemo, useEffect } from 'react';
import { Person } from '../../types/network';
import { CalendarMeeting } from '../../services/calendarRadarService';
import { BusinessDeal, loadDealsFromStorage } from '../../services/dealPipelineService';
import { findBestIntroPaths, WarmIntroPath } from '../../services/warmIntroPathFinder';
import { 
  calculateTieStrength, 
  getCoolingDownAlerts, 
  buildIndustryHeatmapMatrix,
  TIE_STRENGTH_CONFIG,
  TieStrengthLevel
} from '../../services/tieStrengthService';
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
  Compass,
  GitFork,
  Flame,
  Gift,
  X,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  MessageCircle,
  Users,
  Search,
  Coffee,
  CheckCircle2,
  HeartHandshake,
  Snowflake,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export type RelationshipDiscoveryTab = 'path' | 'degrees' | 'heatmap' | 'gratitude';

export interface WarmIntroPathExtended extends WarmIntroPath {
  nodes: Person[];
  confidenceScore: number;
  explanation: string;
}

export interface RelationshipDiscoveryStudioProps {
  isOpen: boolean;
  initialTab?: RelationshipDiscoveryTab;
  people: Person[];
  targetPerson?: Person | null;
  personA?: Person | null;
  personB?: Person | null;
  meetings?: CalendarMeeting[];
  initialDeal?: BusinessDeal | null;
  onClose: () => void;
  onSelectPerson?: (person: Person) => void;
  onOpenTeatimeWithPerson?: (person: Person) => void;
  onShowToast: (msg: string) => void;
}

export const RelationshipDiscoveryStudio: React.FC<RelationshipDiscoveryStudioProps> = ({
  isOpen,
  initialTab = 'path',
  people,
  targetPerson: initialTargetPerson,
  personA: initialPersonA,
  personB: initialPersonB,
  meetings = [],
  initialDeal,
  onClose,
  onSelectPerson,
  onOpenTeatimeWithPerson,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<RelationshipDiscoveryTab>(initialTab);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // ESC 키 닫기 이벤트 리스너
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleCopy = (text: string, key: string, successMsg = '클립보드에 복사되었습니다.') => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    onShowToast(successMsg);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // ----------------------------------------------------
  // '나(Me)' 기준점 인물 도출
  // ----------------------------------------------------
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
      skills: ['경영', 'AI'],
      careers: [],
      academics: [],
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: '경영/전략',
      isStale: false,
      connectionChannel: 'manual'
    };
  }, [people]);

  // ====================================================
  // TAB 1: 최단 신뢰 소개 경로 & 2인 연결 (path)
  // ====================================================
  const [pathSubMode, setPathSubMode] = useState<'find_path' | 'connect_two'>(
    initialPersonA && initialPersonB ? 'connect_two' : 'find_path'
  );
  const [selectedTarget, setSelectedTarget] = useState<Person | null>(() => {
    if (initialTargetPerson) return initialTargetPerson;
    return people.find(p => p.id !== me.id && (p.closeness >= 2 || !p.closeness)) || people[1] || null;
  });
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);
  const [includeTeatimeSlots, setIncludeTeatimeSlots] = useState(true);

  // 최단 신뢰 경로 산출 및 확장 매핑
  const paths: WarmIntroPathExtended[] = useMemo(() => {
    if (!selectedTarget) return [];
    const rawPaths = findBestIntroPaths(me, selectedTarget, people);
    return rawPaths.map(p => ({
      ...p,
      nodes: [me, p.intermediary, p.target],
      confidenceScore: p.trustScore,
      explanation: p.synergyReason
    }));
  }, [me, selectedTarget, people]);

  const currentPath = paths[selectedPathIndex] || paths[0] || null;

  // 소개 요청 서신 템플릿 자동 생성 (기능 확장: 거점 티타임 일정 동봉)
  const introRequestLetter = useMemo(() => {
    if (!selectedTarget || !currentPath || currentPath.nodes.length < 3) {
      return '';
    }
    const bridge = currentPath.nodes[1]; // 나의 1촌 소개자
    const target = selectedTarget;

    const baseLetter = `[소개 요청] 안녕하세요, ${bridge.name} ${bridge.currentTitle || '님'}.\n` +
      `늘 깊은 신뢰와 응원에 감사드립니다.\n\n` +
      `다름이 아니라, ${target.currentCompany}에서 ${target.currentTitle || '중책'}을 맡고 계신 ${target.name} 님과 사업적 시너지 및 협력 방안을 논의하고자 정중히 소개를 부탁드리고자 합니다.\n\n` +
      `[소개 희망 사유]\n` +
      `• 주요 관심 분야: ${target.primaryDomain || '신규 비즈니스 협력'}\n` +
      `• 공유 강점: ${target.skills?.slice(0, 2).join(', ') || '전문 도메인 시너지'}\n`;

    const teatimeSlots = includeTeatimeSlots
      ? `\n[제안 티타임 일정 (편하신 시간 선택 가능)]\n` +
        `• 옵션 1: 평일 오후 2시~4시 (강남/테헤란로 거점)\n` +
        `• 옵션 2: 평일 오전 10시~11시 (여의도/광화문 거점)\n` +
        `• 옵션 3: 온라인 비대면 20분 가벼운 티타임\n\n`
      : '\n';

    const closing = `${bridge.name} 님께서 편안하신 방식으로 의사를 여쭤봐 주시면 대단히 감사하겠습니다.\n\n` +
      `ConnectWe 드림`;

    return baseLetter + teatimeSlots + closing;
  }, [selectedTarget, currentPath, includeTeatimeSlots]);

  // 2인 연결 상태 (connect_two)
  const [connectorPersonA, setConnectorPersonA] = useState<Person | null>(initialPersonA || people[0] || null);
  const [connectorPersonB, setConnectorPersonB] = useState<Person | null>(initialPersonB || people[1] || null);
  const [connectContext, setConnectContext] = useState<string>('AI 및 비즈니스 파트너십 논의');

  const doubleOptInLetter = useMemo(() => {
    if (!connectorPersonA || !connectorPersonB) return '';
    return `[신뢰 네트워크 연결] 안녕하세요, ${connectorPersonA.name} 님, ${connectorPersonB.name} 님.\n\n` +
      `두 분 모두 제가 깊이 신뢰하는 훌륭한 파트너이십니다.\n` +
      `최근 논의 중이신 '${connectContext}' 분야에서 두 분이 함께 소통하시면 매우 큰 시너지가 날 것으로 확신하여 조심스럽게 연결해 드립니다.\n\n` +
      `• ${connectorPersonA.name} 님: ${connectorPersonA.currentCompany} ${connectorPersonA.currentTitle || ''}\n` +
      `• ${connectorPersonB.name} 님: ${connectorPersonB.currentCompany} ${connectorPersonB.currentTitle || ''}\n\n` +
      `두 분의 일정과 상황에 맞춰 편안하게 인사를 나누실 수 있도록 자리를 마련해 드립니다.\n\n` +
      `따뜻한 인연이 되기를 응원합니다.\n` +
      `${me.name} 드림`;
  }, [connectorPersonA, connectorPersonB, connectContext, me]);

  // ====================================================
  // TAB 2: 6단계 인맥 분리 & 알럼나이 브릿지 (degrees)
  // ====================================================
  const [degreesTarget, setDegreesTarget] = useState<Person>(() => {
    if (initialTargetPerson) return initialTargetPerson;
    return people.find(p => p.id !== me.id) || people[0] || me;
  });

  const targetCompanies = useMemo(() => {
    return new Set([
      degreesTarget.currentCompany,
      ...degreesTarget.careers.map(c => c.companyName)
    ]);
  }, [degreesTarget]);

  const targetSchools = useMemo(() => {
    return new Set(degreesTarget.academics.map(a => a.schoolName));
  }, [degreesTarget]);

  // 1촌 브릿지 후보군 연산
  const bridgeList = useMemo(() => {
    return people
      .filter(p => p.id !== degreesTarget.id && p.id !== me.id && p.closeness <= 3)
      .map(bridge => {
        let trustScore = 50;
        const reasons: string[] = [];

        if (bridge.currentCompany === degreesTarget.currentCompany) {
          trustScore += 40;
          reasons.push(`현재 같은 직장(${bridge.currentCompany}) 재직 중`);
        }

        bridge.careers.filter(c => !c.isCurrent).forEach(c => {
          if (targetCompanies.has(c.companyName)) {
            trustScore += 25;
            reasons.push(`과거 ${c.companyName} 동문/동료 재직 이력`);
          }
        });

        bridge.academics.forEach(a => {
          if (targetSchools.has(a.schoolName)) {
            trustScore += 20;
            reasons.push(`${a.schoolName} 동문 네트워크`);
          }
        });

        if (bridge.closeness === 1) {
          trustScore += 15;
          reasons.push('나와의 직속 1촌 신뢰 관계');
        }

        return {
          bridge,
          trustScore: Math.min(100, trustScore),
          reasons: reasons.length > 0 ? reasons : ['네트워크 공통 관심사 보유']
        };
      })
      .sort((a, b) => b.trustScore - a.trustScore);
  }, [people, degreesTarget, me, targetCompanies, targetSchools]);

  // ====================================================
  // TAB 3: 결속도 Tie Strength & 관계 온도 히트맵 (heatmap)
  // ====================================================
  const [selectedHeatLevel, setSelectedHeatLevel] = useState<TieStrengthLevel | 'ALL'>('ALL');
  const [heatSearchQuery, setHeatSearchQuery] = useState('');

  const peopleWithTieStrength = useMemo(() => {
    return people
      .filter(p => p.id !== me.id)
      .map(person => ({
        person,
        detail: calculateTieStrength(person, meetings)
      }));
  }, [people, meetings, me]);

  const coolingDownAlerts = useMemo(() => {
    return getCoolingDownAlerts(people, meetings);
  }, [people, meetings]);

  const industryMatrix = useMemo(() => {
    return buildIndustryHeatmapMatrix(people, meetings);
  }, [people, meetings]);

  const filteredHeatmapPeople = useMemo(() => {
    return peopleWithTieStrength.filter(({ person, detail }) => {
      if (selectedHeatLevel !== 'ALL' && detail.level !== selectedHeatLevel) return false;
      if (heatSearchQuery.trim()) {
        const q = heatSearchQuery.toLowerCase();
        return (
          person.name.toLowerCase().includes(q) ||
          person.currentCompany.toLowerCase().includes(q) ||
          (person.currentTitle && person.currentTitle.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [peopleWithTieStrength, selectedHeatLevel, heatSearchQuery]);

  // ====================================================
  // TAB 4: 파트너십 연계 & 감사 리워드 정산 (gratitude)
  // ====================================================
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

  const [gratitudeSubTab, setGratitudeSubTab] = useState<'list' | 'create'>('list');
  const [selectedDealId, setSelectedDealId] = useState<string>(
    initialDeal?.id || (deals[0]?.id || '')
  );
  const currentDeal = useMemo(() => deals.find(d => d.id === selectedDealId), [deals, selectedDealId]);

  const candidateReferrers = useMemo(() => {
    if (!currentDeal) return [];
    return matchPotentialReferrers(currentDeal, people);
  }, [currentDeal, people]);

  const [selectedReferrerId, setSelectedReferrerId] = useState<string>(
    candidateReferrers[0]?.id || (people[1]?.id || '')
  );
  const currentReferrer = useMemo(
    () => people.find(p => p.id === selectedReferrerId),
    [people, selectedReferrerId]
  );

  const [rewardType, setRewardType] = useState<GratitudeRewardType>('DINING');
  const [rewardValue, setRewardValue] = useState<string>(
    GRATITUDE_REWARD_PRESETS.DINING.defaultValue
  );
  const [customNotes, setCustomNotes] = useState<string>('');

  const handleCreateSettlement = () => {
    if (!currentDeal || !currentReferrer) {
      onShowToast('딜 정보 또는 추천인을 선택해 주세요.');
      return;
    }

    const templateSettlement: GratitudeSettlement = {
      id: `set-${Date.now()}`,
      dealId: currentDeal.id,
      dealTitle: currentDeal.title,
      dealSize: currentDeal.dealSize || '규모 협의 중',
      referrerPersonId: currentReferrer.id,
      referrerName: currentReferrer.name,
      referrerCompany: currentReferrer.currentCompany,
      referrerTitle: currentReferrer.currentTitle || '파트너',
      rewardType,
      rewardValue,
      status: 'PLANNED',
      plannedDate: new Date().toISOString().slice(0, 10),
      createdAt: new Date().toISOString(),
      thankYouLetter: ''
    };

    templateSettlement.thankYouLetter = generateThankYouLetter(templateSettlement);

    const next = [templateSettlement, ...settlements];
    setSettlements(next);
    saveSettlementsToStorage(next);
    onShowToast(`🎉 ${currentReferrer.name} 님께 드릴 추천 감사 리워드가 등록되었습니다.`);
    setGratitudeSubTab('list');
  };

  const handleUpdateStatus = (id: string, newStatus: SettlementStatus) => {
    const next = settlements.map(s => (s.id === id ? { ...s, status: newStatus } : s));
    setSettlements(next);
    saveSettlementsToStorage(next);
    onShowToast(`정산 상태가 '${newStatus === 'COMPLETED' ? '완료' : '진행 중'}'(으)로 갱신되었습니다.`);
  };

  if (!isOpen) return null;

  return (
    <div 
      data-testid="relationship-discovery-studio"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="relationship-discovery-title"
        className="relative w-full max-w-5xl h-[92vh] max-h-[920px] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* ========================================================
            헤더 (Header)
            ======================================================== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Compass className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="relationship-discovery-title" className="text-lg font-bold text-white tracking-tight">
                  인맥 탐색 &amp; 웜 인트로 지능형 스튜디오
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/80 text-[11px] font-semibold">
                  통합 메가스튜디오 2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                최단 신뢰 소개 경로 ↔ 6단계 알럼나이 브릿지 ↔ 관계 결속도 히트맵 ↔ 파트너십 감사 리워드
              </p>
            </div>
          </div>
          <button
            data-testid="close-relationship-studio"
            onClick={onClose}
            title="닫기 (ESC)"
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ========================================================
            4대 통합 네비게이션 탭바 (Tab Navigation)
            ======================================================== */}
        <div className="flex items-center gap-1 px-6 bg-slate-950/60 border-b border-slate-800 overflow-x-auto py-2">
          <button
            onClick={() => setActiveTab('path')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'path'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            최단 신뢰 소개 경로 &amp; 2인 연결
          </button>

          <button
            onClick={() => setActiveTab('degrees')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'degrees'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <GitFork className="w-4 h-4" />
            6단계 인맥 분리 &amp; 알럼나이 다리
          </button>

          <button
            onClick={() => setActiveTab('heatmap')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'heatmap'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Flame className="w-4 h-4" />
            결속도 Tie Strength &amp; 온도 히트맵
          </button>

          <button
            onClick={() => setActiveTab('gratitude')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'gratitude'
                ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Gift className="w-4 h-4" />
            파트너십 연계 &amp; 추천 감사 리워드
          </button>
        </div>

        {/* ========================================================
            본문 뷰 (Tab Body)
            ======================================================== */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: 최단 신뢰 소개 경로 & 2인 연결 */}
          {activeTab === 'path' && (
            <div className="space-y-6">
              {/* 서브 모드 전환 토글 */}
              <div className="flex items-center justify-between bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/60">
                <div className="flex gap-1">
                  <button
                    onClick={() => setPathSubMode('find_path')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      pathSubMode === 'find_path'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    1. 누구를 소개받을까요? (최단 신뢰 경로)
                  </button>
                  <button
                    onClick={() => setPathSubMode('connect_two')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      pathSubMode === 'connect_two'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    2. 두 사람을 잇기 (Double Opt-in 소개자 모드)
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline px-2">
                  Dijkstra 알고리즘 &amp; 신뢰 가중치 매칭
                </span>
              </div>

              {pathSubMode === 'find_path' ? (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* 좌측: 소개 희망 타겟 선택 및 경로 리스트 */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-3">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>만나고 싶은 인물 (소개 대상)</span>
                        <span className="text-[11px] text-cyan-400 font-normal">총 {people.length}명 풀</span>
                      </label>
                      <select
                        value={selectedTarget?.id || ''}
                        onChange={(e) => {
                          const target = people.find(p => p.id === e.target.value) || null;
                          setSelectedTarget(target);
                          setSelectedPathIndex(0);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                      >
                        {people
                          .filter(p => p.id !== me.id)
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.name} ({p.currentCompany} · {p.currentTitle || '직책미상'})
                            </option>
                          ))}
                      </select>
                    </div>

                    {/* 탐색된 경로 카드 목록 */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                        <span>추천 소개 경로 ({paths.length}개 발견)</span>
                        <span className="text-[11px] text-emerald-400">신뢰도 가중치 정렬</span>
                      </div>

                      {paths.length === 0 ? (
                        <div className="p-8 text-center bg-slate-800/20 rounded-xl border border-dashed border-slate-700">
                          <Users className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                          <p className="text-xs text-slate-400">연결 가능한 유효 소개 경로를 계산 중이거나 알럼나이 브릿지 탭에서 1촌 다리를 확인하세요.</p>
                        </div>
                      ) : (
                        paths.map((p, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedPathIndex(idx)}
                            className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                              selectedPathIndex === idx
                                ? 'bg-cyan-950/40 border-cyan-500/80 shadow-md shadow-cyan-900/20'
                                : 'bg-slate-800/30 border-slate-700/60 hover:bg-slate-800/60'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="px-2 py-0.5 rounded-md bg-cyan-900/60 text-cyan-300 text-[10px] font-bold">
                                {idx === 0 ? '🏆 최단·최적 경로' : `경로 #${idx + 1}`}
                              </span>
                              <span className="text-xs font-mono font-bold text-cyan-400">
                                신뢰도 {Math.round(p.confidenceScore || 85)}%
                              </span>
                            </div>

                            {/* 노드 경로 시각화 */}
                            <div className="flex items-center gap-2 overflow-x-auto py-1">
                              {p.nodes.map((node, nIdx) => (
                                <React.Fragment key={node.id}>
                                  <div className="flex items-center gap-1.5 shrink-0 px-2 py-1 rounded-lg bg-slate-900/80 border border-slate-700/80 text-[11px]">
                                    <span className="font-semibold text-white">{node.name}</span>
                                    <span className="text-slate-400 text-[10px]">({node.currentCompany})</span>
                                  </div>
                                  {nIdx < p.nodes.length - 1 && (
                                    <ArrowRight className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                                  )}
                                </React.Fragment>
                              ))}
                            </div>

                            <p className="text-[11px] text-slate-400 mt-2">
                              {p.explanation || '신뢰 네트워크 알럼나이 1촌을 통한 안전한 연결'}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 우측: 소개 요청 서신 생성 & 기능 확장 (거점 티타임 동봉) */}
                  <div className="lg:col-span-6 space-y-4">
                    <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/80 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-cyan-400" />
                          <h4 className="text-xs font-bold text-white">소개자 맞춤 정중한 요청 서신</h4>
                        </div>
                        <button
                          onClick={() => handleCopy(introRequestLetter, 'intro_letter', '소개 요청 서신이 복사되었습니다.')}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all shadow-md"
                        >
                          {copiedKey === 'intro_letter' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                          서신 복사
                        </button>
                      </div>

                      {/* 기능 확장: 티타임 슬롯 동봉 토글 */}
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60">
                        <div className="flex items-center gap-2">
                          <Coffee className="w-4 h-4 text-amber-400" />
                          <div>
                            <p className="text-xs font-semibold text-white">거점 티타임 제안 슬롯 자동 동봉</p>
                            <p className="text-[10px] text-slate-400">강남/여의도/판교 추천 시간대 포함</p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={includeTeatimeSlots}
                          onChange={(e) => setIncludeTeatimeSlots(e.target.checked)}
                          className="w-4 h-4 text-cyan-600 rounded bg-slate-800 border-slate-700 focus:ring-cyan-500"
                        />
                      </div>

                      <textarea
                        readOnly
                        value={introRequestLetter}
                        rows={12}
                        className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-300 font-sans leading-relaxed resize-none focus:outline-none"
                      />

                      {currentPath && currentPath.nodes.length >= 2 && onOpenTeatimeWithPerson && (
                        <button
                          onClick={() => onOpenTeatimeWithPerson(currentPath.nodes[1])}
                          className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold flex items-center justify-center gap-2 border border-cyan-800/50 transition-colors"
                        >
                          <Coffee className="w-4 h-4" />
                          소개자({currentPath.nodes[1].name} 님)와 사전 티타임 조율하기
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                /* connect_two: 2인 연결 모드 */
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
                      <label className="text-xs font-semibold text-slate-300">연결할 첫 번째 인물 (A)</label>
                      <select
                        value={connectorPersonA?.id || ''}
                        onChange={(e) => setConnectorPersonA(people.find(p => p.id === e.target.value) || null)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        {people.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.currentCompany})</option>
                        ))}
                      </select>
                    </div>

                    <div className="bg-slate-800/40 p-4 rounded-xl border border-slate-700/60 space-y-2">
                      <label className="text-xs font-semibold text-slate-300">연결할 두 번째 인물 (B)</label>
                      <select
                        value={connectorPersonB?.id || ''}
                        onChange={(e) => setConnectorPersonB(people.find(p => p.id === e.target.value) || null)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        {people.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.currentCompany})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="bg-slate-800/40 p-3 rounded-xl border border-slate-700/60 space-y-1">
                    <label className="text-xs font-semibold text-slate-300">연결 제안 주제 / 협업 맥락</label>
                    <input
                      type="text"
                      value={connectContext}
                      onChange={(e) => setConnectContext(e.target.value)}
                      placeholder="예: AI 스타트업 투자 및 공동 기술 개발"
                      className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400" />
                        Double Opt-in 두 사람 연결 서신 초안
                      </h4>
                      <button
                        onClick={() => handleCopy(doubleOptInLetter, 'double_opt_in', '연결 서신이 복사되었습니다.')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold transition-all"
                      >
                        {copiedKey === 'double_opt_in' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        서신 복사
                      </button>
                    </div>
                    <textarea
                      readOnly
                      value={doubleOptInLetter}
                      rows={9}
                      className="w-full p-3.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-slate-300 font-sans leading-relaxed resize-none focus:outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: 6단계 인맥 분리 & 알럼나이 다리 */}
          {activeTab === 'degrees' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-white flex items-center gap-2">
                    <GitFork className="w-4 h-4 text-cyan-400" />
                    대상 인물 분석: {degreesTarget.name} ({degreesTarget.currentCompany} {degreesTarget.currentTitle || ''})
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    직장 이력({targetCompanies.size}개) 및 출신 학교({targetSchools.size}개) 기반 신뢰 다리 후보군
                  </p>
                </div>
                <select
                  value={degreesTarget.id}
                  onChange={(e) => {
                    const found = people.find(p => p.id === e.target.value);
                    if (found) setDegreesTarget(found);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                >
                  {people.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.currentCompany})</option>
                  ))}
                </select>
              </div>

              {/* 1촌 다리(Bridge) 카드 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {bridgeList.slice(0, 8).map(({ bridge, trustScore, reasons }) => (
                  <div
                    key={bridge.id}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/70 hover:border-cyan-500/60 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center font-bold text-white text-xs">
                          {bridge.name.slice(0, 1)}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-white">{bridge.name}</p>
                          <p className="text-[11px] text-slate-400">{bridge.currentCompany} · {bridge.currentTitle || '임직원'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800/80 text-[10px] font-mono font-bold">
                          신뢰 {trustScore}점
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                      {reasons.map((r, rIdx) => (
                        <p key={rIdx} className="text-[11px] text-cyan-300 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-cyan-400 shrink-0" />
                          {r}
                        </p>
                      ))}
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => {
                          setSelectedTarget(degreesTarget);
                          setActiveTab('path');
                          onShowToast(`${bridge.name} 님을 통한 소개 경로로 전환되었습니다.`);
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        소개 경로 생성
                      </button>
                      {onSelectPerson && (
                        <button
                          onClick={() => onSelectPerson(bridge)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                        >
                          프로필
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: 결속도 Tie Strength & 온도 히트맵 */}
          {activeTab === 'heatmap' && (
            <div className="space-y-6">
              {/* 상단 급랭 위험 알림 (기능 확장: 원터치 소개/안부 전환) */}
              {coolingDownAlerts.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/80 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Snowflake className="w-4 h-4 text-amber-400" />
                      <h4 className="text-xs font-bold text-amber-200">
                        관계 급랭 위험 감지 ({coolingDownAlerts.length}명)
                      </h4>
                    </div>
                    <span className="text-[10px] text-amber-300">최근 90일+ 소통 공백</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {coolingDownAlerts.slice(0, 3).map(({ person, detail }) => (
                      <div
                        key={person.id}
                        className="p-2.5 rounded-lg bg-slate-900/90 border border-amber-900/60 flex items-center justify-between text-xs"
                      >
                        <div>
                          <p className="font-semibold text-white">{person.name}</p>
                          <p className="text-[10px] text-slate-400">{person.currentCompany} · {detail.daysSinceLastContact}일 경과</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedTarget(person);
                            setActiveTab('path');
                            onShowToast(`${person.name} 님과의 재연결 경로로 이동했습니다.`);
                          }}
                          className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold transition-colors"
                        >
                          재연결
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 검색 및 레벨 필터 */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
                <div className="flex items-center gap-2 w-full sm:w-72 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="인물명, 기업명 검색..."
                    value={heatSearchQuery}
                    onChange={(e) => setHeatSearchQuery(e.target.value)}
                    className="bg-transparent text-white focus:outline-none w-full"
                  />
                </div>

                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                  {(['ALL', 'DIAMOND', 'HOT', 'WARM', 'COOL', 'CHILLY'] as const).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setSelectedHeatLevel(lvl)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                        selectedHeatLevel === lvl
                          ? 'bg-cyan-600 text-white font-bold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                      }`}
                    >
                      {lvl === 'ALL' ? '전체' : TIE_STRENGTH_CONFIG[lvl].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 산업군 결속도 매트릭스 요약 칩 */}
              {industryMatrix.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto py-1">
                  <span className="text-[11px] text-slate-400 shrink-0">산업군 분포:</span>
                  {industryMatrix.slice(0, 5).map(row => (
                    <span key={row.domain} className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 shrink-0">
                      {row.domain} ({row.total}명 · 평균 {Math.round(row.avgScore)}점)
                    </span>
                  ))}
                </div>
              )}

              {/* 결속도 리스트 그리드 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredHeatmapPeople.slice(0, 12).map(({ person, detail }) => {
                  const cfg = TIE_STRENGTH_CONFIG[detail.level];
                  return (
                    <div
                      key={person.id}
                      className="p-3.5 rounded-xl bg-slate-800/30 border border-slate-700/60 hover:border-slate-600 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white">{person.name}</p>
                          <p className="text-[11px] text-slate-400">{person.currentCompany} · {person.currentTitle || '임직원'}</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${cfg.badgeBg} ${cfg.badgeText}`}>
                          {cfg.label} ({detail.closenessScore}점)
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                        <span>최근 소통: {person.lastContactDate || '미기록'}</span>
                        <button
                          onClick={() => {
                            setSelectedTarget(person);
                            setActiveTab('path');
                          }}
                          className="text-cyan-400 hover:underline flex items-center gap-0.5 text-[10px]"
                        >
                          소개 연계 <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 4: 파트너십 연계 & 추천 감사 리워드 */}
          {activeTab === 'gratitude' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-800/50 p-1.5 rounded-xl border border-slate-700/60">
                <div className="flex gap-1">
                  <button
                    onClick={() => setGratitudeSubTab('list')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      gratitudeSubTab === 'list'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    정산 대시보드 ({settlements.length}건)
                  </button>
                  <button
                    onClick={() => setGratitudeSubTab('create')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      gratitudeSubTab === 'create'
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    + 신규 추천 감사 등록
                  </button>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline px-2">
                  비즈니스 딜 파이프라인 실시간 연동
                </span>
              </div>

              {gratitudeSubTab === 'list' ? (
                <div className="space-y-3">
                  {settlements.map((s) => {
                    const thankYouText = generateThankYouLetter(s);
                    return (
                      <div
                        key={s.id}
                        className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/70 hover:border-cyan-500/50 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">
                              {s.dealTitle}
                            </span>
                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                              s.status === 'COMPLETED'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}>
                              {s.status === 'COMPLETED' ? '정산 완료' : '준비 중'}
                            </span>
                          </div>
                          <p className="text-xs font-bold text-white">
                            추천인: {s.referrerName} ({s.referrerCompany} {s.referrerTitle || ''})
                          </p>
                          <p className="text-[11px] text-slate-400">
                            답례 내용: {s.rewardValue} ({s.rewardType}) · 예정일: {s.plannedDate}
                          </p>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(thankYouText, s.id, '감사 서신이 복사되었습니다.')}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1 border border-slate-700 transition-colors"
                          >
                            {copiedKey === s.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                            감사 서신 복사
                          </button>

                          {s.status !== 'COMPLETED' ? (
                            <button
                              onClick={() => handleUpdateStatus(s.id, 'COMPLETED')}
                              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 transition-colors"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              정산 완료 처리
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(s.id, 'PLANNED')}
                              className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-400 text-xs font-semibold hover:bg-slate-700"
                            >
                              재조율
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                /* 신규 등록 폼 */
                <div className="bg-slate-800/40 p-5 rounded-xl border border-slate-700/60 space-y-4 max-w-2xl mx-auto">
                  <h4 className="text-xs font-bold text-white flex items-center gap-2">
                    <HeartHandshake className="w-4 h-4 text-cyan-400" />
                    성사된 프로젝트 딜에 대한 추천 감사 등록
                  </h4>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-300 font-semibold block mb-1">관련 비즈니스 딜</label>
                      <select
                        value={selectedDealId}
                        onChange={(e) => setSelectedDealId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        {deals.map(d => (
                          <option key={d.id} value={d.id}>{d.title} ({d.targetCompany} · {d.dealSize || '규모 협의'})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-semibold block mb-1">소개/추천해 준 소중한 인연</label>
                      <select
                        value={selectedReferrerId}
                        onChange={(e) => setSelectedReferrerId(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white"
                      >
                        {candidateReferrers.map(p => (
                          <option key={p.id} value={p.id}>⭐️ 추천 후보: {p.name} ({p.currentCompany})</option>
                        ))}
                        {people.map(p => (
                          <option key={p.id} value={p.id}>{p.name} ({p.currentCompany})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-semibold block mb-1">답례 리워드 유형</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {(Object.keys(GRATITUDE_REWARD_PRESETS) as GratitudeRewardType[]).map(type => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => {
                              setRewardType(type);
                              setRewardValue(GRATITUDE_REWARD_PRESETS[type].defaultValue);
                            }}
                            className={`p-2 rounded-xl border text-xs font-semibold text-center transition-all ${
                              rewardType === type
                                ? 'bg-cyan-600 text-white border-cyan-400'
                                : 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800'
                            }`}
                          >
                            {GRATITUDE_REWARD_PRESETS[type].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 font-semibold block mb-1">감사 메모 / 특별 요청</label>
                      <input
                        type="text"
                        value={customNotes}
                        onChange={(e) => setCustomNotes(e.target.value)}
                        placeholder="예: 프로젝트 자문 및 계약 체결 결정적 기여에 대한 감사"
                        className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <button
                      onClick={handleCreateSettlement}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/30 transition-all"
                    >
                      추천 감사 리워드 확정 및 등록
                    </button>
                  </div>
                </div>
              )}
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
