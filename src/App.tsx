import React, { useState, useEffect } from 'react';
import { Person, GraphQueryResult } from './types/network';
import { loadPeopleFromStorage, savePeopleToStorage } from './services/storageService';
import { executeGraphRagQuery } from './services/graphRagEngine';
import { resolveAndMergePeople } from './services/entityResolver';
import { 
  CalendarMeeting, 
  loadMeetingsFromStorage, 
  getImminentMeeting 
} from './services/calendarRadarService';

import { Header } from './components/common/Header';
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
import { PersonInspectorDrawer } from './components/inspector/PersonInspectorDrawer';
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

import { Building2, Calendar, Share2, CheckCircle2, Clock, Sparkles, Orbit, Users, Gift, Briefcase, Compass, Award, PieChart, LayoutDashboard, Globe } from 'lucide-react';

export const App: React.FC = () => {
  // 로컬 스토리지 기반 오프라인 퍼스트 상태
  const [people, setPeople] = useState<Person[]>(() => loadPeopleFromStorage());
  const [activeSegment, setActiveSegment] = useState<'command' | 'explore' | 'business'>('command');
  const [activeView, setActiveView] = useState<'command' | 'company' | 'orgchart' | 'age' | 'canvas' | 'galaxy' | 'timeline' | 'team' | 'referral' | 'deals' | 'proximity' | 'promotion' | 'audit'>('command');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);

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

  // 뷰 네비게이션 및 상위 세그먼트 동기화 헬퍼
  const handleNavigateView = (viewKey: string) => {
    if (viewKey === 'command') {
      setActiveSegment('command');
      setActiveView('command');
    } else if (['company', 'orgchart', 'age', 'canvas', 'galaxy', 'timeline'].includes(viewKey)) {
      setActiveSegment('explore');
      setActiveView(viewKey as any);
    } else {
      setActiveSegment('business');
      setActiveView(viewKey as any);
    }
  };

  // 현재 표출 대상 인물
  const displayPeople = searchResult ? searchResult.matchedPeople : people;
  const highlightNodeIds = searchResult ? searchResult.highlightNodeIds : [];
  const mePerson = people.find(p => p.closeness === 1);
  const imminentMeeting = getImminentMeeting(meetings);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 pb-28 space-y-6">
        
        {/* GraphRAG Search Interface */}
        <section>
          <GraphSearchBar
            query={searchQuery}
            onQueryChange={setSearchQuery}
            onExecuteSearch={handleExecuteSearch}
            onResetSearch={handleResetSearch}
            searchResult={searchResult}
          />
        </section>

        {/* Apple-Style Executive 3-Segment Controller */}
        <section className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Primary 3-Segment Tab Bar - Neo-Tactile CNC Track */}
            <div className="inline-flex p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800/80 shadow-[inset_0_2px_6px_rgba(0,0,0,0.7),0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/5 backdrop-blur-xl overflow-x-auto max-w-full">
              <button
                type="button"
                data-testid="segment-command"
                onClick={() => {
                  setActiveSegment('command');
                  setActiveView('command');
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 active:scale-[0.98] ${
                  activeSegment === 'command'
                    ? 'bg-gradient-to-b from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-[0_2px_10px_rgba(79,70,229,0.4),inset_0_1px_0_rgba(255,255,255,0.35)] border-t border-white/20 ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <LayoutDashboard className="w-4 h-4 text-amber-300 shrink-0" />
                <span className="hidden sm:inline">🚀 오늘의 경영 사령탑</span>
                <span className="sm:hidden">🚀 사령탑</span>
              </button>

              <button
                type="button"
                data-testid="segment-explore"
                onClick={() => {
                  setActiveSegment('explore');
                  if (!['company', 'orgchart', 'age', 'canvas', 'galaxy', 'timeline'].includes(activeView)) {
                    setActiveView('company');
                  }
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 active:scale-[0.98] ${
                  activeSegment === 'explore'
                    ? 'bg-gradient-to-b from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-[0_2px_10px_rgba(79,70,229,0.4),inset_0_1px_0_rgba(255,255,255,0.35)] border-t border-white/20 ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Globe className="w-4 h-4 text-sky-300 shrink-0" />
                <span className="hidden sm:inline">🌐 인맥 맵 탐색</span>
                <span className="sm:hidden">🌐 인맥 맵</span>
              </button>

              <button
                type="button"
                data-testid="segment-business"
                onClick={() => {
                  setActiveSegment('business');
                  if (!['deals', 'proximity', 'promotion', 'audit', 'team', 'referral'].includes(activeView)) {
                    setActiveView('deals');
                  }
                }}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 whitespace-nowrap shrink-0 active:scale-[0.98] ${
                  activeSegment === 'business'
                    ? 'bg-gradient-to-b from-indigo-500 via-indigo-600 to-indigo-700 text-white shadow-[0_2px_10px_rgba(79,70,229,0.4),inset_0_1px_0_rgba(255,255,255,0.35)] border-t border-white/20 ring-1 ring-white/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Briefcase className="w-4 h-4 text-emerald-300 shrink-0" />
                <span className="hidden sm:inline">💼 전략 비즈니스 워룸</span>
                <span className="sm:hidden">💼 비즈니스</span>
              </button>
            </div>

            {/* Status & Scope Indicator */}
            <div className="text-xs text-slate-400 flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {activeSegment === 'command' ? (
                <span>경영 골든타임 & 신뢰 지능 우선순위 브리핑</span>
              ) : displayPeople.length === people.length ? (
                <span>전체 <strong className="text-white font-semibold">{people.length}명</strong> 탐색 중</span>
              ) : (
                <span>검색 필터링 <strong className="text-indigo-400 font-semibold">{displayPeople.length}명</strong> 표출 중</span>
              )}
            </div>
          </div>

          {/* Secondary Sub-navigation Pills for Explore & Business - Neo-Tactile CNC Tracks */}
          {activeSegment === 'explore' && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] overflow-x-auto ring-1 ring-white/5">
              <button
                onClick={() => setActiveView('company')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  activeView === 'company'
                    ? 'bg-slate-800/90 text-indigo-300 border border-indigo-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>🏢 회사·알럼나이</span>
              </button>
              <button
                onClick={() => setActiveView('orgchart')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  activeView === 'orgchart'
                    ? 'bg-slate-800/90 text-amber-300 border border-amber-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                <span>🏛️ DART 기업 조직도</span>
              </button>
              <button
                onClick={() => setActiveView('age')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  activeView === 'age'
                    ? 'bg-slate-800/90 text-indigo-300 border border-indigo-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>🎂 나이대별</span>
              </button>
              <button
                onClick={() => setActiveView('canvas')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  activeView === 'canvas'
                    ? 'bg-slate-800/90 text-indigo-300 border border-indigo-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>🕸️ 2D 인터랙티브 그래프</span>
              </button>
              <button
                onClick={() => setActiveView('galaxy')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  activeView === 'galaxy'
                    ? 'bg-slate-800/90 text-purple-300 border border-purple-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Orbit className="w-3.5 h-3.5 text-purple-400" />
                <span>🪐 3D 은하계</span>
              </button>
              <button
                onClick={() => setActiveView('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  activeView === 'timeline'
                    ? 'bg-slate-800/90 text-emerald-300 border border-emerald-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                <span>📅 소통 타임라인</span>
              </button>
            </div>
          )}

          {activeSegment === 'business' && (
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-950/70 border border-slate-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] overflow-x-auto ring-1 ring-white/5">
              <button
                onClick={() => setActiveView('deals')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  activeView === 'deals'
                    ? 'bg-slate-800/90 text-amber-300 border border-amber-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-400" />
                <span>💼 전략 딜 워룸</span>
              </button>
              <button
                onClick={() => setActiveView('proximity')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  activeView === 'proximity'
                    ? 'bg-slate-800/90 text-sky-300 border border-sky-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>🗺️ 거점별 레이더</span>
              </button>
              <button
                onClick={() => setActiveView('promotion')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  activeView === 'promotion'
                    ? 'bg-slate-800/90 text-amber-300 border border-amber-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>🎉 영전·케어 골든타임</span>
              </button>
              <button
                onClick={() => setActiveView('audit')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  activeView === 'audit'
                    ? 'bg-slate-800/90 text-indigo-300 border border-indigo-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <PieChart className="w-3.5 h-3.5 text-indigo-400" />
                <span>📊 인맥 자산 진단</span>
              </button>
              <button
                onClick={() => setActiveView('team')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  activeView === 'team'
                    ? 'bg-slate-800/90 text-sky-300 border border-sky-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-sky-400" />
                <span>👥 팀 인맥</span>
              </button>
              <button
                onClick={() => setActiveView('referral')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap shrink-0 active:scale-95 ${
                  activeView === 'referral'
                    ? 'bg-slate-800/90 text-emerald-300 border border-emerald-500/40 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/5'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Gift className="w-3.5 h-3.5 text-emerald-400" />
                <span>🎁 바운티 탐색</span>
              </button>
            </div>
          )}
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
                  onOpenTargetBounty={(corpName) => {
                    handleNavigateView('referral');
                    showToast(`🎯 [${corpName}] 연계 채용 오픈 포지션 및 바운티 탐색으로 전환되었습니다.`);
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

      </main>

      {/* Apple-styled Deep Inspector Drawer */}
      <PersonInspectorDrawer
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

      {/* Floating AI Copilot Trigger Button (우측 하단) */}
      <button
        onClick={() => setIsCopilotOpen(true)}
        title="AI 인맥 지능 코파일럿 열기"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:scale-105 active:scale-95 text-white font-bold text-xs shadow-2xl shadow-indigo-600/40 border border-indigo-400/40 transition-all group"
      >
        <Sparkles className="w-4 h-4 text-purple-200 group-hover:rotate-12 transition-transform" />
        <span>인맥 코파일럿</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      </button>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-semibold shadow-2xl shadow-indigo-500/40 border border-indigo-400/30 animate-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
