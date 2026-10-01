import React, { useRef, useState, useEffect } from 'react';
import { Person } from '../../types/network';
import { UserRole, USER_ROLES } from '../../types/userRole';
import { exportPeopleToVcf } from '../../services/vcardExporter';
import { exportBackupJson, restoreBackupFromJson, resetStorage } from '../../services/storageService';
import { batchCrossCheckWithDart } from '../../services/dartFactEngine';
import { pickContactsFromDevice } from '../../services/contactPicker';
import { offlineSyncService, OfflineSyncState } from '../../services/offlineSyncService';
import { 
  Share2, UploadCloud, Download, ShieldCheck, ShieldAlert, Clock, 
  Users, UserPlus, FileDown, RotateCcw, Sparkles, Smartphone,
  BarChart2, Lock, Settings, Cloud, Bot, Camera, Calendar, Bell,
  MoreHorizontal, ChevronDown, PanelLeft, Database, Flame, Gift,
  Crown, Check, Search, Mic, Compass, Plane, RefreshCw, Coffee
} from 'lucide-react';

interface HeaderProps {
  people: Person[];
  userRole?: UserRole;
  onSelectUserRole?: (role: UserRole) => void;
  onToggleSidebar?: () => void;
  onOpenCommandPalette?: () => void;
  onOpenVoiceDebrief?: () => void;
  onOpenWarmIntroPath?: () => void;
  onOpenWeeklyBrief?: () => void;
  onOpenBatchCardScanner?: () => void;
  onOpenTeaTimeModal?: (targetPerson?: Person) => void;
  onOpenImportModal: () => void;
  onOpenAddModal: () => void;
  onOpenDigestModal: () => void;
  onOpenDashboard: () => void;
  onOpenEncryptionModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenCloudSyncModal?: () => void;
  onOpenCopilot?: () => void;
  onOpenCardScanner?: () => void;
  onOpenCalendarModal?: () => void;
  onOpenDisclosureAlertModal?: () => void;
  onOpenHeatmap?: () => void;
  onOpenGratitudeSettlement?: () => void;
  isShieldActive?: boolean;
  onToggleShield?: () => void;
  onOpenDataVault?: () => void;
  onUpdatePeople: (people: Person[]) => void;
  onShowToast: (msg: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  people, 
  userRole = 'general',
  onSelectUserRole,
  onToggleSidebar,
  onOpenCommandPalette,
  onOpenVoiceDebrief,
  onOpenWarmIntroPath,
  onOpenWeeklyBrief,
  onOpenBatchCardScanner,
  onOpenTeaTimeModal,
  onOpenImportModal, 
  onOpenAddModal,
  onOpenDigestModal,
  onOpenDashboard,
  onOpenEncryptionModal,
  onOpenSettingsModal,
  onOpenCloudSyncModal,
  onOpenCopilot,
  onOpenCardScanner,
  onOpenCalendarModal,
  onOpenDisclosureAlertModal,
  onOpenHeatmap,
  onOpenGratitudeSettlement,
  isShieldActive = false,
  onToggleShield,
  onOpenDataVault,
  onUpdatePeople,
  onShowToast
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const roleMenuRef = useRef<HTMLDivElement | null>(null);
  const offlinePopoverRef = useRef<HTMLDivElement | null>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);
  const [isOfflinePopoverOpen, setIsOfflinePopoverOpen] = useState(false);
  const [offlineState, setOfflineState] = useState<OfflineSyncState>(() => offlineSyncService.getState());

  // Subscribe to offline sync changes
  useEffect(() => {
    const unsubscribe = offlineSyncService.subscribe((state) => {
      setOfflineState(state);
    });
    return unsubscribe;
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
      if (roleMenuRef.current && !roleMenuRef.current.contains(e.target as Node)) {
        setIsRoleMenuOpen(false);
      }
      if (offlinePopoverRef.current && !offlinePopoverRef.current.contains(e.target as Node)) {
        setIsOfflinePopoverOpen(false);
      }
    };
    if (isToolsOpen || isRoleMenuOpen || isOfflinePopoverOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isToolsOpen, isRoleMenuOpen, isOfflinePopoverOpen]);

  const handleManualSync = async () => {
    if (!offlineState.isOnline) {
      onShowToast('현재 오프라인 상태입니다. 네트워크 연결 시 자동 동기화됩니다.');
      return;
    }
    const res = await offlineSyncService.syncNow();
    if (res.success) {
      onShowToast(`동기화 완료: 로컬 변경 사항 ${res.syncedCount}건이 안전하게 반영되었습니다.`);
    } else {
      onShowToast('동기화 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    }
  };

  const dartFactCount = people.filter(p => p.sourceType === 'DART_FACT' || p.dartInfo?.isPublicDirector).length;
  const staleCount = people.filter(p => p.isStale).length;

  // CSV 다운로드 (BOM \uFEFF 필수 적용 + PII 마스킹 옵션)
  const handleExportCsv = () => {
    const isMaskPii = localStorage.getItem('connectwe_mask_pii') === 'true';

    const maskMobile = (tel: string) => {
      if (!isMaskPii) return tel;
      return tel.replace(/^(\d{2,3})-(\d{3,4})-(\d{4})$/, '$1-****-$3');
    };

    const headers = ['이름', '현재회사', '현재직함', '소속부서', '휴대전화', '이메일', '출처구분', '추정나이대', 'DART상장공시', '소통상태(미소통여부)', '메모'];
    const rows = people.map(p => [
      `"${p.name}"`,
      `"${p.currentCompany}"`,
      `"${p.currentTitle}"`,
      `"${p.currentDepartment || ''}"`,
      `"${maskMobile(p.mobile)}"`,
      `"${p.email}"`,
      `"${p.sourceType}"`,
      `"${p.estimatedAgeGroup}"`,
      `"${p.dartInfo ? p.dartInfo.stockName : '해당없음'}"`,
      `"${p.isStale ? '6개월이상 미소통' : '최근소통'}"`,
      `"${(p.memo || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `ConnectWe_Contacts_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onShowToast('UTF-8 with BOM 형식으로 엑셀 한글 호환 CSV 파일이 내보내졌습니다.');
  };

  // vCard (.vcf) 전체 내보내기
  const handleExportVcf = () => {
    exportPeopleToVcf(people);
    onShowToast(`총 ${people.length}명의 스마트폰 주소록(.vcf) 파일이 다운로드되었습니다.`);
  };

  // DART 일괄 교차검증 스캔
  const handleBatchDartCheck = () => {
    const { updatedPeople, newlyVerifiedCount } = batchCrossCheckWithDart(people);
    onUpdatePeople(updatedPeople);
    if (newlyVerifiedCount > 0) {
      onShowToast(`DART 8,500+ 기업 DB 매칭 완료: 신규 ${newlyVerifiedCount}명이 공시 팩트로 승격되었습니다!`);
    } else {
      onShowToast('DART 교차 검증 완료: 이미 모든 상장사 임원이 동기화되어 있습니다.');
    }
  };

  // 백업 파일 복원 핸들러
  const handleFileRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = restoreBackupFromJson(content);
      if (res.success) {
        onUpdatePeople(res.people);
        onShowToast(res.message);
      } else {
        alert(res.message);
      }
    };
    reader.readAsText(file, 'utf-8');
  };

  // 초기 상태 리셋 (안전 2중 보호)
  const handleReset = () => {
    const confirmed = confirm('주의: 사용자가 직접 추가하거나 수정한 모든 인맥 데이터가 샘플 데이터로 복원됩니다.\n\n정말로 샘플 데이터로 초기화하시겠습니까? (사전에 [백업 JSON] 다운로드를 권장합니다)');
    if (confirmed) {
      const initial = resetStorage();
      onUpdatePeople(initial);
      onShowToast('인맥 데이터가 기본 샘플 데이터로 초기화되었습니다.');
    }
  };

  // 모바일 단말기 주소록 직접 가져오기 (Contact Picker API)
  const handleDeviceContacts = async () => {
    const res = await pickContactsFromDevice();
    if (!res.supported) {
      onOpenImportModal();
      return;
    }
    if (res.people.length > 0) {
      onUpdatePeople([...res.people, ...people]);
      onShowToast(`스마트폰 주소록에서 ${res.people.length}명의 연락처가 직접 연동되었습니다.`);
    } else if (res.errorMessage) {
      onShowToast(res.errorMessage);
    }
  };

  return (
    <header className="border-b border-slate-200/80 dark:border-slate-800/80 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl sticky top-0 z-40 px-3 sm:px-6 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)] transition-colors overflow-hidden">
      <div className="max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Zone 1: Brand Logo & Pill Badges (GoodPartner Style) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="flex items-center justify-center w-8 h-8 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-700/60 cursor-pointer min-h-[32px] min-w-[32px]"
              title="사이드바 내비게이션 토글"
              aria-label="사이드바 토글"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-xs border border-indigo-400/30 shrink-0">
              <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-white" />
            </div>
            
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-sm sm:text-base font-black tracking-tight text-slate-900 whitespace-nowrap">
                ConnectWe
              </h1>
              <span className="text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                AI 2.0
              </span>
              {/* Network Live vs Offline Status Badge */}
              <div className="relative" ref={offlinePopoverRef}>
                {offlineState.isOnline ? (
                  <button
                    onClick={() => setIsOfflinePopoverOpen(prev => !prev)}
                    title="Supabase PostgreSQL E2EE Cloud Live 연동 중 (클릭하여 동기화 상태 확인)"
                    className="inline-flex items-center gap-1 text-[11px] px-2 py-1 min-h-[32px] rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 dark:bg-emerald-950/60 dark:text-emerald-400 dark:border-emerald-500/30 font-semibold hover:bg-emerald-100 transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-2xs"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live</span>
                    {offlineState.pendingCount > 0 && (
                      <span className="ml-0.5 px-1 py-0.2 rounded-full bg-amber-500 text-white text-[9px] font-bold">
                        {offlineState.pendingCount}
                      </span>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => setIsOfflinePopoverOpen(prev => !prev)}
                    title="오프라인 안심 모드 작동 중 (클릭하여 상세 정보 확인)"
                    className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 min-h-[32px] rounded-full bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-600/40 font-bold hover:bg-amber-100 transition-all cursor-pointer whitespace-nowrap active:scale-95 shadow-xs animate-pulse"
                  >
                    <Plane className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>오프라인 안심</span>
                    {offlineState.pendingCount > 0 && (
                      <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-amber-600 text-white text-[9px] font-bold">
                        {offlineState.pendingCount}
                      </span>
                    )}
                  </button>
                )}

                {/* Offline & Sync Status Popover */}
                {isOfflinePopoverOpen && (
                  <div className="absolute left-0 top-full mt-2 w-72 sm:w-80 p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in-50 zoom-in-95 duration-200">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        {offlineState.isOnline ? (
                          <div className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <Cloud className="w-3.5 h-3.5" />
                          </div>
                        ) : (
                          <div className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                            <Plane className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {offlineState.isOnline ? '클라우드 실시간 연동' : '비행기 / 오프라인 안심 모드'}
                        </span>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        offlineState.isOnline 
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300' 
                          : 'bg-amber-50 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                      }`}>
                        {offlineState.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>

                    <p className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400 mb-3">
                      {offlineState.isOnline 
                        ? '모든 데이터가 기기 로컬 암호화 볼트와 클라우드에 실시간 안전 동기화되고 있습니다.'
                        : '기내 또는 통신 음영 지역에서도 모든 인맥 조회, 검색 및 메모 작성이 AES-256 로컬 볼트에서 100% 안전하게 동작합니다.'}
                    </p>

                    <div className="space-y-1.5 mb-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-[11px]">
                      <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <span>로컬 볼트 보안:</span>
                        <span className="font-semibold text-emerald-600 dark:text-emerald-400">AES-256-GCM</span>
                      </div>
                      <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                        <span>동기화 대기 항목:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {offlineState.pendingCount}건
                        </span>
                      </div>
                      {offlineState.lastSyncedAt && (
                        <div className="flex justify-between items-center text-slate-500 dark:text-slate-400">
                          <span>최근 동기화:</span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {new Date(offlineState.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleManualSync}
                        disabled={offlineState.isSyncing || !offlineState.isOnline}
                        className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${offlineState.isSyncing ? 'animate-spin' : ''}`} />
                        <span>{offlineState.isSyncing ? '동기화 중...' : '지금 동기화'}</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsOfflinePopoverOpen(false);
                          if (onOpenCloudSyncModal) onOpenCloudSyncModal();
                        }}
                        className="py-1.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-all cursor-pointer"
                      >
                        설정
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div 
                title="Zero-Knowledge 로컬 E2EE 암호화: 주소록과 인맥 정보는 사용자의 기기에서만 복호화되며 외부 서버로 무단 유출되지 않습니다."
                className="hidden sm:inline-flex items-center gap-1 text-[11px] px-2 py-1 min-h-[32px] rounded-full bg-slate-100 text-slate-600 border border-slate-200/80 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 font-medium cursor-help"
              >
                <Lock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>E2EE 로컬 암호화</span>
              </div>
            </div>
          </div>
        </div>

        {/* Zone 2: Metric Capsule (Role-specific) */}
        {userRole === 'general' ? (
          <div className="hidden lg:flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-100/70 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800 text-xs whitespace-nowrap">
            <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-slate-500 dark:text-slate-400">동문 주소록</span>
            <span className="font-bold text-slate-900 dark:text-white">{people.length}명</span>
          </div>
        ) : userRole === 'hidden' ? (
          <div className="hidden lg:flex items-center gap-3 px-3.5 py-1 rounded-full bg-slate-100/70 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800 text-xs whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-slate-500 dark:text-slate-400">네트워크</span>
              <span className="font-bold text-slate-900 dark:text-white">{people.length}명</span>
            </div>
            {staleCount > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-700 dark:text-amber-400 font-medium">소통 안부</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">{staleCount}명</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-3 px-3.5 py-1 rounded-full bg-slate-100/70 dark:bg-slate-950/80 border border-slate-200/70 dark:border-slate-800 text-xs whitespace-nowrap">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="text-slate-500 dark:text-slate-400">인맥</span>
              <span className="font-bold text-slate-900 dark:text-white">{people.length}명</span>
            </div>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-emerald-700 dark:text-emerald-400 font-medium">DART 공시</span>
              <span className="font-bold text-emerald-700 dark:text-emerald-300">{dartFactCount}명</span>
            </div>
            {staleCount > 0 && (
              <>
                <span className="text-slate-300 dark:text-slate-700">·</span>
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span className="text-amber-700 dark:text-amber-400 font-medium">소통 환기</span>
                  <span className="font-bold text-amber-700 dark:text-amber-300">{staleCount}명</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Zone 3: Core CTAs & Quick Tools Dropdown */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2 shrink-0">
          {/* C-Level Spotlight Command Palette Trigger (CMD+K) */}
          {onOpenCommandPalette && (
            <button
              onClick={onOpenCommandPalette}
              title="초고속 스포트라이트 검색 (⌘K / Ctrl+K)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-[0.98] shadow-2xs cursor-pointer whitespace-nowrap min-h-[32px]"
            >
              <Search className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span className="hidden md:inline">빠른 검색</span>
              <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono font-bold bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-md text-slate-500 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          )}

          {/* C-Level Voice Debrief 30s Quick CTA */}
          {onOpenVoiceDebrief && (
            <button
              onClick={onOpenVoiceDebrief}
              title="이동 중 30초 음성 회고 AI (Voice Debrief)"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold transition-all active:scale-[0.98] shadow-xs cursor-pointer whitespace-nowrap min-h-[32px]"
            >
              <Mic className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">음성 회고</span>
            </button>
          )}

          {/* C-Level Warm Intro 2.0 Quick CTA */}
          {onOpenWarmIntroPath && (
            <button
              onClick={onOpenWarmIntroPath}
              title="최단 신뢰 소개 경로 파인더 (Warm Intro 2.0)"
              className="hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-[0.98] shadow-2xs cursor-pointer whitespace-nowrap min-h-[32px]"
            >
              <Compass className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>소개 경로</span>
            </button>
          )}

          {/* C-Level Executive Weekly Board Report CTA */}
          {onOpenWeeklyBrief && (
            <button
              onClick={onOpenWeeklyBrief}
              title="C-Level 월요 전략 인텔리전스 1-Page 주간 리포트"
              className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-[0.98] shadow-2xs cursor-pointer whitespace-nowrap min-h-[32px]"
            >
              <BarChart2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>주간 브리프</span>
            </button>
          )}

          {/* Batch Card Scanner CTA */}
          {onOpenBatchCardScanner && (
            <button
              onClick={onOpenBatchCardScanner}
              title="연속 명함 일괄 스캔 & 실시간 DART 결합 (최대 20장)"
              className="hidden xl:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-[0.98] shadow-2xs cursor-pointer whitespace-nowrap min-h-[32px]"
            >
              <UploadCloud className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>명함 일괄</span>
            </button>
          )}

          {/* C-Level Executive Tea-Time Agenda Copilot & .ICS CTA */}
          {onOpenTeaTimeModal && (
            <button
              onClick={() => onOpenTeaTimeModal()}
              title="경영진 티타임 의제 AI 코파일럿 & 원터치 캘린더 초대장 (.ICS)"
              className="hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100/80 dark:bg-amber-950/60 dark:hover:bg-amber-900/60 border border-amber-300/80 dark:border-amber-700/60 text-xs font-bold text-amber-800 dark:text-amber-200 transition-all active:scale-[0.98] shadow-2xs cursor-pointer whitespace-nowrap min-h-[32px]"
            >
              <Coffee className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>티타임 코파일럿</span>
            </button>
          )}

          {/* CSV Export Button Shortcut (GoodPartner Style) */}
          <button
            onClick={handleExportCsv}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-[0.98] shadow-2xs cursor-pointer whitespace-nowrap min-h-[32px]"
            title="엑셀 호환 CSV (UTF-8 with BOM) 다운로드"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>CSV</span>
          </button>

          {/* Daily Intelligence Digest CTA (비일반 회원 전용) */}
          {userRole !== 'general' && (
            <button
              onClick={onOpenDigestModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border border-slate-200/90 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all active:scale-[0.98] shadow-2xs cursor-pointer whitespace-nowrap min-h-[32px]"
              title="오늘의 인맥 지능 다이제스트"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 animate-pulse" />
              <span>다이제스트</span>
              {staleCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
              )}
            </button>
          )}

          {/* Executive NDA Privacy Shield Mode Toggle (비일반 회원 전용) */}
          {userRole !== 'general' && onToggleShield && (
            <button
              onClick={onToggleShield}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-bold transition-all cursor-pointer whitespace-nowrap min-h-[32px] active:scale-[0.98] ${
                isShieldActive
                  ? 'bg-amber-500 hover:bg-amber-450 text-slate-950 border-amber-400 shadow-md ring-2 ring-amber-400/40 animate-pulse'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-800 dark:hover:bg-slate-750 border-slate-200/90 dark:border-slate-700 text-slate-700 dark:text-slate-200 shadow-2xs'
              }`}
              title={isShieldActive ? "VIP 프라이버시 쉴드 해제 (실명/연락처 복원)" : "VIP 대외비 프라이버시 쉴드 활성화 (화면 공유/대중교통 안심 모드)"}
            >
              {isShieldActive ? (
                <>
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-950" />
                  <span>대외비 쉴드 ON</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="hidden sm:inline">대외비 쉴드</span>
                </>
              )}
            </button>
          )}

          {/* Add Person CTA - Premium Dark Slate Pill Button */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-[0.98] transition-all text-xs font-bold text-white shadow-xs cursor-pointer whitespace-nowrap min-h-[32px] border border-slate-800"
            title="새 인맥 직접 등록"
          >
            <UserPlus className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">+ 인맥 등록</span>
            <span className="sm:hidden">등록</span>
          </button>

          {/* Member Role Switcher Dropdown */}
          <div className="relative" ref={roleMenuRef}>
            <button
              onClick={() => setIsRoleMenuOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-1.5 min-h-[32px] rounded-full border text-xs font-bold transition-all whitespace-nowrap active:scale-[0.98] cursor-pointer shadow-2xs hover:shadow-xs ${
                USER_ROLES[userRole].colorScheme.bg
              } ${USER_ROLES[userRole].colorScheme.text} ${USER_ROLES[userRole].colorScheme.border}`}
              title="클릭하여 회원 등급(일반 / Hidden / 마스터) 전환"
            >
              {userRole === 'master' ? (
                <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              ) : userRole === 'hidden' ? (
                <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              ) : (
                <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              )}
              <span className="hidden sm:inline text-[11px] font-semibold opacity-70">등급:</span>
              <span>{USER_ROLES[userRole].badgeLabel}</span>
              <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${isRoleMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isRoleMenuOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 ring-1 ring-black/5 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  회원 등급 및 권한 설정
                </div>
                <div className="space-y-1">
                  {(['general', 'hidden', 'master'] as UserRole[]).map((r) => {
                    const cfg = USER_ROLES[r];
                    const isCurrent = userRole === r;
                    return (
                      <button
                        key={r}
                        onClick={() => {
                          setIsRoleMenuOpen(false);
                          if (onSelectUserRole) onSelectUserRole(r);
                          onShowToast(`회원 등급이 '${cfg.badgeLabel}'으로 전환되었습니다.`);
                        }}
                        className={`w-full text-left p-2.5 rounded-xl text-xs transition-all flex items-start justify-between ${
                          isCurrent
                            ? `${cfg.colorScheme.bg} border ${cfg.colorScheme.border} font-bold`
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 font-bold">
                            {r === 'master' && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                            {r === 'hidden' && <Sparkles className="w-3.5 h-3.5 text-indigo-500" />}
                            {r === 'general' && <Users className="w-3.5 h-3.5 text-emerald-500" />}
                            <span>{cfg.label}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-normal leading-tight">
                            {cfg.description}
                          </p>
                        </div>
                        {isCurrent && <Check className="w-4 h-4 text-emerald-600 shrink-0 ml-1 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>



          {/* Quick Tools Dropdown Menu */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => setIsToolsOpen(prev => !prev)}
              className={`flex items-center justify-center sm:justify-start gap-1 px-2 sm:px-3 py-1.5 sm:py-2 min-h-[32px] min-w-[32px] rounded-xl border text-xs font-semibold transition-all whitespace-nowrap active:scale-[0.98] cursor-pointer ${
                isToolsOpen
                  ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-indigo-500/50 shadow-2xs'
                  : 'bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border-slate-200 dark:border-slate-700/80 shadow-2xs'
              }`}
              title="도구 모음 (분석, 스캔, 암호화, 동기화, 내보내기)"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-300" />
              <span className="hidden sm:inline">도구</span>
              <ChevronDown className={`hidden sm:inline w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Popover - Clean Light Tech & Spatial Glass */}
            {isToolsOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white/95 dark:bg-slate-900/95 border border-slate-200 dark:border-slate-700/80 shadow-2xl backdrop-blur-2xl p-2.5 z-50 space-y-2 ring-1 ring-black/5 dark:ring-white/10 animate-in fade-in zoom-in-95 duration-150">
                {/* Mobile KPI Summary in Popover */}
                <div className="lg:hidden p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800/80 text-xs flex items-center justify-between text-slate-700 dark:text-slate-300">
                  <span>총 <b className="text-slate-900 dark:text-white">{people.length}명</b></span>
                  <span>DART <b className="text-emerald-700 dark:text-emerald-300">{dartFactCount}명</b></span>
                  {staleCount > 0 && <span>미소통 <b className="text-amber-700 dark:text-amber-300">{staleCount}명</b></span>}
                </div>

                {/* Section 1: Executive Analytics */}
                <div>
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    관계 총괄 &amp; 코파일럿
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => { setIsToolsOpen(false); onOpenDashboard(); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <BarChart2 className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                      <span>인맥 포트폴리오 대시보드</span>
                    </button>
                    {onOpenCopilot && (
                      <button
                        onClick={() => { setIsToolsOpen(false); onOpenCopilot(); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <Bot className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>자연어 인맥 코파일럿</span>
                      </button>
                    )}
                    {onOpenCalendarModal && (
                      <button
                        onClick={() => { setIsToolsOpen(false); onOpenCalendarModal(); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        <span>캘린더 미팅 레이더</span>
                      </button>
                    )}
                    {onOpenHeatmap && (
                      <button
                        onClick={() => { setIsToolsOpen(false); onOpenHeatmap(); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <Flame className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                        <span>관계 결속도 &amp; 온도 히트맵</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 2: Intelligence & Collection */}
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    팩트 검증 &amp; 데이터 수집
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => { setIsToolsOpen(false); handleBatchDartCheck(); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>DART 상장공시 일괄 스캔</span>
                    </button>
                    {onOpenCardScanner && (
                      <button
                        onClick={() => { setIsToolsOpen(false); onOpenCardScanner(); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <Camera className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                        <span>명함 1초 OCR 스캔</span>
                      </button>
                    )}
                    {onOpenDisclosureAlertModal && (
                      <button
                        onClick={() => { setIsToolsOpen(false); onOpenDisclosureAlertModal(); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                        <span>DART 공시 변동 실시간 알림</span>
                      </button>
                    )}
                    <button
                      onClick={() => { setIsToolsOpen(false); handleDeviceContacts(); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Smartphone className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                      <span>스마트폰 주소록 직접 연동</span>
                    </button>
                    <button
                      onClick={() => { setIsToolsOpen(false); onOpenImportModal(); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <UploadCloud className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                      <span>CSV/vCard 대량 가져오기</span>
                    </button>
                  </div>
                </div>

                {/* Section 3: Security & Sync */}
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    보안 &amp; 클라우드
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => { setIsToolsOpen(false); onOpenEncryptionModal(); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <span>AES-256 데이터 암호화</span>
                    </button>
                    {onOpenCloudSyncModal && (
                      <button
                        onClick={() => { setIsToolsOpen(false); onOpenCloudSyncModal(); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      >
                        <Cloud className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                        <span>E2EE 클라우드 동기화 볼트</span>
                      </button>
                    )}
                    <button
                      onClick={() => { setIsToolsOpen(false); onOpenSettingsModal(); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <span>내 프로필 및 환경설정</span>
                    </button>
                  </div>
                </div>

                {/* Section 4: Export & Maintenance */}
                <div className="pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="px-2 py-1 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    내보내기 및 데이터 관리
                  </div>
                  {onOpenDataVault && (
                    <button
                      onClick={() => { setIsToolsOpen(false); onOpenDataVault(); }}
                      className="w-full flex items-center justify-between px-2.5 py-2 mb-1 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800/80 transition-colors"
                      title="Excel 호환 BOM CSV 다운로드 & AES-256 암호화 볼트 내보내기/복원"
                    >
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <span>데이터 볼트 (Excel CSV / AES-256)</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-200/60 dark:bg-indigo-800/60 font-bold">VIP</span>
                    </button>
                  )}
                  {onOpenGratitudeSettlement && (
                    <button
                      onClick={() => { setIsToolsOpen(false); onOpenGratitudeSettlement(); }}
                      className="w-full flex items-center justify-between px-2.5 py-2 mb-1.5 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50/80 hover:bg-emerald-100/80 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 border border-emerald-200/80 dark:border-emerald-800/80 transition-colors"
                      title="성사된 비즈니스 딜 추천인 감사 선물 & 리워드 정산 대시보드"
                    >
                      <div className="flex items-center gap-2">
                        <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>추천 감사 리워드 &amp; 딜 답례 정산</span>
                      </div>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-200/60 dark:bg-emerald-800/60 font-bold">감사</span>
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-1.5 pt-1">
                    <button
                      onClick={() => { setIsToolsOpen(false); handleExportVcf(); }}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="스마트폰 주소록 .vcf 파일 다운로드"
                    >
                      <FileDown className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>.vcf 내보내기</span>
                    </button>
                    <button
                      onClick={() => { setIsToolsOpen(false); handleExportCsv(); }}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="UTF-8 with BOM 호환 CSV 다운로드"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>CSV 내보내기</span>
                    </button>
                    <button
                      onClick={() => { setIsToolsOpen(false); exportBackupJson(); }}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="전체 데이터 백업 JSON 다운로드"
                    >
                      <FileDown className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                      <span>백업 JSON</span>
                    </button>
                    <button
                      onClick={() => { setIsToolsOpen(false); fileInputRef.current?.click(); }}
                      className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                      title="백업 JSON 파일 복원"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      <span>JSON 복원</span>
                    </button>
                  </div>
                  <div className="pt-1 mt-1 border-t border-slate-100 dark:border-slate-800/60">
                    <button
                      onClick={() => { setIsToolsOpen(false); handleReset(); }}
                      className="w-full flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 hover:bg-rose-50/50 dark:hover:bg-rose-950/20 transition-colors"
                      title="실제 데이터를 실수로 날리지 않도록 2단계 확인을 거칩니다."
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>샘플 데이터 초기화 (백업 권장)</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Hidden File Input for Restore */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={handleFileRestore}
        />
      </div>
    </header>
  );
};
