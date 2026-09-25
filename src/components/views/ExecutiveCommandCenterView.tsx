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
  ShieldCheck, Check, Sparkles, Building2
} from 'lucide-react';

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
최근 소식도 나누고 안부도 전하고 싶습니다. 편하실 때 말씀해 주세요! ☕`;

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
요즘 어떻게 지내시는지 궁금하여 안부 여쭙니다. 편하실 때 식사나 커피 한 잔 모시겠습니다! ☕`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedKey(`cadence-${person.id}`);
      onShowToast(`[${person.name}] 님께 보낼 안부 문구가 복사되었습니다.`);
      setTimeout(() => setCopiedKey(null), 2500);
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* 1. Hero Morning Briefing Header - Apple Spatial Glass with Specular Edge */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900/90 via-indigo-950/50 to-slate-900/90 border border-slate-700/60 p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/10 backdrop-blur-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></span>
              </span>
              <span className="text-xs font-bold text-indigo-300 tracking-wider uppercase font-mono">
                Executive Morning Briefing
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]">
                AI Ready
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">
              오늘의 비즈니스 경영 사령탑
            </h1>
            <p className="text-xs md:text-sm text-slate-300 max-w-2xl leading-relaxed">
              대표님, 오늘 가장 높은 성약 확률을 가진 딜과 외근지 인맥 접점, 그리고 즉시 챙겨야 할 C-Level 영전 축하를 엄선했습니다.
            </p>
          </div>

          {/* Quick Action Matrix */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => onNavigateView('deals')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_4px_14px_rgba(79,70,229,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] border-t border-white/20 ring-1 ring-white/10 transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <Briefcase className="w-4 h-4 text-amber-300" />
              <span>전략 딜 워룸 열기</span>
            </button>
            <button
              onClick={() => onNavigateView('audit')}
              className="px-4 py-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-800 text-slate-200 font-bold text-xs border border-slate-700/80 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-white/5 transition-all active:scale-[0.98] flex items-center gap-2"
            >
              <span>20대 대기업 네트워크 커버리지</span>
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Today's 4 Prime Action Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        
        {/* Card 1: 현장 외근 레이더 */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md p-5 flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-sky-600 dark:text-sky-400">
                <Compass className="w-4 h-4" />
                <span>오늘의 현장 레이더</span>
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-sky-50 dark:bg-sky-950/80 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/80 font-mono">
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

            {/* Nearby Contacts - Soft Debossed Trays */}
            <div className="space-y-2 pt-1">
              {nearbyPeople.map(p => (
                <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 shadow-2xs flex items-center justify-between gap-2 text-xs">
                  <div 
                    onClick={() => onOpenDossier ? onOpenDossier(p) : onSelectPerson(p)}
                    className="min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                    title="임원 상세 도시에 열기"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                      <span>{p.name}</span>
                      <span className="text-sky-600 dark:text-sky-400 text-[11px]">({p.currentTitle})</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{p.currentCompany}</div>
                  </div>
                  <button
                    onClick={() => handleCopyTeaInvite(p)}
                    className="w-8 h-8 rounded-lg bg-sky-50 dark:bg-sky-950/90 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-500/40 hover:bg-sky-100 dark:hover:bg-sky-900/80 shadow-2xs shrink-0 text-xs font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
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
            className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-sky-700 hover:text-sky-900 dark:text-sky-300 dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs border border-slate-200 dark:border-slate-700/60 active:scale-[0.98] cursor-pointer"
          >
            <span>거점 레이더 맵 전체보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 2: 미축하 영전 감지 */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md p-5 flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <Award className="w-4 h-4" />
                <span>DART 영전 조기 감지</span>
              </span>
              {uncelebratedPromos.length > 0 && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/30 font-bold font-mono">
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
                  className="text-sm font-bold text-slate-900 dark:text-white leading-snug cursor-pointer hover:text-amber-600 dark:hover:text-amber-300 transition-colors"
                  title="임원 프로필 열기"
                >
                  {uncelebratedPromos[0].personName} {uncelebratedPromos[0].newTitle}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {uncelebratedPromos[0].companyName} · {uncelebratedPromos[0].promotionType === 'CEO_APPOINTMENT' ? '대표이사 선임' : '임원 영전'}
                </p>

                <div className="mt-3 p-3 rounded-2xl bg-amber-50/60 dark:bg-slate-950/80 border border-amber-200/80 dark:border-slate-800/80 shadow-2xs space-y-2">
                  <div className="text-[11px] text-amber-800 dark:text-amber-300/90 font-medium">
                    "취임을 진심으로 축하드리며 더 큰 도약을 기원합니다."
                  </div>
                  <button
                    onClick={() => handleCopyCongratulation(uncelebratedPromos[0])}
                    className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-[0.98] cursor-pointer"
                  >
                    {copiedKey === `promo-${uncelebratedPromos[0].id}` ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>축전 복사 및 완료 처리됨!</span>
                      </>
                    ) : (
                      <>
                        <Gift className="w-3.5 h-3.5" />
                        <span>🌺 1-Click 화환 리본 &amp; 축전 복사</span>
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
            className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs border border-slate-200 dark:border-slate-700/60 active:scale-[0.98] cursor-pointer"
          >
            <span>영전·케어 피드 전체보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 3: 소통 골든타임 넛지 */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md p-5 flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <Clock className="w-4 h-4" />
                <span>소통 골든타임 넛지</span>
              </span>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/80 font-mono">
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

            {/* Top Cadence Alerts - Soft Debossed Trays */}
            <div className="space-y-2 pt-1">
              {topCadenceAlerts.map(alert => (
                <div key={alert.person.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 shadow-2xs flex items-center justify-between gap-2 text-xs">
                  <div 
                    onClick={() => onOpenDossier ? onOpenDossier(alert.person) : onSelectPerson(alert.person)}
                    className="min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
                    title="임원 프로필 열기"
                  >
                    <div className="font-bold text-slate-800 dark:text-slate-200 truncate flex items-center gap-1">
                      <span>{alert.person.name}</span>
                      <span className="text-rose-600 dark:text-rose-400 text-[11px] font-mono">({alert.daysSinceLastContact}일)</span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate">{alert.person.currentCompany}</div>
                  </div>
                  <button
                    onClick={() => handleCopyCadencePing(alert.person, alert.daysSinceLastContact)}
                    className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950/90 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-500/40 hover:bg-rose-100 dark:hover:bg-rose-900/80 shadow-2xs shrink-0 text-xs font-bold flex items-center justify-center transition-all active:scale-95 cursor-pointer"
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
            className="w-full py-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-700/80 text-rose-700 hover:text-rose-900 dark:text-rose-300 dark:hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-2xs border border-slate-200 dark:border-slate-700/60 active:scale-[0.98] cursor-pointer"
          >
            <span>소통 주기 관리 큐 전체보기</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card 4: 포커스 딜 인맥 연결 건전도 */}
        <div className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md p-5 flex flex-col justify-between space-y-4 transition-all duration-300 hover:-translate-y-0.5">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <Briefcase className="w-4 h-4" />
                <span>최우선 비즈니스 딜</span>
              </span>
              {activeFocusDeal && (
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/80 font-mono">
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
                  <div className="text-xs text-indigo-300 font-semibold mt-1">
                    {activeFocusDeal.targetCompany} · {activeFocusDeal.dealSize}
                  </div>
                </div>

                {/* Health Progress Bar - Debossed Slot */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>인맥 연결 건전도</span>
                    <span className="font-mono text-emerald-400 font-bold">{activeFocusDeal.healthScore}%</span>
                  </div>
                  <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden p-0.5 shadow-[inset_0_1px_3px_rgba(0,0,0,0.7)] border border-slate-800/60">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.5)]"
                      style={{ width: `${activeFocusDeal.healthScore}%` }}
                    />
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] text-[11px] text-slate-300 flex items-center justify-between">
                  <span>매핑된 키맨: <strong>{activeFocusDeal.stakeholders.length}명</strong></span>
                  {activeFocusDeal.stakeholders.length > 0 && onOpenBridgeModal ? (
                    <button
                      onClick={() => {
                        const keyman = people.find(p => p.id === activeFocusDeal.stakeholders[0].personId);
                        if (keyman) onOpenBridgeModal(keyman);
                      }}
                      className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold active:scale-95"
                    >
                      🤝 브릿지 연결
                    </button>
                  ) : (
                    <span className="text-slate-500">목표일: {activeFocusDeal.expectedCloseDate}</span>
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
            className="w-full py-2.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-emerald-300 hover:text-white text-xs font-bold transition-all flex items-center justify-center gap-1 shadow-[0_2px_6px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.08)] border border-slate-700/60 ring-1 ring-white/5 active:scale-[0.98]"
          >
            <span>전략 딜 파이프라인 관리</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* 3. Bottom Row: Super Connectors & Fast Discovery - Neo-Tactile */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Super Connectors Spotlight */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-[0_10px_25px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/5 space-y-3 backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>알파 슈퍼 커넥터 TOP 3</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-mono">Centrality Metric</span>
          </div>

          <div className="space-y-2">
            {topConnectors.map(({ person, powerScore, tier }) => (
              <div
                key={person.id}
                onClick={() => onOpenDossier ? onOpenDossier(person) : onSelectPerson(person)}
                className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] hover:border-indigo-500/50 cursor-pointer transition-all flex items-center justify-between group active:scale-[0.98]"
              >
                <div className="min-w-0">
                  <div className="font-bold text-white text-xs group-hover:text-indigo-300 transition-colors flex items-center gap-1">
                    <span>{person.name}</span>
                    <span className="text-slate-400 text-[11px]">({person.currentTitle})</span>
                    {person.sourceType === 'DART_FACT' && (
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{person.currentCompany}</div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-xs font-bold text-amber-400 font-mono">
                    ⚡ {powerScore}점
                  </div>
                  <div className="text-[11px] text-slate-500">
                    {tier === 'ALPHA_HUB' ? '👑 알파 허브' : '핵심 커넥터'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Corporate Penetration Blind Spot Radar */}
        <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800/80 shadow-[0_10px_25px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/5 lg:col-span-2 flex flex-col justify-between space-y-4 backdrop-blur-xl">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-indigo-400" />
                <span>20대 대기업 사각지대(Blind Spot) 즉시 돌파 파이프라인</span>
              </h3>
              <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-rose-950/80 text-rose-300 border border-rose-800/80 font-mono font-bold shadow-[inset_0_1px_2px_rgba(0,0,0,0.4)]">
                D등급 집중 관리
              </span>
            </div>
            <p className="text-xs text-slate-400">
              접점이 없는 핵심 대기업에 대해 알럼나이 1촌을 레버리지하여 2촌 최단 소개 루트를 원클릭으로 가동합니다.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="text-xs font-bold text-slate-200">
                현대자동차 &amp; SK하이닉스 C-Level 신뢰 브릿지 제안
              </div>
              <div className="text-[11px] text-slate-400">
                내 알럼나이 1촌 4명이 해당 기업 2촌 임원진과 연결되어 있습니다.
              </div>
            </div>

            <button
              onClick={() => onNavigateView('audit')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 text-white font-bold text-xs shadow-[0_4px_14px_rgba(79,70,229,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] border-t border-white/20 ring-1 ring-white/10 transition-all shrink-0 flex items-center gap-1.5 active:scale-[0.98]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>사각지대 진단실 열기</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
