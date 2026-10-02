import React, { useState, useEffect } from 'react';
import { Person } from '../../types/network';
import { 
  downloadCsvWithBom, 
  downloadEncryptedVault, 
  restoreFromEncryptedVault 
} from '../../services/dataVaultService';
import { 
  encryptData, 
  decryptData 
} from '../../services/cryptoStorage';
import { 
  pushEncryptedBackupToCloud, 
  pullEncryptedBackupFromCloud 
} from '../../services/cloudSyncService';
import { checkSupabaseConnection } from '../../services/supabaseClient';
import { offlineSyncService, OfflineSyncState } from '../../services/offlineSyncService';
import { 
  X, Database, Lock, Cloud, Download, Upload, ShieldCheck, 
  KeyRound, RefreshCw, Plane, Eye, EyeOff
} from 'lucide-react';

export interface DataVaultSecurityStudioProps {
  isOpen: boolean;
  initialTab?: 'vault' | 'crypto' | 'sync';
  people: Person[];
  onUpdatePeople: (people: Person[]) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const DataVaultSecurityStudio: React.FC<DataVaultSecurityStudioProps> = ({
  isOpen,
  initialTab = 'vault',
  people,
  onUpdatePeople,
  onClose,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'vault' | 'crypto' | 'sync'>(initialTab);

  // --- TAB 1: 데이터 볼트 (CSV/암호화 백업) 상태 ---
  const [vaultPassword, setVaultPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePassword, setRestorePassword] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);

  // --- TAB 2: 암호화 마스터 키 상태 ---
  const [isCryptoSet, setIsCryptoSet] = useState(() => 
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined' 
      ? Boolean(window.localStorage.getItem('connectwe_encrypted')) 
      : false
  );
  const [newMasterPassword, setNewMasterPassword] = useState('');
  const [confirmMasterPassword, setConfirmMasterPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // --- TAB 3: 클라우드 & 오프라인 동기화 상태 ---
  const [isSupabaseConnected, setIsSupabaseConnected] = useState<boolean | null>(null);
  const [isSyncingCloud, setIsSyncingCloud] = useState(false);
  const [cloudPassword, setCloudPassword] = useState('');
  const [offlineState, setOfflineState] = useState<OfflineSyncState>(offlineSyncService.getState());

  useEffect(() => {
    if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
      setIsCryptoSet(Boolean(window.localStorage.getItem('connectwe_encrypted')));
    }
  }, [isOpen]);

  useEffect(() => {
    return offlineSyncService.subscribe(setOfflineState);
  }, []);

  // Supabase 연결 상태 확인
  useEffect(() => {
    if (activeTab === 'sync') {
      checkSupabaseConnection().then(res => setIsSupabaseConnected(res.connected));
    }
  }, [activeTab]);

  // ESC 키 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // CSV BOM 다운로드
  const handleExportCsv = () => {
    downloadCsvWithBom(people);
    onShowToast(`총 ${people.length}명의 인맥이 엑셀 호환 CSV (UTF-8 with BOM)로 안전하게 다운로드되었습니다.`);
  };

  // AES-256 암호화 볼트 다운로드
  const handleExportEncryptedVault = async () => {
    if (!vaultPassword.trim() || vaultPassword.length < 6) {
      alert('보안 강화를 위해 6자 이상의 비밀번호를 입력해 주세요.');
      return;
    }
    setIsExporting(true);
    try {
      await downloadEncryptedVault(people, vaultPassword.trim());
      setVaultPassword('');
      onShowToast('AES-256 암호화 볼트 파일(.cwvault)이 성공적으로 생성되어 다운로드되었습니다.');
    } catch {
      onShowToast('암호화 볼트 생성 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  // 암호화 볼트 복원
  const handleRestoreVault = async () => {
    if (!restoreFile || !restorePassword.trim()) {
      alert('복원할 .cwvault 볼트 파일과 복호화 비밀번호를 입력해 주세요.');
      return;
    }
    setIsRestoring(true);
    try {
      const text = await restoreFile.text();
      const restored = await restoreFromEncryptedVault(text, restorePassword.trim());
      onUpdatePeople(restored);
      onShowToast(`보안 볼트 복원 성공: 총 ${restored.length}명의 인맥 데이터가 안전하게 복구되었습니다.`);
      setRestoreFile(null);
      setRestorePassword('');
    } catch {
      alert('복원 실패: 비밀번호가 일치하지 않거나 파일이 손상되었습니다.');
    } finally {
      setIsRestoring(false);
    }
  };

  // 마스터 암호화 키 설정
  const handleSaveMasterKey = async () => {
    if (newMasterPassword.length < 8) {
      alert('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (newMasterPassword !== confirmMasterPassword) {
      alert('비밀번호 확인이 일치하지 않습니다.');
      return;
    }
    try {
      const raw = localStorage.getItem('connectwe_people_v1') ?? localStorage.getItem('connectwe_people') ?? '[]';
      const encrypted = await encryptData(raw, newMasterPassword);
      localStorage.setItem('connectwe_people_enc', encrypted);
      localStorage.setItem('connectwe_encrypted', '1');
      localStorage.removeItem('connectwe_people_v1');
      localStorage.removeItem('connectwe_people');
      setIsCryptoSet(true);
      setNewMasterPassword('');
      setConfirmMasterPassword('');
      onShowToast('AES-256-GCM 마스터 암호화 키가 안전하게 등록되었습니다.');
    } catch {
      alert('암호화 처리 중 오류가 발생했습니다.');
    }
  };

  // 마스터 암호화 키 해제
  const handleResetMasterKey = async () => {
    const pw = prompt('암호화를 해제하려면 현재 비밀번호를 입력해 주세요:');
    if (!pw) return;
    try {
      const enc = localStorage.getItem('connectwe_people_enc');
      if (!enc) {
        localStorage.removeItem('connectwe_encrypted');
        setIsCryptoSet(false);
        return;
      }
      const decrypted = await decryptData(enc, pw);
      localStorage.setItem('connectwe_people_v1', decrypted);
      localStorage.removeItem('connectwe_people_enc');
      localStorage.removeItem('connectwe_encrypted');
      setIsCryptoSet(false);
      onShowToast('마스터 암호화가 안전하게 해제되었습니다.');
    } catch {
      alert('비밀번호가 일치하지 않거나 복호화에 실패했습니다.');
    }
  };

  // 클라우드 백업 푸시
  const handlePushCloud = async () => {
    if (!cloudPassword.trim() || cloudPassword.length < 6) {
      alert('클라우드 업로드를 위해 6자 이상의 암호화 비밀번호를 입력해 주세요.');
      return;
    }
    setIsSyncingCloud(true);
    try {
      const res = await pushEncryptedBackupToCloud(people, cloudPassword.trim());
      if (res.success) {
        onShowToast('Supabase PostgreSQL E2EE 클라우드로 안전하게 암호화 업로드되었습니다.');
      } else {
        alert(res.message);
      }
    } catch {
      onShowToast('클라우드 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // 클라우드 백업 풀
  const handlePullCloud = async () => {
    if (!cloudPassword.trim()) {
      alert('클라우드 복원을 위해 복호화 비밀번호를 입력해 주세요.');
      return;
    }
    setIsSyncingCloud(true);
    try {
      const res = await pullEncryptedBackupFromCloud(cloudPassword.trim());
      if (res.success && res.people) {
        onUpdatePeople(res.people);
        onShowToast(`클라우드에서 ${res.people.length}명의 인맥 데이터가 성공적으로 복원되었습니다.`);
      } else {
        alert(res.message);
      }
    } catch {
      onShowToast('클라우드 복원 중 오류가 발생했습니다.');
    } finally {
      setIsSyncingCloud(false);
    }
  };

  // 오프라인 수동 동기화
  const handleOfflineSyncNow = async () => {
    const res = await offlineSyncService.syncNow();
    if (res.success) {
      onShowToast(`오프라인 대기 항목 ${res.syncedCount}건이 클라우드에 성공적으로 반영되었습니다.`);
    } else {
      onShowToast('오프라인 동기화에 실패했습니다.');
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Studio Top Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">
                  보안 &amp; 데이터 볼트 센터 (Data Vault &amp; Security Studio)
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  AES-256-GCM &amp; E2EE
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Zero-Knowledge 로컬 암호화, 엑셀 BOM 호환 CSV 백업, Supabase 클라우드 및 비행기 오프라인 안심 동기화를 통합 관리합니다.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sub Header Navigation Tabs */}
        <div className="px-4 sm:px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setActiveTab('vault')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'vault'
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Download className="w-3.5 h-3.5 text-indigo-400" />
              <span>CSV &amp; 암호화 볼트 백업/복원</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('crypto')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'crypto'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>AES-256 마스터 보안 키</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('sync')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'sync'
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Cloud className="w-3.5 h-3.5" />
              <span>클라우드 &amp; 오프라인 동기화</span>
              {offlineState.pendingCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-white text-[10px]">
                  {offlineState.pendingCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>기기 로컬에서만 복호화 (Zero-Knowledge)</span>
          </div>
        </div>

        {/* Modal Main Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* TAB 1: CSV & 암호화 볼트 백업/복원 */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              {/* Option A: Excel BOM CSV Export */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-slate-900">엑셀 호환 CSV (UTF-8 with BOM) 다운로드</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Microsoft Excel 등에서 한글 깨짐 없이 즉시 열람 가능한 최상단 BOM(\uFEFF) 삽입 표준 CSV 포맷입니다. (총 {people.length}명)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-slate-800 font-bold text-xs shadow-2xs whitespace-nowrap cursor-pointer active:scale-95 transition-all"
                >
                  CSV 내보내기 ({people.length}명)
                </button>
              </div>

              {/* Option B: AES-256 Encrypted Vault (.cwe) Export & Import */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Export Encrypted */}
                <div className="p-5 rounded-2xl border border-indigo-150 bg-indigo-50/30 space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900">AES-256 엔터프라이즈 암호화 볼트 백업 (.cwe)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    인맥 정보, 미팅 이력, DART 데이터를 비밀번호로 암호화하여 파일로 안전하게 보관합니다.
                  </p>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">암호화 비밀번호 설정</label>
                    <input 
                      type="password" 
                      value={vaultPassword}
                      onChange={e => setVaultPassword(e.target.value)}
                      placeholder="최소 6자 이상"
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={isExporting || !vaultPassword.trim()}
                    onClick={handleExportEncryptedVault}
                    className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{isExporting ? '암호화 중...' : '암호화 볼트 파일 생성'}</span>
                  </button>
                </div>

                {/* Restore Encrypted */}
                <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Upload className="w-4 h-4 text-purple-600" />
                    <span className="font-bold text-slate-900">암호화 볼트 복원 (.cwe 파일 열기)</span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    이전에 백업해 둔 .cwe 파일을 선택하고 비밀번호를 입력하여 데이터를 복원합니다.
                  </p>
                  <input 
                    type="file" 
                    accept=".cwe,.json"
                    onChange={e => setRestoreFile(e.target.files?.[0] || null)}
                    className="w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2.5 file:rounded-lg file:border-0 file:text-xs file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                  />
                  <input 
                    type="password" 
                    value={restorePassword}
                    onChange={e => setRestorePassword(e.target.value)}
                    placeholder="복호화 비밀번호 입력"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    disabled={isRestoring || !restoreFile || !restorePassword.trim()}
                    onClick={handleRestoreVault}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                    <span>{isRestoring ? '복호화 복원 중...' : '볼트 복원 실행'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: AES-256 마스터 보안 키 */}
          {activeTab === 'crypto' && (
            <div className="max-w-md mx-auto space-y-4 text-xs">
              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1.5">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-950">
                    현재 상태: {isCryptoSet ? '마스터 암호화 키 활성화됨' : '기본 디바이스 암호화 운용 중'}
                  </span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  PBKDF2 100,000회 키 스트레칭 및 동적 무작위 Salt/IV가 적용된 AES-256-GCM 하드닝으로 레인보우 테이블 공격을 원천 차단합니다.
                </p>
              </div>

              <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
                <span className="font-bold text-slate-900 block">
                  {isCryptoSet ? '마스터 비밀번호 변경' : '신규 마스터 비밀번호 등록'}
                </span>
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">새 마스터 비밀번호</label>
                  <div className="relative">
                    <input 
                      type={showPassword ? 'text' : 'password'}
                      value={newMasterPassword}
                      onChange={e => setNewMasterPassword(e.target.value)}
                      placeholder="최소 6자 이상"
                      className="w-full px-3 py-2 pr-9 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(prev => !prev)}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">비밀번호 확인</label>
                  <input 
                    type={showPassword ? 'text' : 'password'}
                    value={confirmMasterPassword}
                    onChange={e => setConfirmMasterPassword(e.target.value)}
                    placeholder="다시 한번 입력"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-2 flex gap-2">
                  {isCryptoSet && (
                    <button
                      type="button"
                      onClick={handleResetMasterKey}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold cursor-pointer"
                    >
                      키 초기화
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleSaveMasterKey}
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>마스터 키 저장</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: 클라우드 & 오프라인 동기화 */}
          {activeTab === 'sync' && (
            <div className="space-y-6 text-xs">
              {/* Online / Offline Status Banner */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between gap-3 ${
                offlineState.isOnline 
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' 
                  : 'bg-amber-50/60 border-amber-300 text-amber-950'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    offlineState.isOnline ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {offlineState.isOnline ? <Cloud className="w-4 h-4" /> : <Plane className="w-4 h-4" />}
                  </div>
                  <div>
                    <span className="font-bold block">
                      {offlineState.isOnline ? '🟢 클라우드 실시간 연동 활성화' : '✈️ 비행기 / 오프라인 안심 모드 작동 중'}
                    </span>
                    <span className="text-[11px] opacity-80">
                      {offlineState.isOnline 
                        ? '모든 데이터가 AES-256 로컬 암호화 볼트와 클라우드에 안전하게 보관되고 있습니다.' 
                        : '기내에서도 모든 인맥 조회 및 메모 작성이 100% 안전하게 동작하며, 복구 시 자동 동기화됩니다.'}
                    </span>
                  </div>
                </div>

                {offlineState.isOnline && offlineState.pendingCount > 0 && (
                  <button
                    type="button"
                    onClick={handleOfflineSyncNow}
                    disabled={offlineState.isSyncing}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-2xs whitespace-nowrap"
                  >
                    <RefreshCw className={`w-3 h-3 ${offlineState.isSyncing ? 'animate-spin' : ''}`} />
                    <span>대기 {offlineState.pendingCount}건 지금 동기화</span>
                  </button>
                )}
              </div>

              {/* Supabase PostgreSQL Status */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-slate-900">Supabase PostgreSQL E2EE 원격 연동 상태</span>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    isSupabaseConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {isSupabaseConnected === null ? '연결 확인 중...' : isSupabaseConnected ? 'Connected (정상)' : 'Local Offline Only'}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-600 block">클라우드 암호화 백업 비밀번호</label>
                  <input 
                    type="password" 
                    value={cloudPassword}
                    onChange={e => setCloudPassword(e.target.value)}
                    placeholder="최소 6자 이상"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono text-xs focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={isSyncingCloud || !cloudPassword.trim()}
                    onClick={handlePushCloud}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isSyncingCloud ? '동기화 중...' : '클라우드로 암호화 업로드'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isSyncingCloud || !cloudPassword.trim()}
                    onClick={handlePullCloud}
                    className="flex-1 py-2 rounded-xl bg-white hover:bg-slate-50 disabled:bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs active:scale-95"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>클라우드에서 복원</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
