import React, { useState, useRef } from 'react';
import { Person } from '../../types/network';
import { 
  downloadCsvWithBom, 
  downloadEncryptedVault, 
  restoreFromEncryptedVault 
} from '../../services/dataVaultService';
import { 
  X, FileSpreadsheet, Lock, Upload, Download, 
  ShieldCheck, AlertCircle, CheckCircle2
} from 'lucide-react';

interface DataVaultModalProps {
  people: Person[];
  onUpdatePeople: (people: Person[]) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const DataVaultModal: React.FC<DataVaultModalProps> = ({
  people,
  onUpdatePeople,
  onClose,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<'csv' | 'vault_export' | 'vault_restore'>('csv');
  
  // 볼트 암호화 백업 상태
  const [exportPassword, setExportPassword] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  // 볼트 복원 상태
  const [restorePassword, setRestorePassword] = useState('');
  const [restoreFileContent, setRestoreFileContent] = useState<string | null>(null);
  const [restoreFileName, setRestoreFileName] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // CSV 다운로드 핸들러
  const handleDownloadCsv = () => {
    try {
      downloadCsvWithBom(people);
      onShowToast(`총 ${people.length}명의 인맥이 Excel 호환 UTF-8 BOM CSV로 다운로드되었습니다.`);
    } catch {
      onShowToast('CSV 생성 중 오류가 발생했습니다.');
    }
  };

  // 암호화 볼트 내보내기 핸들러
  const handleExportVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!exportPassword || exportPassword.length < 6) {
      alert('보안을 위해 6자리 이상의 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setIsExporting(true);
      await downloadEncryptedVault(people, exportPassword);
      onShowToast('AES-256 암호화 볼트 파일(.cwvault)이 다운로드되었습니다.');
      setExportPassword('');
    } catch {
      onShowToast('암호화 백업 파일 생성에 실패했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  // 볼트 파일 선택 핸들러
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setRestoreFileContent(text);
      setRestoreFileName(file.name);
    } catch {
      onShowToast('파일 읽기에 실패했습니다.');
    }
  };

  // 암호화 볼트 복원 실행
  const handleRestoreVault = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restoreFileContent) {
      alert('.cwvault 백업 파일을 먼저 선택해주세요.');
      return;
    }
    if (!restorePassword) {
      alert('백업 생성 시 설정한 비밀번호를 입력해주세요.');
      return;
    }

    try {
      setIsRestoring(true);
      const restored = await restoreFromEncryptedVault(restoreFileContent, restorePassword);
      onUpdatePeople(restored);
      onShowToast(`볼트에서 ${restored.length}명의 인맥 데이터가 완벽히 복원되었습니다.`);
      onClose();
    } catch {
      alert('비밀번호가 올바르지 않거나 파일이 손상되었습니다.');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={e => e.stopPropagation()}
        className="relative w-full max-w-xl bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-slate-900 text-white shadow-2xs">
              <Lock className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">엔터프라이즈 데이터 볼트 &amp; 백업</h2>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono">
                  Data Vault
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Windows Excel 호환 한글 무결점 CSV 및 AES-256 암호화 아카이브 백업을 관리합니다.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('csv')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'csv'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Excel 호환 CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('vault_export')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vault_export'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-indigo-400" />
            <span>암호화 볼트 내보내기</span>
          </button>

          <button
            onClick={() => setActiveTab('vault_restore')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'vault_restore'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-sky-400" />
            <span>볼트 파일 복원</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: CSV Export with BOM */}
          {activeTab === 'csv' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Windows Excel 한글 완벽 호환 (UTF-8 with BOM 보장)</span>
                </div>
                <p className="text-xs text-emerald-800/90 leading-relaxed font-sans">
                  파일 첫 바이트에 <strong className="font-mono bg-emerald-100/80 px-1 rounded">\uFEFF</strong>(Byte Order Mark)를 내장하여, Windows 환경의 Microsoft Excel에서 열람 시 한글이 깨지는 현상을 100% 원천 차단했습니다.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1.5">
                <div className="font-bold text-slate-800">포함되는 데이터 항목:</div>
                <ul className="list-disc list-inside space-y-0.5 text-slate-500 font-mono text-[11px]">
                  <li>성명, 직책, 현재직장, 부서, 휴대전화, 이메일</li>
                  <li>DART 공시 임원 여부, 등기 직책, 확인 일자</li>
                  <li>친밀도, 최근 소통일, 전문분야, 출신학교, 경력, 메모</li>
                </ul>
              </div>

              <button
                onClick={handleDownloadCsv}
                className="w-full py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>총 {people.length}명 Excel 호환 CSV 다운로드</span>
              </button>
            </div>
          )}

          {/* TAB 2: Encrypted Vault Export */}
          {activeTab === 'vault_export' && (
            <form onSubmit={handleExportVault} className="space-y-4">
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                  <Lock className="w-4 h-4 text-indigo-600" />
                  <span>AES-GCM 256비트 군사급 암호화 아카이브 (.cwvault)</span>
                </div>
                <p className="text-xs text-indigo-800/90 leading-relaxed font-sans">
                  설정한 마스터 비밀번호로 데이터를 클라이언트 측에서 즉시 암호화하여 파일로 저장합니다. 비밀번호를 분실할 경우 개발자도 복구할 수 없습니다.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  볼트 암호화 비밀번호 설정 (6자 이상)
                </label>
                <input
                  type="password"
                  value={exportPassword}
                  onChange={e => setExportPassword(e.target.value)}
                  placeholder="강력한 비밀번호를 입력하세요"
                  required
                  minLength={6}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <button
                type="submit"
                disabled={isExporting}
                className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <Lock className="w-4 h-4 text-indigo-300" />
                <span>{isExporting ? '암호화 아카이빙 중...' : '암호화 볼트 (.cwvault) 다운로드'}</span>
              </button>
            </form>
          )}

          {/* TAB 3: Encrypted Vault Restore */}
          {activeTab === 'vault_restore' && (
            <form onSubmit={handleRestoreVault} className="space-y-4">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>데이터 복원 시 주의사항</span>
                </div>
                <p className="text-xs text-amber-800 leading-relaxed">
                  볼트 파일을 복원하면 현재 로컬에 저장된 인맥 데이터가 볼트 파일의 데이터로 안전하게 교체됩니다.
                </p>
              </div>

              {/* File Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  .cwvault 파일 선택
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".cwvault,.json"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-slate-400 bg-slate-50 text-xs text-slate-600 font-semibold flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Upload className="w-4 h-4 text-slate-500" />
                  <span>{restoreFileName ? restoreFileName : '컴퓨터에서 .cwvault 파일 선택'}</span>
                </button>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  백업 생성 시 설정한 비밀번호
                </label>
                <input
                  type="password"
                  value={restorePassword}
                  onChange={e => setRestorePassword(e.target.value)}
                  placeholder="비밀번호를 입력하세요"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-sans text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <button
                type="submit"
                disabled={isRestoring || !restoreFileContent}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center justify-center gap-2 active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isRestoring ? '복호화 복원 중...' : '데이터 볼트 완벽 복원하기'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0 text-xs text-slate-500">
          <span>모든 암호화 연산은 브라우저 내부에서 단독 수행됩니다.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
