import React, { useState, useMemo } from 'react';
import { Person } from '../../types/network';
import { 
  getGeoClusterBreakdown, 
  GeoClusterId 
} from '../../services/geoProximityService';
import { 
  loadDealsFromStorage, 
  BusinessDeal 
} from '../../services/dealPipelineService';
import { 
  loadPromotionEvents, 
  getCadenceAlerts, 
  generateCongratulationMessages,
  PromotionEvent,
  savePromotionEvents
} from '../../services/promotionRadarService';
import { getTopSuperConnectors } from '../../services/centralityEngine';
import { 
  Compass, Award, Clock, Briefcase, 
  Zap, Coffee, Gift, MessageCircle, ChevronRight, 
  ShieldCheck, Check, Sparkles, Building2, Share2
} from 'lucide-react';
import { ViewHeader } from '../ui';

interface ExecutiveCommandCenterViewProps {
  people: Person[];
  onSelectPerson: (person: Person) => void;
  onOpenDossier?: (person: Person) => void;
  onOpenBridgeModal?: (person: Person) => void;
  onShowToast: (msg: string) => void;
  onNavigateView: (viewKey: string) => void;
}

export const ExecutiveCommandCenterView: React.FC<ExecutiveCommandCenterViewProps> = ({
  people,
  onSelectPerson,
  onOpenDossier,
  onOpenBridgeModal,
  onShowToast,
  onNavigateView,
}) => {
  // 거점 레이더 데이터 (기본 테헤란로)
  const [selectedClusterId] = useState<GeoClusterId>('gangnam_teheran');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 1. 프로모션 이벤트
  const [promotions, setPromotions] = useState<PromotionEvent[]>(() => loadPromotionEvents(people));
  const uncelebratedPromos = useMemo(() => promotions.filter(p => !p.isCongratulated), [promotions]);

  // 2. 딜 파이프라인
  const deals = useMemo<BusinessDeal[]>(() => loadDealsFromStorage(people), [people]);
  const activeFocusDeal = deals[0] || null;

  // 3. 소통 골든타임 이탈 인맥
  const cadenceAlerts = useMemo(() => getCadenceAlerts(people), [people]);
  const topCadenceAlerts = cadenceAlerts.slice(0, 3);

  // 4. 거점 클러스터 매핑
  const clusterData = useMemo(() => getGeoClusterBreakdown(people), [people]);
  const activeCluster = useMemo(() => {
    return clusterData.find(c => c.cluster.id === selectedClusterId) || clusterData[0];
  }, [clusterData, selectedClusterId]);
  const nearbyPeople = activeCluster.people.slice(0, 3);

  // 5. 슈퍼 커넥터 TOP 3
  const topConnectors = useMemo(() => getTopSuperConnectors(people, 3), [people]);

  // 티타임 제안 복사
  const handleCopyTeaInvite = (person: Person) => {
    const text = `안녕하세요 ${person.name} ${person.currentTitle}님! 
오늘 제가 ${activeCluster.cluster.shortName} 쪽에 미팅 일정이 있어 나와있는데, 혹시 오후에 가볍게 15~20분 정도 커피 한 잔 하실 수 있는 여유가 되실까요? 
최근 소식도 나누고 안부도 전하고 싶습니다. 편하실 때 말씀해 주세요!`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(`tea-${person.id}`);
      onShowToast(`[${person.name}] 님께 보낼 티타임 제안 문구가 복사되었습니다.`);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  // 화환/축전 1-Click 복사
  const handleCopyCongratulation = (promo: PromotionEvent) => {
    const messages = generateCongratulationMessages(promo);
    const formalMsg = messages.find(m => m.type === 'FORMAL_LETTER') || messages[0];

    navigator.clipboard.writeText(formalMsg.content).then(() => {
      setCopiedKey(`promo-${promo.id}`);
      onShowToast(`[${promo.personName}] 님 영전 공식 축전이 복사되었습니다.`);
      
      // 축하 완료 처리
      const updated = promotions.map(p => p.id === promo.id ? { ...p, isCongratulated: true } : p);
      setPromotions(updated);
      savePromotionEvents(updated);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  // 안부 핑 복사
  const handleCopyCadencePing = (person: Person, days: number) => {
    const text = `안녕하세요 ${person.name} ${person.currentTitle}님! 
잘 지내고 계신지요? 마지막으로 인사 나눈 지 벌써 ${days}일 가량 지난 것 같습니다. 
요즘 어떻게 지내시는지 궁금하여 안부 여쭙니다. 편하실 때 식사나 커피 한 잔 모시겠습니다!`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(`cadence-${person.id}`);
      onShowToast(`[${person.name}] 님께 보낼 안부 문구가 복사되었습니다.`);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* 1. Standardized Header */}
      <ViewHeader
        icon={Zap}
        title="오늘의 비즈니스 경영 사령탑"
        subtitle="대표님, 오늘 가장 높은 성약 확률을 가진 딜과 외근지 인맥 접점, 그리고 즉시 챙겨야 할 C-Level 영전 축하를 엄선했습니다."
        englishTag="Executive Morning Briefing"
        badge={
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800 text-[11px] font-semibold font-mono">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>AI Ready</span>
          </div>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateView('deals')}
              className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-semibold text-xs shadow-2xs transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>전략 딜 협업 룸 열기</span>
            </button>
            <button
              onClick={() => onNavigateView('audit')}
              className="px-3.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs border border-slate-200/90 dark:border-slate-700 shadow-2xs transition-all active:scale-[0.98] flex items-center gap-1.5 cursor-pointer"
            >
              <span>20대 기업 네트워크 커버리지</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        }
      />

      {/* 2. Today's 4 Prime Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Card 1: 현장 외근 레이더 */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-2xs hover:shadow-xs p-5 flex flex-col justify-between space-y-4 transition-all duration-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                <Compass className="w-4 h-4" />
                <span>오늘의 현장 레이더</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 font-mono">
                {activeCluster.cluster.shortName}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                반경 내 핵심 인맥 {activeCluster.people.length}명 근무 중
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                DART 공시 임원 {activeCluster.dartExecutiveCount}명이 상주하고 있습니다.
              </p>
            </div>

            {/* Nearby Contacts */}
            <div className="space-y-2 pt-1">
              {nearbyPeople.map(p => (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-750 flex items-center justify-between gap-2 text-xs">
                  <div 
                    onClick={() => onOpenDossier ? onOpenDossier(p) : onSelectPerson(p)}
                    className="min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                    title="미팅 준비 1-Page 브리프 열기"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                      <span>{p.name}</span>
                      <span className="text-sky-600 dark:text-sky-400 text-[11px]">({p.currentTitle})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{p.currentCompany}</div>
                  </div>
                  <button
                    onClick={() => handleCopyTeaInvite(p)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 shadow-2xs shrink-0 text-xs font-medium flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                    title="티타임 초대장 복사"
                  >
                    {copiedKey === `tea-${p.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Coffee className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateView('proximity')}
            className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1 border border-slate-200/80 dark:border-slate-700 active:scale-[0.98] cursor-pointer"
          >
            <span>거점 레이더 맵 전체보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: 미축하 영전 감지 */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-2xs hover:shadow-xs p-5 flex flex-col justify-between space-y-4 transition-all duration-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Award className="w-4 h-4" />
                <span>DART 영전 조기 감지</span>
              </span>
              {uncelebratedPromos.length > 0 && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 font-mono font-medium">
                  {uncelebratedPromos.length}건 미축하
                </span>
              )}
            </div>

            {uncelebratedPromos.length > 0 ? (
              <div>
                <h3 
                  onClick={() => {
                    const matched = people.find(p => p.name === uncelebratedPromos[0].personName);
                    if (matched) {
                      onOpenDossier ? onOpenDossier(matched) : onSelectPerson(matched);
                    }
                  }}
                  className="text-sm font-bold text-slate-900 dark:text-white leading-snug cursor-pointer hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors"
                  title="임원 프로필 열기"
                >
                  {uncelebratedPromos[0].personName} {uncelebratedPromos[0].newTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {uncelebratedPromos[0].companyName} · {uncelebratedPromos[0].promotionType === 'CEO_APPOINTMENT' ? '대표이사 선임' : '임원 영전'}
                </p>

                <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 space-y-2">
                  <div className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                    "취임을 진심으로 축하드리며 더 큰 도약을 기원합니다."
                  </div>
                  <button
                    onClick={() => handleCopyCongratulation(uncelebratedPromos[0])}
                    className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer shadow-2xs"
                  >
                    {copiedKey === `promo-${uncelebratedPromos[0].id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>축전 복사 및 완료 처리됨!</span>
                      </>
                    ) : (
                      <>
                        <Gift className="w-3.5 h-3.5" />
                        <span>1-Click 화환 리본 &amp; 축전 복사</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                <Check className="w-6 h-6 mx-auto text-emerald-500" />
                <div className="font-bold text-slate-700 dark:text-slate-300">모든 영전 축하 완료</div>
                <div>새로운 공시가 감지되면 즉시 알려드립니다.</div>
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateView('promotion')}
            className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1 border border-slate-200/80 dark:border-slate-700 active:scale-[0.98] cursor-pointer"
          >
            <span>영전·케어 피드 전체보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: 소통 골든타임 넛지 */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-2xs hover:shadow-xs p-5 flex flex-col justify-between space-y-4 transition-all duration-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <Clock className="w-4 h-4" />
                <span>소통 골든타임 넛지</span>
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 font-mono font-medium">
                {cadenceAlerts.length}명 관리 요망
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                60일 이상 연락 없는 핵심 인맥
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                관계가 느슨해지기 전에 가벼운 안부를 전달하세요.
              </p>
            </div>

            {/* Top Cadence Alerts */}
            <div className="space-y-2 pt-1">
              {topCadenceAlerts.map(alert => (
                <div key={alert.person.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex items-center justify-between gap-2 text-xs">
                  <div 
                    onClick={() => onOpenDossier ? onOpenDossier(alert.person) : onSelectPerson(alert.person)}
                    className="min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                    title="임원 프로필 열기"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                      <span>{alert.person.name}</span>
                      <span className="text-rose-600 dark:text-rose-400 text-[11px] font-mono">({alert.daysSinceLastContact}일)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{alert.person.currentCompany}</div>
                  </div>
                  <button
                    onClick={() => handleCopyCadencePing(alert.person, alert.daysSinceLastContact)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50 shadow-2xs shrink-0 text-xs font-medium flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                    title="안부 핑 복사"
                  >
                    {copiedKey === `cadence-${alert.person.id}` ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <MessageCircle className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => onNavigateView('promotion')}
            className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1 border border-slate-200/80 dark:border-slate-700 active:scale-[0.98] cursor-pointer"
          >
            <span>소통 주기 관리 큐 전체보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: 포커스 딜 인맥 연결 건전도 */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-600 shadow-2xs hover:shadow-xs p-5 flex flex-col justify-between space-y-4 transition-all duration-200">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Briefcase className="w-4 h-4" />
                <span>최우선 비즈니스 딜</span>
              </span>
              {activeFocusDeal && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 font-mono font-medium">
                  건전도 {activeFocusDeal.healthScore}%
                </span>
              )}
            </div>

            {activeFocusDeal ? (
              <div className="space-y-2.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug line-clamp-2">
                    {activeFocusDeal.title}
                  </h3>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                    {activeFocusDeal.targetCompany} · {activeFocusDeal.dealSize}
                  </div>
                </div>

                {/* Health Progress Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>인맥 연결 건전도</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold">{activeFocusDeal.healthScore}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden p-0.5 border border-slate-200/80 dark:border-slate-700">
                    <div 
                      className="h-full bg-indigo-600 rounded-full"
                      style={{ width: `${activeFocusDeal.healthScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>키맨: <strong className="text-slate-800 dark:text-white">{activeFocusDeal.stakeholders.length}명</strong></span>
                  {activeFocusDeal.stakeholders.length > 0 && onOpenBridgeModal ? (
                    <button
                      onClick={() => {
                        const keyman = people.find(p => p.id === activeFocusDeal.stakeholders[0].personId);
                        if (keyman) onOpenBridgeModal(keyman);
                      }}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-semibold flex items-center gap-1 active:scale-95"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>브릿지 연결</span>
                    </button>
                  ) : (
                    <span className="text-slate-400">목표일: {activeFocusDeal.expectedCloseDate}</span>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-500">
                등록된 활성 딜이 없습니다.
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigateView('deals')}
            className="w-full py-2 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center justify-center gap-1 border border-slate-200/80 dark:border-slate-700 active:scale-[0.98] cursor-pointer"
          >
            <span>전략 딜 파이프라인 관리</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 3. Bottom Row: Super Connectors & Fast Discovery */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Super Connectors Spotlight */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>알파 슈퍼 커넥터 TOP 3</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Centrality Metric</span>
          </div>

          <div className="space-y-2">
            {topConnectors.map(({ person, powerScore, tier }) => (
              <div
                key={person.id}
                onClick={() => onOpenDossier ? onOpenDossier(person) : onSelectPerson(person)}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 hover:border-indigo-300 dark:hover:border-indigo-600 cursor-pointer transition-all flex items-center justify-between group active:scale-[0.98]"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900 dark:text-white text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                    <span>{person.name}</span>
                    <span className="text-slate-400 text-[11px]">({person.currentTitle})</span>
                    {person.sourceType === 'DART_FACT' && (
                      <ShieldCheck className="w-3 h-3 text-emerald-500" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{person.currentCompany}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-indigo-600 dark:text-indigo-400 font-mono">
                    {powerScore}점
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {tier === 'ALPHA_HUB' ? '알파 허브' : '핵심 커넥터'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Corporate Partnership Opportunity Radar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-2xs lg:col-span-2 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>주요 20대 기업 파트너십 기회 발굴 파이프라인</span>
              </h3>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-700 font-mono font-medium">
                잠재 파트너사 연계
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              아직 직접 접점이 없는 주요 기업군에 대해 동문·이전 재직 인연을 통해 따뜻한 소개 연결을 제안합니다.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                현대자동차 &amp; SK하이닉스 C-Level 신뢰 브릿지 제안
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                내 알럼나이 1촌 4명이 해당 기업 2촌 임원진과 연결되어 있습니다.
              </div>
            </div>

            <button
              onClick={() => onNavigateView('audit')}
              className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>파트너십 진단 리포트 열기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
