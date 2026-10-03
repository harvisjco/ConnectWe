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
import { loadPromotionEvents } from './services/promotionRadarService';

import { Header } from './components/common/Header';
import { SidebarLNB, NavViewType } from './components/common/SidebarLNB';
import { MobileBottomBar } from './components/common/MobileBottomBar';
import { MeetingRadarBanner } from './components/radar/MeetingRadarBanner';
import { GraphSearchBar } from './components/search/GraphSearchBar';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { ViewLoadingSkeleton } from './components/common/ViewLoadingSkeleton';
import { UserRole, getStoredUserRole, saveUserRole } from './types/userRole';

// 12대 멀티 디멘션 뷰 비동기 코드 스플리팅 (Code Splitting via React.lazy)
const GeneralMemberView = React.lazy(() => import('./components/views/GeneralMemberView').then(m => ({ default: m.GeneralMemberView })));
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
// 모달 및 서브시스템 비동기 레이지 로딩 (On-Demand Bundle Splitting)
const PersonInspectorModal = React.lazy(() => import('./components/inspector/PersonInspectorModal').then(m => ({ default: m.PersonInspectorModal })));
const RelationshipCopilotDrawer = React.lazy(() => import('./components/copilot/RelationshipCopilotDrawer').then(m => ({ default: m.RelationshipCopilotDrawer })));
const ImportDataModal = React.lazy(() => import('./components/import/ImportDataModal').then(m => ({ default: m.ImportDataModal })));
const AddPersonModal = React.lazy(() => import('./components/crm/AddPersonModal').then(m => ({ default: m.AddPersonModal })));
const DailyDigestModal = React.lazy(() => import('./components/digest/DailyDigestModal').then(m => ({ default: m.DailyDigestModal })));
const DisclosureAlertModal = React.lazy(() => import('./components/digest/DisclosureAlertModal').then(m => ({ default: m.DisclosureAlertModal })));
const DegreesOfSeparationModal = React.lazy(() => import('./components/network/DegreesOfSeparationModal').then(m => ({ default: m.DegreesOfSeparationModal })));
const NetworkDashboard = React.lazy(() => import('./components/dashboard/NetworkDashboard').then(m => ({ default: m.NetworkDashboard })));
const UserSettingsModal = React.lazy(() => import('./components/settings/UserSettingsModal').then(m => ({ default: m.UserSettingsModal })));
const CalendarImportModal = React.lazy(() => import('./components/radar/CalendarImportModal').then(m => ({ default: m.CalendarImportModal })));
const PrivateSalonModal = React.lazy(() => import('./components/modals/PrivateSalonModal').then(m => ({ default: m.PrivateSalonModal })));
const CadenceGreetingModal = React.lazy(() => import('./components/modals/CadenceGreetingModal').then(m => ({ default: m.CadenceGreetingModal })));
const ProximityTeaBundleModal = React.lazy(() => import('./components/radar/ProximityTeaBundleModal').then(m => ({ default: m.ProximityTeaBundleModal })));
const ExecutiveWeeklyBriefModal = React.lazy(() => import('./components/modals/ExecutiveWeeklyBriefModal').then(m => ({ default: m.ExecutiveWeeklyBriefModal })));
const RelationshipHeatmapModal = React.lazy(() => import('./components/modals/RelationshipHeatmapModal').then(m => ({ default: m.RelationshipHeatmapModal })));
const GratitudeSettlementModal = React.lazy(() => import('./components/modals/GratitudeSettlementModal').then(m => ({ default: m.GratitudeSettlementModal })));
const GoldenCareModal = React.lazy(() => import('./components/modals/GoldenCareModal').then(m => ({ default: m.GoldenCareModal })));
const ExecutiveProtocolModal = React.lazy(() => import('./components/modals/ExecutiveProtocolModal').then(m => ({ default: m.ExecutiveProtocolModal })));
const AmbientAudioBriefingModal = React.lazy(() => import('./components/modals/AmbientAudioBriefingModal').then(m => ({ default: m.AmbientAudioBriefingModal })));
const CrossBoardSynergyModal = React.lazy(() => import('./components/modals/CrossBoardSynergyModal').then(m => ({ default: m.CrossBoardSynergyModal })));
const ProjectSquadBuilderModal = React.lazy(() => import('./components/modals/ProjectSquadBuilderModal').then(m => ({ default: m.ProjectSquadBuilderModal })));
const EarlyStageVentureRadarModal = React.lazy(() => import('./components/modals/EarlyStageVentureRadarModal').then(m => ({ default: m.EarlyStageVentureRadarModal })));
const KnowledgeExchangeModal = React.lazy(() => import('./components/modals/KnowledgeExchangeModal').then(m => ({ default: m.KnowledgeExchangeModal })));
const PeerSynergyHubModal = React.lazy(() => import('./components/modals/PeerSynergyHubModal').then(m => ({ default: m.PeerSynergyHubModal })));
const GlobalCommandPalette = React.lazy(() => import('./components/common/GlobalCommandPalette').then(m => ({ default: m.GlobalCommandPalette })));
const AuthModal = React.lazy(() => import('./components/auth/AuthModal').then(m => ({ default: m.AuthModal })));

// 5대 통합 스튜디오 (The 5 Unified Studios) 비동기 레이지 로딩
const SmartCardScannerStudio = React.lazy(() => import('./components/studios/SmartCardScannerStudio').then(m => ({ default: m.SmartCardScannerStudio })));
const ExecutiveMeetingStudio = React.lazy(() => import('./components/studios/ExecutiveMeetingStudio').then(m => ({ default: m.ExecutiveMeetingStudio })));
const ExecutiveDebriefStudio = React.lazy(() => import('./components/studios/ExecutiveDebriefStudio').then(m => ({ default: m.ExecutiveDebriefStudio })));
const WarmIntroHubStudio = React.lazy(() => import('./components/studios/WarmIntroHubStudio').then(m => ({ default: m.WarmIntroHubStudio })));
const DataVaultSecurityStudio = React.lazy(() => import('./components/studios/DataVaultSecurityStudio').then(m => ({ default: m.DataVaultSecurityStudio })));

import { BusinessDeal } from './services/dealPipelineService';
import { maskPerson } from './services/privacyShieldService';
import { GeoClusterId } from './services/geoProximityService';
import { PwaInstallBanner } from './components/common/PwaInstallBanner';
import { offlineSyncService, OfflineSyncState } from './services/offlineSyncService';
import { detectGoldenCareTargets } from './services/goldenCareService';
import { onAuthStateChange, signOut, AuthUser } from './services/authService';
import { ProtocolEventType } from './services/executiveProtocolService';

import { CheckCircle2, Zap, Users, Building2, Briefcase, Compass, Award, Share2, GraduationCap } from 'lucide-react';


export const App: React.FC = () => {
  // 회원 등급 관리 (일반회원 | Hidden회원 | 마스터)
  const [userRole, setUserRole] = useState<UserRole>(() => getStoredUserRole());

  // Supabase Auth 사용자 및 인증 모달 상태
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // 로컬 스토리지 기반 오프라인 퍼스트 상태 (사용자별 완전 격리)
  const [people, setPeople] = useState<Person[]>(() => loadPeopleFromStorage());
  const [activeView, setActiveView] = useState<NavViewType>(() => {
    const role = getStoredUserRole();
    return role === 'general' ? 'general' : 'command';
  });
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

  // 회원 등급 전환 핸들러
  const handleSelectUserRole = (newRole: UserRole) => {
    setUserRole(newRole);
    saveUserRole(newRole);
    if (newRole === 'general') {
      setActiveView('general');
    } else if (newRole === 'hidden' && activeView === 'general') {
      setActiveView('command');
    }
  };

  const handleToggleSidebarCollapse = () => {
    setIsSidebarCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('connectwe_sidebar_collapsed', String(next));
      return next;
    });
  };

  // 회원 등급별 퀵 탭 네비게이션
  const quickNavTabs = React.useMemo(() => {
    if (userRole === 'general') {
      return [
        { id: 'general' as NavViewType, label: '동문 주소록 & 소모임', icon: GraduationCap },
        { id: 'team' as NavViewType, label: '팀 네트워크 협업', icon: Users },
      ];
    }
    if (userRole === 'hidden') {
      return [
        { id: 'command' as NavViewType, label: '관계 현황', icon: Zap },
        { id: 'deals' as NavViewType, label: '파트너십 & 프로젝트', icon: Briefcase },
        { id: 'proximity' as NavViewType, label: '티타임 레이더', icon: Compass },
        { id: 'promotion' as NavViewType, label: '인사·영전 소식', icon: Award },
        { id: 'team' as NavViewType, label: '팀 협업', icon: Users },
      ];
    }
    return [
      { id: 'command' as NavViewType, label: '관계 총괄', icon: Zap },
      { id: 'company' as NavViewType, label: '실공시 팩트', icon: Building2 },
      { id: 'orgchart' as NavViewType, label: '기업 조직도', icon: Building2 },
      { id: 'deals' as NavViewType, label: '파트너십·프로젝트', icon: Briefcase },
      { id: 'proximity' as NavViewType, label: '티타임 레이더', icon: Compass },
      { id: 'promotion' as NavViewType, label: '인사·영전 소식', icon: Award },
    ];
  }, [userRole]);

  // 실시간 미팅 레이더 캘린더 상태
  const [meetings, setMeetings] = useState<CalendarMeeting[]>(() => loadMeetingsFromStorage(people));
  const [isCardScannerOpen, setIsCardScannerOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isDisclosureAlertOpen, setIsDisclosureAlertOpen] = useState(false);

  // 미팅 직후 회고 및 24h 팔로업 상태
  const [debriefTargetPerson, setDebriefTargetPerson] = useState<Person | null>(null);
  const [followUpTargetPerson, setFollowUpTargetPerson] = useState<Person | null>(null);

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
  const [isSalonModalOpen, setIsSalonModalOpen] = useState(false);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [bridgeTargetPerson, setBridgeTargetPerson] = useState<Person | null>(null);
  const [meetingPrepTargetPerson, setMeetingPrepTargetPerson] = useState<Person | null>(null);
  const [cadenceTarget, setCadenceTarget] = useState<{ person: Person; daysSince: number } | null>(null);
  const [teaBundleClusterId, setTeaBundleClusterId] = useState<GeoClusterId | null>(null);
  const [warmIntroConnectorTargets, setWarmIntroConnectorTargets] = useState<{ personA?: Person; personB?: Person } | null>(null);
  const [isWeeklyBriefOpen, setIsWeeklyBriefOpen] = useState(false);
  const [isDataVaultOpen, setIsDataVaultOpen] = useState(false);
  const [isHeatmapOpen, setIsHeatmapOpen] = useState(false);
  const [isGratitudeOpen, setIsGratitudeOpen] = useState(false);
  const [gratitudeTargetDeal, setGratitudeTargetDeal] = useState<BusinessDeal | null>(null);
  const [isShieldActive, setIsShieldActive] = useState<boolean>(() => {
    return localStorage.getItem('connectwe_privacy_shield') === 'true';
  });
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isVoiceDebriefOpen, setIsVoiceDebriefOpen] = useState(false);
  const [voiceDebriefTarget, setVoiceDebriefTarget] = useState<Person | null>(null);
  const [isWarmIntroPathOpen, setIsWarmIntroPathOpen] = useState(false);
  const [warmIntroPathTarget, setWarmIntroPathTarget] = useState<Person | null>(null);
  const [isBatchScannerOpen, setIsBatchScannerOpen] = useState(false);
  const [isTeaTimeModalOpen, setIsTeaTimeModalOpen] = useState(false);
  const [teaTimeTargetPerson, setTeaTimeTargetPerson] = useState<Person | null>(null);
  const [isGoldenCareOpen, setIsGoldenCareOpen] = useState(false);
  const [goldenCareTargetPerson, setGoldenCareTargetPerson] = useState<Person | null>(null);
  const [isProtocolOpen, setIsProtocolOpen] = useState(false);
  const [protocolTargetPerson, setProtocolTargetPerson] = useState<Person | null>(null);
  const [protocolInitialType, setProtocolInitialType] = useState<ProtocolEventType>('CONDOLENCE');
  const [isAudioBriefingOpen, setIsAudioBriefingOpen] = useState(false);
  const [audioBriefingTargetPerson, setAudioBriefingTargetPerson] = useState<Person | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleOpenGoldenCare = (person?: Person) => {
    if (person) {
      setGoldenCareTargetPerson(person);
    } else {
      const targets = detectGoldenCareTargets(people);
      setGoldenCareTargetPerson(targets.length > 0 ? targets[0].person : (people[0] || null));
    }
    setIsGoldenCareOpen(true);
  };

  const handleOpenProtocol = (person?: Person, initialType?: ProtocolEventType) => {
    setProtocolTargetPerson(person || (people.length > 0 ? people[0] : null));
    if (initialType) setProtocolInitialType(initialType);
    setIsProtocolOpen(true);
  };

  const handleOpenAudioBriefing = (person?: Person) => {
    setAudioBriefingTargetPerson(person || (people.length > 0 ? people[0] : null));
    setIsAudioBriefingOpen(true);
  };

  const [isCrossBoardOpen, setIsCrossBoardOpen] = useState(false);
  const [crossBoardTargetCorp, setCrossBoardTargetCorp] = useState<string>('삼성전자');

  const handleOpenCrossBoardSynergy = (targetCorp?: string) => {
    if (targetCorp) setCrossBoardTargetCorp(targetCorp);
    setIsCrossBoardOpen(true);
  };

  const [isSquadBuilderOpen, setIsSquadBuilderOpen] = useState(false);
  const handleOpenSquadBuilder = () => {
    setIsSquadBuilderOpen(true);
  };

  const [isVentureRadarOpen, setIsVentureRadarOpen] = useState(false);
  const handleOpenVentureRadar = () => {
    setIsVentureRadarOpen(true);
  };

  const [isKnowledgeExchangeOpen, setIsKnowledgeExchangeOpen] = useState(false);
  const handleOpenKnowledgeExchange = () => {
    setIsKnowledgeExchangeOpen(true);
  };

  const [isPeerSynergyOpen, setIsPeerSynergyOpen] = useState(false);
  const [peerSynergyInitialTab, setPeerSynergyInitialTab] = useState<'tech' | 'referral' | 'guild' | 'notes'>('tech');
  const handleOpenPeerSynergy = (tab: 'tech' | 'referral' | 'guild' | 'notes' = 'tech') => {
    setPeerSynergyInitialTab(tab);
    setIsPeerSynergyOpen(true);
  };

  // C-Level 초고속 스포트라이트 커맨드 팔레트 (CMD+K / Ctrl+K) 전역 핫키 바인딩
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 오프라인 / 온라인 네트워크 전환 리스너
  useEffect(() => {
    let prevOnline = offlineSyncService.getState().isOnline;
    const unsubscribe = offlineSyncService.subscribe((state: OfflineSyncState) => {
      if (prevOnline !== state.isOnline) {
        if (!state.isOnline) {
          showToast('✈️ 오프라인 안심 모드로 전환되었습니다. 기내에서도 모든 조회가 가능합니다.');
        } else {
          showToast('🟢 네트워크가 복원되었습니다. 로컬 변경 사항이 안전하게 자동 동기화됩니다.');
        }
        prevOnline = state.isOnline;
      }
    });
    return unsubscribe;
  }, []);

  // Supabase Auth 세션 구독 및 사용자 변경 시 인맥 스위칭
  useEffect(() => {
    const unsubscribe = onAuthStateChange((user) => {
      setAuthUser(user);
      if (user) {
        const userPeople = loadPeopleFromStorage(user.id);
        setPeople(userPeople);
      }
    });
    return unsubscribe;
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setAuthUser(null);
    showToast('안전하게 로그아웃되었습니다. 게스트 모드로 전환됩니다.');
    setPeople(loadPeopleFromStorage('guest'));
  };

  // VIP 프라이버시 쉴드 모드 토글
  const handleToggleShield = () => {
    setIsShieldActive(prev => {
      const next = !prev;
      localStorage.setItem('connectwe_privacy_shield', String(next));
      showToast(next ? '🔒 VIP 대외비 프라이버시 쉴드가 활성화되었습니다. (민감정보 마스킹)' : 'VIP 프라이버시 쉴드가 해제되었습니다.');
      return next;
    });
  };

  // 미축하 영전 건수 (모바일 바텀바 배지용)
  const uncelebratedPromosCount = React.useMemo(() => {
    return loadPromotionEvents(people).filter(p => !p.isCongratulated).length;
  }, [people]);

  // people 상태 변경 시 자동 영속화 (현재 로그인 사용자 볼트에 격리 저장)
  useEffect(() => {
    savePeopleToStorage(people, authUser?.id);
  }, [people, authUser]);

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
  const rawFilteredPeople = selectedClusterId
    ? basePeople.filter(p => identifyTalentCluster(p).id === selectedClusterId)
    : basePeople;
  
  // VIP 프라이버시 쉴드 활성화 시 표시용 인맥 데이터 실시간 마스킹
  const displayPeople = React.useMemo(() => {
    if (!isShieldActive) return rawFilteredPeople;
    return rawFilteredPeople.map(p => maskPerson(p, true));
  }, [rawFilteredPeople, isShieldActive]);

  const highlightNodeIds = searchResult ? searchResult.highlightNodeIds : [];
  const mePerson = people.find(p => p.closeness === 1);
  const imminentMeeting = getImminentMeeting(meetings);

  return (
    <div className="min-h-screen flex flex-col font-sans selection:bg-indigo-600 selection:text-white bg-[#f8fafc] text-slate-800">
      {/* Real-time Meeting Radar Banner (비일반 회원 전용) */}
      {userRole !== 'general' && (
        <MeetingRadarBanner
          imminentMeeting={imminentMeeting}
          onOpenDossier={(target) => setMeetingPrepTargetPerson(target)}
          onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
          onOpenDebrief={(target) => setDebriefTargetPerson(target)}
        />
      )}

      {/* Top Header */}
      <Header
        people={people}
        userRole={userRole}
        onSelectUserRole={handleSelectUserRole}
        onToggleSidebar={() => setIsMobileSidebarOpen(prev => !prev)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenVoiceDebrief={() => {
          setVoiceDebriefTarget(null);
          setIsVoiceDebriefOpen(true);
        }}
        onOpenWarmIntroPath={() => {
          setWarmIntroPathTarget(null);
          setIsWarmIntroPathOpen(true);
        }}
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenAddModal={() => setIsAddModalOpen(true)}
        onOpenDigestModal={() => setIsDigestModalOpen(true)}
        onOpenDashboard={() => setIsDashboardOpen(true)}
        onOpenEncryptionModal={() => setIsEncryptionModalOpen(true)}
        onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
        onOpenCloudSyncModal={() => setIsCloudSyncOpen(true)}
        onOpenCopilot={() => setIsCopilotOpen(true)}
        onOpenCardScanner={() => setIsCardScannerOpen(true)}
        onOpenBatchCardScanner={() => setIsBatchScannerOpen(true)}
        onOpenTeaTimeModal={(target) => {
          setTeaTimeTargetPerson(target || null);
          setIsTeaTimeModalOpen(true);
        }}
        onOpenGoldenCare={handleOpenGoldenCare}
        onOpenProtocol={(target?: Person) => handleOpenProtocol(target)}
        onOpenAudioBriefing={(target?: Person) => handleOpenAudioBriefing(target)}
        onOpenCrossBoardSynergy={(corp?: string) => handleOpenCrossBoardSynergy(corp)}
        onOpenSquadBuilder={handleOpenSquadBuilder}
        onOpenWeeklyBrief={() => setIsWeeklyBriefOpen(true)}
        onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
        onOpenDisclosureAlertModal={() => setIsDisclosureAlertOpen(true)}
        onOpenHeatmap={() => setIsHeatmapOpen(true)}
        onOpenGratitudeSettlement={() => {
          setGratitudeTargetDeal(null);
          setIsGratitudeOpen(true);
        }}
        isShieldActive={isShieldActive}
        onToggleShield={handleToggleShield}
        onOpenDataVault={() => setIsDataVaultOpen(true)}
        authUser={authUser}
        onOpenAuthModal={() => setIsAuthModalOpen(true)}
        onSignOut={handleSignOut}
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
          userRole={userRole}
          onSelectUserRole={handleSelectUserRole}
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
            {/* Reference GoodPartner Style Info Banner (비일반 회원 전용) */}
            {userRole !== 'general' && (
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
            )}

            {/* GraphRAG Search Interface (비일반 회원 전용: 일반 회원은 자체 동문 검색바 사용) */}
            {userRole !== 'general' && (
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
            )}

            {/* Dynamic Multi-dimensional Views with Code Splitting & Error Isolation */}
            <section className="animate-in fade-in duration-200 min-h-[520px]">
          <ErrorBoundary fallbackTitle="선택된 뷰 컴포넌트 런타임 오류 방어">
            <React.Suspense fallback={<ViewLoadingSkeleton />}>
              {activeView === 'general' && (
                <GeneralMemberView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onOpenAddModal={() => setIsAddModalOpen(true)}
                  onOpenCardScanner={() => setIsCardScannerOpen(true)}
                  onOpenSquadBuilder={handleOpenSquadBuilder}
                  onOpenVentureRadar={handleOpenVentureRadar}
                  onOpenKnowledgeExchange={handleOpenKnowledgeExchange}
                  onOpenPeerSynergy={handleOpenPeerSynergy}
                  onShowToast={showToast}
                  onSelectUserRole={handleSelectUserRole}
                />
              )}

              {activeView === 'command' && (
                <ExecutiveCommandCenterView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onOpenDossier={(target) => setMeetingPrepTargetPerson(target)}
                  onOpenBridgeModal={(target) => setBridgeTargetPerson(target)}
                  onOpenDebrief={(target) => setDebriefTargetPerson(target)}
                  onOpenSalon={() => setIsSalonModalOpen(true)}
                  onOpenCloudSync={() => setIsCloudSyncOpen(true)}
                  onOpenScanner={() => setIsCardScannerOpen(true)}
                  onOpenCadenceGreeting={(person) => handleOpenGoldenCare(person)}
                  onOpenTeaBundle={(clusterId) => setTeaBundleClusterId(clusterId || 'gangnam_teheran')}
                  onOpenWarmIntroConnector={(personA, personB) => setWarmIntroConnectorTargets({ personA, personB })}
                  onOpenWeeklyBrief={() => setIsWeeklyBriefOpen(true)}
                  onOpenMeetingBriefing={(target) => setMeetingPrepTargetPerson(target)}
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
                  onOpenDossier={(target) => setMeetingPrepTargetPerson(target)}
                  onOpenReferralReward={(corpName) => {
                    handleNavigateView('referral');
                    showToast(`[${corpName}] 연계 채용 오픈 포지션 및 추천 리워드 탐색으로 전환되었습니다.`);
                  }}
                  onOpenCrossBoardSynergy={handleOpenCrossBoardSynergy}
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
                  onOpenDossier={(target) => setMeetingPrepTargetPerson(target)}
                  onOpenGoldenCare={handleOpenGoldenCare}
                  onShowToast={showToast}
                />
              )}

              {activeView === 'team' && (
                <TeamNetworkView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onOpenSquadBuilder={handleOpenSquadBuilder}
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
                  onOpenDossier={(target) => setMeetingPrepTargetPerson(target)}
                  onOpenBridgeModal={(target) => setBridgeTargetPerson(target)}
                  onOpenGratitudeSettlement={(deal) => {
                    setGratitudeTargetDeal(deal);
                    setIsGratitudeOpen(true);
                  }}
                  onOpenCrossBoardSynergy={handleOpenCrossBoardSynergy}
                  onShowToast={showToast}
                />
              )}

              {activeView === 'proximity' && (
                <GeoProximityRadarView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onOpenTeaBundle={(clusterId) => setTeaBundleClusterId(clusterId)}
                  onShowToast={showToast}
                />
              )}

              {activeView === 'promotion' && (
                <PromotionCadenceView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onOpenDossier={(target: Person) => setMeetingPrepTargetPerson(target)}
                  onOpenProtocol={(target: Person) => handleOpenProtocol(target, 'CONGRATULATION_PROMOTION')}
                  onShowToast={showToast}
                />
              )}

              {activeView === 'audit' && (
                <NetworkAuditReportView
                  people={people}
                  onSelectPerson={setSelectedPerson}
                  onOpenDossier={(target) => setMeetingPrepTargetPerson(target)}
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

      {/* On-Demand Lazy Loaded Modals & Studios with Suspense Boundary */}
      <React.Suspense fallback={null}>
        {selectedPerson && (
          <PersonInspectorModal
            person={selectedPerson}
            allPeople={people}
        onClose={() => setSelectedPerson(null)}
        onUpdatePerson={handleUpdatePerson}
        onDeletePerson={handleDeletePerson}
        onOpenBridgeModal={(target) => setBridgeTargetPerson(target)}
        onOpenDossier={(target) => setMeetingPrepTargetPerson(target)}
        onOpenDebrief={(target) => setDebriefTargetPerson(target)}
        onOpenFollowUp={(target) => {
          setFollowUpTargetPerson(target);
        }}
        onOpenMeetingBriefing={(target) => {
          setSelectedPerson(null);
          setMeetingPrepTargetPerson(target);
        }}
        onOpenVoiceDebrief={(target) => {
          setSelectedPerson(null);
          setVoiceDebriefTarget(target);
          setIsVoiceDebriefOpen(true);
        }}
        onOpenWarmIntroPath={(target) => {
          setSelectedPerson(null);
          setWarmIntroPathTarget(target);
          setIsWarmIntroPathOpen(true);
        }}
        onOpenTeaTimeModal={(target) => {
          setSelectedPerson(null);
          setTeaTimeTargetPerson(target);
          setIsTeaTimeModalOpen(true);
        }}
        onOpenGoldenCare={(target) => {
          setSelectedPerson(null);
          handleOpenGoldenCare(target);
        }}
        onOpenProtocol={(target) => {
          setSelectedPerson(null);
          handleOpenProtocol(target);
        }}
        onOpenAudioBriefing={(target) => {
          setSelectedPerson(null);
          handleOpenAudioBriefing(target);
        }}
      />
      )}


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
          onOpenBounty={() => {
            setBridgeTargetPerson(null);
            handleNavigateView('bounty');
          }}
          onShowToast={showToast}
        />
      )}

      {/* Network Intelligence Dashboard */}
      {isDashboardOpen && (
        <NetworkDashboard
          people={people}
          onClose={() => setIsDashboardOpen(false)}
          onSelectPerson={setSelectedPerson}
          onOpenHeatmap={() => setIsHeatmapOpen(true)}
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


      {/* Private Salon & Tea Hosting Modal */}
      {isSalonModalOpen && (
        <PrivateSalonModal
          people={people}
          onClose={() => setIsSalonModalOpen(false)}
          onSelectPerson={setSelectedPerson}
          onOpenDebrief={(target) => {
            setIsSalonModalOpen(false);
            setDebriefTargetPerson(target);
          }}
          onShowToast={showToast}
        />
      )}


      {/* Cadence Greeting Modal (소통 골든타임 안부 레이더) */}
      {cadenceTarget && (
        <CadenceGreetingModal
          person={cadenceTarget.person}
          daysSinceLastContact={cadenceTarget.daysSince}
          onUpdatePerson={handleUpdatePerson}
          onClose={() => setCadenceTarget(null)}
          onShowToast={showToast}
        />
      )}

      {/* Proactive Golden Care Radar & 4-Theme Message Composer Modal */}
      {(isGoldenCareOpen || !!goldenCareTargetPerson) && (
        <GoldenCareModal
          isOpen={true}
          person={goldenCareTargetPerson || (people.length > 0 ? people[0] : null)}
          onClose={() => {
            setIsGoldenCareOpen(false);
            setGoldenCareTargetPerson(null);
          }}
          onUpdatePerson={handleUpdatePerson}
          onShowToast={showToast}
          onOpenMeetingStudio={(p: Person) => {
            setIsGoldenCareOpen(false);
            setGoldenCareTargetPerson(null);
            setTeaTimeTargetPerson(p);
            setIsTeaTimeModalOpen(true);
          }}
        />
      )}

      {/* C-Suite 경조사 의전 & 정중 서신 컨시어지 모달 */}
      {(isProtocolOpen || !!protocolTargetPerson) && (
        <ExecutiveProtocolModal
          isOpen={true}
          person={protocolTargetPerson || (people.length > 0 ? people[0] : null)}
          initialEventType={protocolInitialType}
          onClose={() => {
            setIsProtocolOpen(false);
            setProtocolTargetPerson(null);
          }}
          onUpdatePerson={handleUpdatePerson}
          onShowToast={showToast}
        />
      )}

      {/* 에어팟 앰비언트 30초 오디오 브리핑 모달 */}
      {(isAudioBriefingOpen || !!audioBriefingTargetPerson) && (
        <AmbientAudioBriefingModal
          isOpen={true}
          person={audioBriefingTargetPerson || (people.length > 0 ? people[0] : null)}
          onClose={() => {
            setIsAudioBriefingOpen(false);
            setAudioBriefingTargetPerson(null);
          }}
          onShowToast={showToast}
        />
      )}

      {/* 전략적 M&A & 크로스 보드 시너지 시뮬레이터 모달 */}
      {isCrossBoardOpen && (
        <CrossBoardSynergyModal
          isOpen={true}
          people={people}
          initialTargetCorp={crossBoardTargetCorp}
          onSelectPerson={setSelectedPerson}
          onOpenTeaTimeModal={(target) => {
            setIsCrossBoardOpen(false);
            setTeaTimeTargetPerson(target || null);
            setIsTeaTimeModalOpen(true);
          }}
          onClose={() => setIsCrossBoardOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* 스마트 프로젝트 팀 빌더 & 스킬 매칭 스튜디오 모달 */}
      {isSquadBuilderOpen && (
        <ProjectSquadBuilderModal
          isOpen={true}
          people={people}
          onSelectPerson={setSelectedPerson}
          onOpenTeaTimeStudio={(person) => {
            setIsSquadBuilderOpen(false);
            setTeaTimeTargetPerson(person);
            setIsTeaTimeModalOpen(true);
          }}
          onClose={() => setIsSquadBuilderOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* 초기 스타트업 창업 & 시드 펀딩 레이더 (파운더스 클럽) 모달 */}
      {isVentureRadarOpen && (
        <EarlyStageVentureRadarModal
          isOpen={true}
          people={people}
          onSelectPerson={setSelectedPerson}
          onOpenSquadBuilder={(_signal) => {
            setIsVentureRadarOpen(false);
            setIsSquadBuilderOpen(true);
          }}
          onClose={() => setIsVentureRadarOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* 실무 슈퍼파워 지식 교환 & 캐주얼 멘토링 팟 모달 */}
      {isKnowledgeExchangeOpen && (
        <KnowledgeExchangeModal
          isOpen={true}
          people={people}
          onSelectPerson={setSelectedPerson}
          onOpenTeaTimeStudio={(person) => {
            setIsKnowledgeExchangeOpen(false);
            setTeaTimeTargetPerson(person);
            setIsTeaTimeModalOpen(true);
          }}
          onClose={() => setIsKnowledgeExchangeOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* 실무 인재 시너지 & 성장 스튜디오 (테크 스택 / 사내 추천 / 스터디 길드 / 인사이트 노트) */}
      {isPeerSynergyOpen && (
        <PeerSynergyHubModal
          isOpen={true}
          initialTab={peerSynergyInitialTab}
          people={people}
          onSelectPerson={setSelectedPerson}
          onClose={() => setIsPeerSynergyOpen(false)}
          onShowToast={showToast}
        />
      )}

      {/* Proximity Tea Bundle Modal (거점 외근 동선 지능형 티타임 번들러) */}
      {teaBundleClusterId && (
        <ProximityTeaBundleModal
          people={people}
          initialClusterId={teaBundleClusterId}
          onClose={() => setTeaBundleClusterId(null)}
          onSelectPerson={setSelectedPerson}
          onNavigateToProximityMap={(_clusterId) => {
            setTeaBundleClusterId(null);
            handleNavigateView('proximity');
          }}
          onShowToast={showToast}
        />
      )}


      {/* C-Level Weekly Intelligence 1-Page Brief Modal */}
      {isWeeklyBriefOpen && (
        <ExecutiveWeeklyBriefModal
          people={people}
          meetings={meetings}
          onClose={() => setIsWeeklyBriefOpen(false)}
          onSelectPerson={setSelectedPerson}
          onShowToast={showToast}
        />
      )}


      {/* C-Level Relationship Tie Strength & Temperature Heatmap Modal */}
      {isHeatmapOpen && (
        <RelationshipHeatmapModal
          people={people}
          meetings={meetings}
          onClose={() => setIsHeatmapOpen(false)}
          onSelectPerson={setSelectedPerson}
          onShowToast={showToast}
        />
      )}

      {/* Business Deal Referral Reward & Gratitude Settlement Dashboard Modal */}
      {isGratitudeOpen && (
        <GratitudeSettlementModal
          people={people}
          initialDeal={gratitudeTargetDeal}
          onClose={() => {
            setIsGratitudeOpen(false);
            setGratitudeTargetDeal(null);
          }}
          onSelectPerson={setSelectedPerson}
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
          onOpenDossier={(target) => setMeetingPrepTargetPerson(target)}
          onClose={() => setIsCalendarModalOpen(false)}
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
        uncelebratedPromosCount={uncelebratedPromosCount}
        onOpenScanner={() => setIsCardScannerOpen(true)}
      />

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-slate-900/95 backdrop-blur-md text-white text-xs font-semibold shadow-2xl shadow-slate-900/40 border border-slate-700/80 animate-in slide-in-from-bottom-4 duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* C-Level 초고속 스포트라이트 커맨드 팔레트 (CMD+K / Ctrl+K) */}
      <GlobalCommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        people={people}
        onSelectPerson={setSelectedPerson}
        onOpenMeetingBriefing={(p: Person) => setMeetingPrepTargetPerson(p)}
        onOpenVoiceDebrief={() => {
          setVoiceDebriefTarget(null);
          setIsVoiceDebriefOpen(true);
        }}
        onOpenWarmIntroPath={() => {
          setWarmIntroPathTarget(null);
          setIsWarmIntroPathOpen(true);
        }}
        onOpenWeeklyBrief={() => setIsWeeklyBriefOpen(true)}
        onOpenBatchCardScanner={() => setIsBatchScannerOpen(true)}
        onOpenTeaTimeModal={(target?: Person) => {
          setTeaTimeTargetPerson(target || null);
          setIsTeaTimeModalOpen(true);
        }}
        onOpenGoldenCare={() => handleOpenGoldenCare()}
        onOpenProtocol={(target) => handleOpenProtocol(target)}
        onOpenAudioBriefing={(target) => handleOpenAudioBriefing(target)}
        onOpenCrossBoardSynergy={(corp?: string) => handleOpenCrossBoardSynergy(corp)}
        onOpenSquadBuilder={handleOpenSquadBuilder}
        onOpenVentureRadar={handleOpenVentureRadar}
        onOpenKnowledgeExchange={handleOpenKnowledgeExchange}
        onOpenPeerSynergy={handleOpenPeerSynergy}
        onNavigateView={(v: NavViewType) => handleNavigateView(v)}
      />

      {/* ========================================================
          5대 통합 스튜디오 (The 5 Unified Executive Studios)
          ======================================================== */}

      {/* Studio 1: 스마트 명함 스캔 스튜디오 (1초 단일 스캔 ↔ 연속 일괄 스캔 & DART 결합) */}
      {(isCardScannerOpen || isBatchScannerOpen) && (
        <SmartCardScannerStudio
          initialMode={isBatchScannerOpen ? 'batch' : 'single'}
          onSavePerson={(p: Person) => {
            setPeople(prev => [p, ...prev]);
            setSelectedPerson(p);
          }}
          onSaveBatch={(newPeople) => {
            setPeople(prev => [...newPeople, ...prev]);
            if (newPeople.length > 0) {
              setSelectedPerson(newPeople[0]);
            }
          }}
          onClose={() => {
            setIsCardScannerOpen(false);
            setIsBatchScannerOpen(false);
          }}
          onShowToast={showToast}
        />
      )}

      {/* Studio 2: C-Level 미팅 & 티타임 준비 스튜디오 (1-Page 스마트 브리프 ↔ 3대 의제 & .ICS 캘린더) */}
      {(!!meetingPrepTargetPerson || isTeaTimeModalOpen) && (
        <ExecutiveMeetingStudio
          isOpen={true}
          initialTab={isTeaTimeModalOpen ? 'teatime' : 'brief'}
          person={teaTimeTargetPerson || meetingPrepTargetPerson || (people.length > 0 ? people[0] : null)}
          allPeople={people}
          onClose={() => {
            setMeetingPrepTargetPerson(null);
            setIsTeaTimeModalOpen(false);
            setTeaTimeTargetPerson(null);
          }}
          onSelectPerson={(p) => {
            setMeetingPrepTargetPerson(null);
            setIsTeaTimeModalOpen(false);
            setTeaTimeTargetPerson(null);
            setSelectedPerson(p);
          }}
          onOpenAudioBriefing={(p) => handleOpenAudioBriefing(p)}
          onShowToast={showToast}
        />
      )}

      {/* Studio 3: 미팅 회고 & 후속 소통 스튜디오 (🎙️ 30초 음성 모드 ↔ ⌨️ 1분 텍스트 모드 & 감사 서신) */}
      {(!!debriefTargetPerson || isVoiceDebriefOpen || !!followUpTargetPerson) && (
        <ExecutiveDebriefStudio
          isOpen={true}
          initialMode={isVoiceDebriefOpen ? 'voice' : 'text'}
          person={debriefTargetPerson || voiceDebriefTarget || followUpTargetPerson || (people.length > 0 ? people[0] : null)}
          people={people}
          onClose={() => {
            setDebriefTargetPerson(null);
            setIsVoiceDebriefOpen(false);
            setVoiceDebriefTarget(null);
            setFollowUpTargetPerson(null);
          }}
          onUpdatePerson={handleUpdatePerson}
          onShowToast={showToast}
        />
      )}

      {/* Studio 4: 웜 인트로 & 관계 허브 스튜디오 (최단 신뢰 소개 경로 ↔ Double Opt-in 두 사람 잇기) */}
      {(isWarmIntroPathOpen || !!warmIntroConnectorTargets) && (
        <WarmIntroHubStudio
          isOpen={true}
          initialTab={warmIntroConnectorTargets ? 'connect_two' : 'find_path'}
          people={people}
          targetPerson={warmIntroPathTarget}
          personA={warmIntroConnectorTargets?.personA}
          personB={warmIntroConnectorTargets?.personB}
          onClose={() => {
            setIsWarmIntroPathOpen(false);
            setWarmIntroPathTarget(null);
            setWarmIntroConnectorTargets(null);
          }}
          onSelectPerson={(p) => {
            setIsWarmIntroPathOpen(false);
            setWarmIntroPathTarget(null);
            setWarmIntroConnectorTargets(null);
            setSelectedPerson(p);
          }}
          onShowToast={showToast}
        />
      )}

      {/* Studio 5: 데이터 볼트 & 보안 동기화 스튜디오 (BOM CSV/암호화 백업 ↔ AES-256 키 관리 ↔ 클라우드/오프라인 동기화) */}
      {(isDataVaultOpen || isEncryptionModalOpen || isCloudSyncOpen) && (
        <DataVaultSecurityStudio
          isOpen={true}
          initialTab={isEncryptionModalOpen ? 'crypto' : isCloudSyncOpen ? 'sync' : 'vault'}
          people={people}
          onUpdatePeople={setPeople}
          onClose={() => {
            setIsDataVaultOpen(false);
            setIsEncryptionModalOpen(false);
            setIsCloudSyncOpen(false);
          }}
          onShowToast={showToast}
        />
      )}

      {/* Executive Multi-Tenant Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={(user, updatedPeople) => {
          setAuthUser(user);
          if (updatedPeople) {
            setPeople(updatedPeople);
          } else {
            setPeople(loadPeopleFromStorage(user.id));
          }
        }}
        onShowToast={showToast}
      />
      </React.Suspense>

      {/* PWA Mobile Installation Floating Banner */}
      <PwaInstallBanner />
    </div>
  );
};
