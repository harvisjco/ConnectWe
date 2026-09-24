import React, { useRef, useState, useEffect } from 'react';
import { Person } from '../../types/network';
import { exportPeopleToVcf } from '../../services/vcardExporter';
import { exportBackupJson, restoreBackupFromJson, resetStorage } from '../../services/storageService';
import { batchCrossCheckWithDart } from '../../services/dartFactEngine';
import { pickContactsFromDevice } from '../../services/contactPicker';
import { 
  Share2, UploadCloud, Download, ShieldCheck, Clock, 
  Users, UserPlus, FileDown, RotateCcw, Sparkles, Smartphone,
  BarChart2, Lock, Settings, Cloud, Bot, Camera, Calendar, Bell,
  MoreHorizontal, ChevronDown
} from 'lucide-react';

interface HeaderProps {
  people: Person[];
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
  onUpdatePeople: (people: Person[]) => void;
  onShowToast: (msg: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  people, 
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
  onUpdatePeople,
  onShowToast
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const toolsMenuRef = useRef<HTMLDivElement | null>(null);
  const [isToolsOpen, setIsToolsOpen] = useState(false);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (toolsMenuRef.current && !toolsMenuRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    if (isToolsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isToolsOpen]);

  const dartFactCount = people.filter(p => p.sourceType === 'DART_FACT' || p.dartInfo?.isPublicDirector).length;
  const staleCount = people.filter(p => p.isStale).length;

  // CSV 다운로드 (BOM \uFEFF 필수 적용 + PII 마스킹 옵션)
  const handleExportCsv = () => {
    const isMaskPii = localStorage.getItem('connectwe_mask_pii') === 'true';

    const maskMobile = (tel: string) => {
      if (!isMaskPii) return tel;
      return tel.replace(/^(\d{2,3})-(\d{3,4})-(\d{4})$/, '$1-****-$3');
    };

    const headers = ['이름', '현재회사', '현재직함', '소속부서', '휴대전화', '이메일', '출처구분', '추정나이대', 'DART상장공시', '소통단절여부', '메모'];
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

  // 초기 상태 리셋
  const handleReset = () => {
    if (confirm('로컬에 저장된 인맥 데이터를 초기 시드 상태로 리셋하시겠습니까?')) {
      const initial = resetStorage();
      onUpdatePeople(initial);
      onShowToast('인맥 데이터가 기본 시드 상태로 초기화되었습니다.');
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
    <header className="border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-xl sticky top-0 z-40 px-4 sm:px-6 py-3 shadow-[0_4px_24px_rgba(0,0,0,0.35)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Zone 1: Brand & Slogan */}
        <div className="flex items-center justify-between md:justify-start gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center shadow-[0_4px_14px_rgba(79,70,229,0.35),inset_0_1px_0_rgba(255,255,255,0.3)] ring-1 ring-white/20 shrink-0">
              <Share2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent whitespace-nowrap">
                  ConnectWe
                </h1>
                <span className="hidden sm:inline-block text-[11px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold tracking-wide shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] whitespace-nowrap">
                  Production-Ready
                </span>
                <button
                  onClick={onOpenCloudSyncModal}
                  title="Supabase PostgreSQL E2EE Cloud Live 연동 중"
                  className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-medium hover:bg-emerald-500/20 transition-all cursor-pointer shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] whitespace-nowrap active:scale-95"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Supabase Live</span>
                </button>
              </div>
              <p className="hidden sm:block text-[11px] text-slate-400 whitespace-nowrap truncate max-w-xs md:max-w-none">
                리멤버 · 스마트폰 주소록 · DART 8,500+ 상장사 실공시 팩트 융합 인맥 허브
              </p>
            </div>
          </div>
        </div>

        {/* Zone 2: Executive Metric Capsule (Desktop & Tablet) - Neo-Tactile Debossed Track */}
        <div className="hidden lg:flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-950/80 border border-slate-800/70 text-xs shadow-[inset_0_2px_4px_rgba(0,0,0,0.6),0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-white/5 whitespace-nowrap">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">총 인맥</span>
            <span className="font-bold text-white">{people.length}명</span>
          </div>
          <span className="text-slate-600">·</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-medium">DART FACT</span>
            <span className="font-bold text-emerald-300">{dartFactCount}명</span>
          </div>
          {staleCount > 0 && (
            <>
              <span className="text-slate-600">·</span>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-amber-400 font-medium">미소통</span>
                <span className="font-bold text-amber-300">{staleCount}명</span>
              </div>
            </>
          )}
        </div>

        {/* Zone 3: Core CTAs & Quick Tools Dropdown */}
        <div className="flex items-center justify-end gap-2 shrink-0">
          {/* Daily Intelligence Digest CTA */}
          <button
            onClick={onOpenDigestModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-b from-indigo-950/90 to-purple-950/90 border border-indigo-500/40 hover:border-indigo-400 text-xs font-semibold text-indigo-200 hover:text-white transition-all active:scale-[0.98] shadow-[0_4px_12px_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.15)] ring-1 ring-white/5 whitespace-nowrap"
            title="오늘의 인맥 지능 다이제스트"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span>다이제스트</span>
            {staleCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-pink-500" />
            )}
          </button>

          {/* Add Person CTA - Tactile Floating Pill */}
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-b from-indigo-500 to-indigo-600 hover:from-indigo-400 hover:to-indigo-500 active:scale-[0.98] transition-all text-xs font-semibold text-white shadow-[0_4px_14px_rgba(79,70,229,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] border-t border-white/20 ring-1 ring-white/10 whitespace-nowrap"
            title="새 인맥 직접 등록"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>+ 인맥 등록</span>
          </button>

          {/* Quick Tools Dropdown Menu */}
          <div className="relative" ref={toolsMenuRef}>
            <button
              onClick={() => setIsToolsOpen(prev => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all whitespace-nowrap active:scale-[0.98] ${
                isToolsOpen
                  ? 'bg-slate-800 text-white border-indigo-500/50 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] ring-1 ring-indigo-500/30'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-white border-slate-700/80 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)] ring-1 ring-white/5'
              }`}
              title="도구 모음 (분석, 스캔, 암호화, 동기화, 내보내기)"
            >
              <MoreHorizontal className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">도구 모음</span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isToolsOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu Popover - visionOS Spatial Glass */}
            {isToolsOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-slate-900/95 border border-slate-700/80 shadow-[0_20px_50px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-2xl p-2 z-50 space-y-2 ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-150">
                {/* Mobile KPI Summary in Popover */}
                <div className="lg:hidden p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)] text-xs flex items-center justify-between text-slate-300">
                  <span>총 <b className="text-white">{people.length}명</b></span>
                  <span>DART <b className="text-emerald-300">{dartFactCount}명</b></span>
                  {staleCount > 0 && <span>미소통 <b className="text-amber-300">{staleCount}명</b></span>}
                </div>

                {/* Section 1: Executive Analytics */}
                <div>
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    경영 사령탑 & 코파일럿
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => { setIsToolsOpen(false); onOpenDashboard(); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <BarChart2 className="w-4 h-4 text-purple-400" />
                      <span>인맥 포트폴리오 대시보드</span>
                    </button>
                    {onOpenCopilot && (
                      <button
                        onClick={() => { setIsToolsOpen(false); onOpenCopilot(); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Bot className="w-4 h-4 text-indigo-400" />
                        <span>자연어 인맥 코파일럿</span>
                      </button>
                    )}
                    {onOpenCalendarModal && (
                      <button
                        onClick={() => { setIsToolsOpen(false); onOpenCalendarModal(); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-sky-400" />
                        <span>캘린더 미팅 레이더</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 2: Intelligence & Collection */}
                <div className="pt-1 border-t border-slate-800">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    팩트 검증 & 데이터 수집
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => { setIsToolsOpen(false); handleBatchDartCheck(); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>DART 상장공시 일괄 스캔</span>
                    </button>
                    {onOpenCardScanner && (
                      <button
                        onClick={() => { setIsToolsOpen(false); onOpenCardScanner(); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Camera className="w-4 h-4 text-teal-400" />
                        <span>명함 1초 OCR 스캔</span>
                      </button>
                    )}
                    {onOpenDisclosureAlertModal && (
                      <button
                        onClick={() => { setIsToolsOpen(false); onOpenDisclosureAlertModal(); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Bell className="w-4 h-4 text-amber-400" />
                        <span>DART 공시 변동 실시간 알림</span>
                      </button>
                    )}
                    <button
                      onClick={() => { setIsToolsOpen(false); handleDeviceContacts(); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Smartphone className="w-4 h-4 text-sky-400" />
                      <span>스마트폰 주소록 직접 연동</span>
                    </button>
                    <button
                      onClick={() => { setIsToolsOpen(false); onOpenImportModal(); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <UploadCloud className="w-4 h-4 text-slate-400" />
                      <span>CSV/vCard 대량 가져오기</span>
                    </button>
                  </div>
                </div>

                {/* Section 3: Security & Sync */}
                <div className="pt-1 border-t border-slate-800">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    보안 & 클라우드
                  </div>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => { setIsToolsOpen(false); onOpenEncryptionModal(); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Lock className="w-4 h-4 text-amber-400" />
                      <span>AES-256 데이터 암호화</span>
                    </button>
                    {onOpenCloudSyncModal && (
                      <button
                        onClick={() => { setIsToolsOpen(false); onOpenCloudSyncModal(); }}
                        className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                      >
                        <Cloud className="w-4 h-4 text-sky-400" />
                        <span>E2EE 클라우드 동기화 볼트</span>
                      </button>
                    )}
                    <button
                      onClick={() => { setIsToolsOpen(false); onOpenSettingsModal(); }}
                      className="w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
                    >
                      <Settings className="w-4 h-4 text-indigo-400" />
                      <span>내 프로필 및 환경설정</span>
                    </button>
                  </div>
                </div>

                {/* Section 4: Export & Maintenance */}
                <div className="pt-1 border-t border-slate-800">
                  <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    내보내기 및 데이터 관리
                  </div>
                  <div className="grid grid-cols-2 gap-1 pt-1">
                    <button
                      onClick={() => { setIsToolsOpen(false); handleExportVcf(); }}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      title="스마트폰 주소록 .vcf 파일 다운로드"
                    >
                      <FileDown className="w-3.5 h-3.5 text-indigo-400" />
                      <span>.vcf 내보내기</span>
                    </button>
                    <button
                      onClick={() => { setIsToolsOpen(false); handleExportCsv(); }}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      title="UTF-8 with BOM 호환 CSV 다운로드"
                    >
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>CSV 내보내기</span>
                    </button>
                    <button
                      onClick={() => { setIsToolsOpen(false); exportBackupJson(); }}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      title="전체 데이터 백업 JSON 다운로드"
                    >
                      <FileDown className="w-3.5 h-3.5 text-sky-400" />
                      <span>백업 JSON</span>
                    </button>
                    <button
                      onClick={() => { setIsToolsOpen(false); fileInputRef.current?.click(); }}
                      className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                      title="백업 JSON 파일 복원"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                      <span>JSON 복원</span>
                    </button>
                  </div>
                  <div className="pt-1 mt-1 border-t border-slate-800/60">
                    <button
                      onClick={() => { setIsToolsOpen(false); handleReset(); }}
                      className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-950/30 hover:text-rose-300 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>기본 시드 상태 리셋</span>
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
