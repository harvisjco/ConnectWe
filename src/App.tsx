import React, { useState, useEffect } from 'react';
import { Person, GraphQueryResult } from './types/network';
import { loadPeopleFromStorage, savePeopleToStorage } from './services/storageService';
import { executeGraphRagQuery } from './services/graphRagEngine';
import { resolveAndMergePeople } from './services/entityResolver';
import { identifyTalentCluster } from './services/talentClusterEngine';
import { 
  CalendarMeeting, 
  loadMeetingsFromStorage, 
  getImminentMeeting 
} from './services/calendarRadarService';

import { Header } from './components/common/Header';
import { SidebarLNB, NavViewType } from './components/common/SidebarLNB';
import { MobileBottomBar } from './components/common/MobileBottomBar';
import { MeetingRadarBanner } from './components/radar/MeetingRadarBanner';
import { GraphSearchBar } from './components/search/GraphSearchBar';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ViewLoadingSkeleton } from './components/common/ViewLoadingSkeleton';

// 11대 멀티 디멘션 뷰 비동기 코드 스플리팅 (Code Splitting via React.lazy)
const CompanyAlumniView = React.lazy(() => import('./components/views/CompanyAlumniView').then(m => ({ default: m.CompanyAlumniView })));
const CorporateOrgChartView = React.lazy(() => import('./components/views/CorporateOrgChartView').then(m => ({ default: m.CorporateOrgChartView })));
const TeamNetworkView = React.lazy(() => import('./components/views/TeamNetworkView').then(m => ({ default: m.TeamNetworkView })));
const ReferralBountyView = React.lazy(() => import('./components/views/ReferralBountyView').then(m => ({ default: m.ReferralBountyView })));
const DealPipelineView = React.lazy(() => import('./components/views/DealPipelineView').then(m => ({ default: m.DealPipelineView })));
const GeoProximityRadarView = React.lazy(() => import('./components/views/GeoProximityRadarView').then(m => ({ default: m.GeoProximityRadarView })));
const PromotionCadenceView = React.lazy(() => import('./components/views/PromotionCadenceView').then(m => ({ default: m.PromotionCadenceView })));
const NetworkAuditReportView = React.lazy(() => import('./components/views/NetworkAuditReportView').then(m => ({ default: m.NetworkAuditReportView })));
const AgeSpectrumView = React.lazy(() => import('./components/views/AgeSpectrumView').then(m => ({ default: m.AgeSpectrumView })));
const NetworkCanvasView = React.lazy(() => import('./components/views/NetworkCanvasView').then(m => ({ default: m.NetworkCanvasView })));
const InteractionTimelineView = React.lazy(() => import('./components/views/InteractionTimelineView').then(m => ({ default: m.InteractionTimelineView })));
const CosmicGalaxy3DView = React.lazy(() => import('./components/views/CosmicGalaxy3DView').then(m => ({ default: m.CosmicGalaxy3DView })));
const ExecutiveCommandCenterView = React.lazy(() => import('./components/views/ExecutiveCommandCenterView').then(m => ({ default: m.ExecutiveCommandCenterView })));
import { PersonInspectorModal } from './components/inspector/PersonInspectorModal';
import { ExecutiveDossierModal } from './components/inspector/ExecutiveDossierModal';
import { RelationshipCopilotDrawer } from './components/copilot/RelationshipCopilotDrawer';
import { ImportDataModal } from './components/import/ImportDataModal';
import { AddPersonModal } from './components/crm/AddPersonModal';
import { DailyDigestModal } from './components/digest/DailyDigestModal';
import { DisclosureAlertModal } from './components/digest/DisclosureAlertModal';
import { DegreesOfSeparationModal } from './components/network/DegreesOfSeparationModal';
import { NetworkDashboard } from './components/dashboard/NetworkDashboard';
import { EncryptionSetupModal } from './components/security/EncryptionSetupModal';
import { UserSettingsModal } from './components/settings/UserSettingsModal';
import { CloudSyncModal } from './components/settings/CloudSyncModal';
import { CardScannerModal } from './components/ocr/CardScannerModal';
import { CalendarImportModal } from './components/radar/CalendarImportModal';
import { MeetingDebriefModal } from './components/radar/MeetingDebriefModal';
import { FollowUpComposerModal } from './components/radar/FollowUpComposerModal';
import { DebriefResult } from './services/meetingDebriefService';

import { CheckCircle2, Zap, Users, Building2, Briefcase, Compass, Award, Share2 } from 'lucide-react';

const quickNavTabs: { id: NavViewType; label: string; icon: any }[] = [
  { id: 'command', label: '사령탑', icon: Zap },
  { id: 'company', label: '소중한 인연', icon: Users },
  { id: 'orgchart', label: '기업 조직도', icon: Building2 },
  { id: 'deals', label: '전략 딜', icon: Briefcase },
  { id: 'proximity', label: '외근 레이더', icon: Compass },
  { id: 'promotion', label: '영전·승진', icon: Award },
];

export const App: React.FC = () => {
  // 로컬 스토리지 기반 오프라인 퍼스트 상태
  const [people, setPeople] = useState<Person[]>(() => loadPeopleFromStorage());
  const [activeView, setActiveView] = useState<NavViewType>('command');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

  // LNB 사이드바 상태
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('connectwe_sidebar_collapsed') === 'true';
  });
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // 뷰 변경 핸들러
  const handleSelectView = (view: NavViewType) => {
    setActiveView(view);
  };

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('connectwe_sidebar_collapsed', String(next));
      return next;
    });
  };

  // 실시간 미팅 레이더 캘린더 상태
  const [meetings, setMeetings] = useState<CalendarMeeting[]>(() => loadMeetingsFromStorage(people));
  const [isCardScannerOpen, setIsCardScannerOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isDisclosureAlertOpen, setIsDisclosureAlertOpen] = useState(false);

  // 미팅 직후 회고 및 24h 팔로업 상태
  const [debriefTargetPerson, setDebriefTargetPerson] = useState<Person | null>(null);
  const [followUpTargetPerson, setFollowUpTargetPerson] = useState<Person | null>(null);
  const [debriefResultForFollowUp, setDebriefResultForFollowUp] = useState<DebriefResult | undefined>(undefined);

  // Search & GraphRAG State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResult, setSearchResult] = useState<GraphQueryResult | null>(null);
  const [selectedClusterId, setSelectedClusterId] = useState<string | null>(null);

  // Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDigestModalOpen, setIsDigestModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);
  const [isEncryptionModalOpen, setIsEncryptionModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isCloudSyncOpen, setIsCloudSyncOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [bridgeTargetPerson, setBridgeTargetPerson] = useState<Person | null>(null);
  const [dossierTargetPerson, setDossierTargetPerson] = useState<Person | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // people 상태 변경 시 자동 영속화
  useEffect(() => {
    savePeopleToStorage(people);
  }, [people]);

  // Toast 헬퍼
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // GraphRAG 질의 실행
  const handleExecuteSearch = (q: string) => {
    const res = executeGraphRagQuery(q, people);
    setSearchResult(res);
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setSearchResult(null);
    setSelectedClusterId(null);
  };

  // 신규 데이터 수집 및 병합(Entity Resolution)
  const handleImportSuccess = (incoming: Person[]) => {
    const merged = resolveAndMergePeople(people, incoming);
    setPeople(merged);
    showToast(`성공적으로 ${incoming.length}명의 인맥 노드가 지식 허브에 병합되었습니다.`);
  };

  // 신규 인맥 수동 등록
  const handleSaveNewPerson = (newPerson: Person) => {
    setPeople(prev => [newPerson, ...prev]);
    setSelectedPerson(newPerson);
    showToast(`[${newPerson.name}] 님이 인맥 허브에 새로 등록되었습니다.`);
  };

  // 인맥 정보 업데이트 (메모, DART 팩트 승격, 소통 이력 갱신 등)
  const handleUpdatePerson = (updated: Person) => {
    setPeople(prev => prev.map(p => p.id === updated.id ? updated : p));
    setSelectedPerson(updated);
  };

  // 인맥 삭제
  const handleDeletePerson = (personId: string) => {
    setPeople(prev => prev.filter(p => p.id !== personId));
    if (selectedPerson && selectedPerson.id === personId) {
      setSelectedPerson(null);
    }
    showToast('인맥 정보가 안전하게 삭제되었습니다.');
  };

  // 뷰 네비게이션 헬퍼
  const handleNavigateView = (viewKey: string) => {
    setActiveView(viewKey as any);
  };

  // 현재 표출 대상 인물 (검색 결과 및 5대 클러스터 퀵 필터 복합 적용)
  const basePeople = searchResult ? searchResult.matchedPeople : people;
  const displayPeople = selectedClusterId
    ? basePeople.filter(p => identifyTalentCluster(p).id === selectedClusterId)
    : basePeople;
  const highlightNodeIds = searchResult ? searchResult.highlightNodeIds : [];
  const mePerson = people.find(p => p.closeness === 1);
  const imminentMeeting = getImminentMeeting(meetings);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-600 selection:text-white bg-[#f8fafc] text-slate-800">
      {/* Real-time Meeting Radar Banner */}
      <MeetingRadarBanner
        imminentMeeting={imminentMeeting}
        onOpenDossier={(target) => setDossierTargetPerson(target)}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        onOpenDebrief={(target) => setDebriefTargetPerson(target)}
      />

      {/* Top Header */}
      <Header
        people={people}
        onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenDigestModal={() => setIsDigestModalOpen(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenEncryptionModal={() => setIsEncryptionModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenCloudSyncModal={() => setIsCloudSyncOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenCardScanner={() => setIsCardScannerOpen(true)}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        onOpenDisclosureAlertModal={() => setIsDisclosureAlertOpen(true)}
        onUpdatePeople={setPeople}
        onShowToast={showToast}
      />

      {/* 2-Column Responsive Body Layout with Floating LNB */}
      <div className="flex-1 max-w-[1600px] w-full mx-auto px-2 sm:px-4 md:px-6 py-4 flex gap-4 md:gap-6 items-start">
        {/* Left Floating LNB Sidebar */}
        <SidebarLNB
          activeView={activeView}
          onSelectView={handleSelectView}
          people={people}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={handleToggleSidebarCollapse}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          onOpenCopilot={() => setIsCopilotOpen(true)}
        />

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 pb-28 space-y-4 w-full max-w-full">
          {/* Quick SubNav Pills (GoodPartner Capsule Style - Desktop only, Mobile uses BottomBar) */}
          <div className="hidden sm:flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none w-full">
            {quickNavTabs.map((tab) => {
              const TabIcon = tab.icon;
              const isActive = activeView === tab.id;
              return (
                <button
                  key={tab.id}
                  data-testid={`tab-${tab.id}`}
                  onClick={() => handleNavigateView(tab.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all active:scale-95 whitespace-nowrap cursor-pointer shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/90 shadow-2xs'
                  }`}
                >
                  <TabIcon className={`w-3.5 h-3.5 ${isActive ? 'text-amber-300' : 'text-slate-400'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Main White Canvas Board Card (GoodPartner Large Round Card Style) */}
          <div className="rounded-2xl bg-white border border-slate-200/90 shadow-sm p-3.5 sm:p-6 space-y-6 w-full max-w-full overflow-hidden">
            {/* Reference GoodPartner Style Info Banner */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/60 border border-indigo-150/90 text-xs w-full overflow-hidden gap-2">
              <div className="flex items-center gap-2.5 min-w-0 flex-1 truncate">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Share2 className="w-3.5 h-3.5" />
                </div>
                <div className="text-slate-700 truncate">
                  <span className="font-bold text-slate-900 truncate">ConnectWe 인텔리전스</span>
                  <span className="hidden sm:inline-block ml-2 text-[11px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                    로컬 E2EE 보안 가동 중
                  </span>
                  <span className="hidden lg:inline ml-2 text-slate-500 text-[11px]">
                    DART 8,500+ 기업 실공시 &amp; 주소록 인맥 실시간 교차 매칭
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsDisclosureAlertOpen(true)}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 font-semibold text-[11px] border border-slate-200/90 shadow-2xs transition-all cursor-pointer whitespace-nowrap shrink-0 active:scale-95"
              >
                <span>공시 레이더 확인</span>
              </button>
            </div>

            {/* GraphRAG Search Interface */}
            <section>
              <GraphSearchBar
                query={searchQuery}
                onQueryChange={setSearchQuery}
                onExecuteSearch={handleExecuteSearch}
                onResetSearch={handleResetSearch}
                searchResult={searchResult}
                selectedClusterId={selectedClusterId}
                onSelectCluster={setSelectedClusterId}
              />
            </section>

            {/* Dynamic Multi-dimensional Views with Code Splitting & Error Isolation */}
            <section className="animate-in fade-in duration-200 min-h-[520px]">
          <ErrorBoundary fallbackTitle="선택된 뷰 컴포넌트 런타임 오류 방어">
            <React.Suspense fallback={<ViewLoadingSkeleton />}>
              {activeView === 'command' && (
                <ExecutiveCommandCenterView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onOpenDossier={(target) => setDossierTargetPerson(target)}
                  onOpenBridgeModal={(target) => setBridgeTargetPerson(target)}
                  onShowToast={showToast}
                  onNavigateView={handleNavigateView}
                />
              )}

              {activeView === 'company' && (
                <CompanyAlumniView
                  people={displayPeople}
                  onSelectPerson={setSelectedPerson}
                />
              )}

              {activeView === 'orgchart' && (
                <CorporateOrgChartView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onOpenWarmIntro={(target) => setBridgeTargetPerson(target)}
                  onOpenDossier={(target) => setDossierTargetPerson(target)}
                  onOpenReferralReward={(corpName) => {
                    handleNavigateView('referral');
                    showToast(`[${corpName}] 연계 채용 오픈 포지션 및 추천 리워드 탐색으로 전환되었습니다.`);
                  }}
                />
              )}

              {activeView === 'age' && (
                <AgeSpectrumView
                  people={displayPeople}
                  onSelectPerson={setSelectedPerson}
                />
              )}

              {activeView === 'canvas' && (
                <NetworkCanvasView
                  people={displayPeople}
                  highlightNodeIds={highlightNodeIds}
                  onSelectPerson={setSelectedPerson}
                />
              )}

              {activeView === 'galaxy' && (
                <CosmicGalaxy3DView
                  people={displayPeople}
                  onSelectPerson={setSelectedPerson}
                />
              )}

              {activeView === 'timeline' && (
                <InteractionTimelineView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onOpenDossier={(target) => setDossierTargetPerson(target)}
                  onShowToast={showToast}
                />
              )}

              {activeView === 'team' && (
                <TeamNetworkView
                  people={people}
                  onShowToast={showToast}
                />
              )}

              {activeView === 'referral' && (
                <ReferralBountyView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onShowToast={showToast}
                />
              )}

              {activeView === 'deals' && (
                <DealPipelineView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onOpenDossier={(target) => setDossierTargetPerson(target)}
                  onOpenBridgeModal={(target) => setBridgeTargetPerson(target)}
                  onShowToast={showToast}
                />
              )}

              {activeView === 'proximity' && (
                <GeoProximityRadarView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onShowToast={showToast}
                />
              )}

              {activeView === 'promotion' && (
                <PromotionCadenceView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onOpenDossier={(target) => setDossierTargetPerson(target)}
                  onShowToast={showToast}
                />
              )}

              {activeView === 'audit' && (
                <NetworkAuditReportView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onOpenDossier={(target) => setDossierTargetPerson(target)}
                  onOpenBridgeModal={(target) => setBridgeTargetPerson(target)}
                  onShowToast={showToast}
                />
              )}
            </React.Suspense>
          </ErrorBoundary>
        </section>
          </div>
        </main>
      </div>

      {/* Apple-styled Centered Dim Inspector Modal */}
      <PersonInspectorModal
        person={selectedPerson}
        allPeople={people}
        onClose={() => setSelectedPerson(null)}
        onUpdatePerson={handleUpdatePerson}
        onDeletePerson={handleDeletePerson}
        onOpenBridgeModal={(target) => setBridgeTargetPerson(target)}
        onOpenDossier={(target) => setDossierTargetPerson(target)}
        onOpenDebrief={(target) => setDebriefTargetPerson(target)}
        onOpenFollowUp={(target) => {
          setFollowUpTargetPerson(target);
          setDebriefResultForFollowUp(undefined);
        }}
      />

      {/* Multi-source Ingestion Modal */}
      {isImportModalOpen && (
        <ImportDataModal
          onClose={() => setIsImportModalOpen(false)}
          onImportSuccess={handleImportSuccess}
        />
      )}

      {/* Add Person CRM Modal */}
      {isAddModalOpen && (
        <AddPersonModal
          onClose={() => setIsAddModalOpen(false)}
          onSave={handleSaveNewPerson}
        />
      )}

      {/* Daily Intelligence Digest Modal */}
      {isDigestModalOpen && (
        <DailyDigestModal
          people={people}
          onClose={() => setIsDigestModalOpen(false)}
          onSelectPerson={setSelectedPerson}
          onShowToast={showToast}
        />
      )}

      {/* 2nd-Degree Separation Bridge Modal */}
      {bridgeTargetPerson && (
        <DegreesOfSeparationModal
          targetPerson={bridgeTargetPerson}
          people={people}
          onClose={() => setBridgeTargetPerson(null)}
          onSelectPerson={setSelectedPerson}
          onShowToast={showToast}
        />
      )}

      {/* Network Intelligence Dashboard */}
      {isDashboardOpen && (
        <NetworkDashboard
          people={people}
          onClose={() => setIsDashboardOpen(false)}
          onSelectPerson={setSelectedPerson}
        />
      )}

      {/* Encryption Setup Modal */}
      {isEncryptionModalOpen && (
        <EncryptionSetupModal
          onClose={() => setIsEncryptionModalOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* User & DART Settings Modal */}
      {isSettingsModalOpen && (
        <UserSettingsModal
          mePerson={mePerson}
          onUpdateMe={handleUpdatePerson}
          onClose={() => setIsSettingsModalOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* 1-Page Executive Dossier Meeting Strategy Modal */}
      {dossierTargetPerson && (
        <ExecutiveDossierModal
          person={dossierTargetPerson}
          people={people}
          onClose={() => setDossierTargetPerson(null)}
          onShowToast={showToast}
        />
      )}

      {/* E2EE Cloud Sync Modal */}
      {isCloudSyncOpen && (
        <CloudSyncModal
          people={people}
          onUpdatePeople={setPeople}
          onClose={() => setIsCloudSyncOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Card Scanner Modal (1초 명함 OCR & DART 결합) */}
      {isCardScannerOpen && (
        <CardScannerModal
          onSavePerson={(p: Person) => {
            setPeople(prev => [p, ...prev]);
            setSelectedPerson(p);
          }}
          onClose={() => setIsCardScannerOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* DART Corporate Disclosure Alert Modal */}
      {isDisclosureAlertOpen && (
        <DisclosureAlertModal
          people={people}
          onClose={() => setIsDisclosureAlertOpen(false)}
          onSelectPerson={setSelectedPerson}
          onShowToast={showToast}
        />
      )}

      {/* Calendar Import & Radar Modal */}
      {isCalendarModalOpen && (
        <CalendarImportModal
          meetings={meetings}
          people={people}
          onUpdateMeetings={setMeetings}
          onOpenDossier={(target) => setDossierTargetPerson(target)}
          onClose={() => setIsCalendarModalOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Meeting Debrief Modal (1분 음성/텍스트 회고 & AI 액션 아이템 추출) */}
      {debriefTargetPerson && (
        <MeetingDebriefModal
          person={debriefTargetPerson}
          onUpdatePerson={handleUpdatePerson}
          onOpenFollowUpComposer={(p, debrief) => {
            setDebriefTargetPerson(null);
            setFollowUpTargetPerson(p);
            setDebriefResultForFollowUp(debrief);
          }}
          onClose={() => setDebriefTargetPerson(null)}
          onShowToast={showToast}
        />
      )}

      {/* 24-Hour Follow-Up Sequence Composer Modal */}
      {followUpTargetPerson && (
        <FollowUpComposerModal
          person={followUpTargetPerson}
          debrief={debriefResultForFollowUp}
          onClose={() => setFollowUpTargetPerson(null)}
          onShowToast={showToast}
        />
      )}

      {/* Relationship Copilot Drawer */}
      <RelationshipCopilotDrawer
        isOpen={isCopilotOpen}
        people={people}
        onClose={() => setIsCopilotOpen(false)}
        onSelectPerson={setSelectedPerson}
        onShowToast={showToast}
      />

      {/* Floating AI Copilot Trigger Button (GoodPartner Circular Lightning FAB) */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        title="AI 인맥 지능 코파일럿 열기"
        className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-600/35 border border-indigo-400/40 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group cursor-pointer"
      >
        <Zap className="w-5 h-5 text-amber-300 fill-amber-300 group-hover:rotate-12 transition-transform" />
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center border-2 border-white font-mono shadow-xs">
          3
        </span>
        {/* Floating Tooltip Label */}
        <span className="absolute right-14 px-2.5 py-1 rounded-lg bg-slate-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg">
          인맥 코파일럿
        </span>
      </button>

      {/* Mobile C-Level Bottom Floating Navigation Bar */}
      <MobileBottomBar
        currentView={activeView}
        onSelectView={(v) => handleNavigateView(v as NavViewType)}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold shadow-2xl shadow-slate-900/40 border border-slate-700/80 animate-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
