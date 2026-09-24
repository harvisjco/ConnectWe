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
import { CompanyAlumniView } from './components/views/CompanyAlumniView';
import { CorporateOrgChartView } from './components/views/CorporateOrgChartView';
import { TeamNetworkView } from './components/views/TeamNetworkView';
import { ReferralBountyView } from './components/views/ReferralBountyView';
import { AgeSpectrumView } from './components/views/AgeSpectrumView';
import { NetworkCanvasView } from './components/views/NetworkCanvasView';
import { InteractionTimelineView } from './components/views/InteractionTimelineView';
import { CosmicGalaxy3DView } from './components/views/CosmicGalaxy3DView';
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

import { Building2, Calendar, Share2, CheckCircle2, Clock, Sparkles, Orbit, Users, Gift } from 'lucide-react';

export const App: React.FC = () => {
  // 로컬 스토리지 기반 오프라인 퍼스트 상태
  const [people, setPeople] = useState<Person[]>(() => loadPeopleFromStorage());
  const [activeView, setActiveView] = useState<'company' | 'orgchart' | 'age' | 'canvas' | 'galaxy' | 'timeline' | 'team' | 'referral'>('company');
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-6 py-6 space-y-6">
        
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

        {/* View Mode Switcher Navigation Tabs */}
        <section className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              onClick={() => setActiveView('company')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'company'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>🏢 회사·알럼나이</span>
            </button>

            <button
              onClick={() => setActiveView('orgchart')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'orgchart'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Building2 className="w-4 h-4 text-amber-400" />
              <span>🏛️ DART 기업 조직도</span>
            </button>

            <button
              onClick={() => setActiveView('age')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'age'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span>🎂 나이대별</span>
            </button>

            <button
              onClick={() => setActiveView('canvas')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'canvas'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Share2 className="w-4 h-4" />
              <span>🕸️ 2D 그래프</span>
            </button>

            <button
              onClick={() => setActiveView('galaxy')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'galaxy'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Orbit className="w-4 h-4 text-purple-400" />
              <span>🪐 3D 은하</span>
            </button>

            <button
              onClick={() => setActiveView('timeline')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'timeline'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>📅 타임라인</span>
            </button>

            <button
              onClick={() => setActiveView('team')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'team'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4 text-sky-400" />
              <span>👥 팀 인맥</span>
            </button>

            <button
              onClick={() => setActiveView('referral')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${
                activeView === 'referral'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Gift className="w-4 h-4 text-emerald-400" />
              <span>🎁 바운티</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 hidden sm:block">
            {displayPeople.length === people.length ? (
              <span>전체 <strong className="text-white">{people.length}명</strong> 탐색 중</span>
            ) : (
              <span>검색 필터링 결과 <strong className="text-indigo-400">{displayPeople.length}명</strong> 표출 중</span>
            )}
          </div>
        </section>

        {/* Dynamic Multi-dimensional Views */}
        <section className="animate-in fade-in duration-200">
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
