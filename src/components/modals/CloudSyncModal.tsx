import React, { useState, useEffect } from 'react';
import { Person } from '../../types/network';
import { 
  CloudVaultPayload, 
  SyncStatus, 
  aggregateLocalVault, 
  uploadEncryptedVaultToCloud, 
  downloadAndRestoreVault, 
  loadSyncMeta 
} from '../../services/cloudSyncService';
import { checkSupabaseConnection } from '../../services/supabaseClient';
import { 
  X, Cloud, ShieldCheck, KeyRound, 
  RefreshCw, Check, AlertCircle, ArrowUpCircle, ArrowDownCircle, Eye, EyeOff
} from 'lucide-react';

interface CloudSyncModalProps {
  people: Person[];
  onClose: () => void;
  onRestoreSuccess: (payload: CloudVaultPayload) => void;
  onShowToast: (msg: string) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  people,
  onClose,
  onRestoreSuccess,
  onShowToast
}) => {
  const [syncMeta, setSyncMeta] = useState<SyncStatus>(() => loadSyncMeta());
  const [passphrase, setPassphrase] = useState('');
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [connectionCheck, setConnectionCheck] = useState<{ checked: boolean; connected: boolean; latency: number }>({
    checked: false,
    connected: false,
    latency: 0
  });

  // Supabase 실시간 연결 상태 점검
  useEffect(() => {
    checkSupabaseConnection().then(res => {
      setConnectionCheck({
        checked: true,
        connected: res.connected,
        latency: res.latencyMs
      });
    });
  }, []);

  // 암호화 백업 실행
  const handleBackup = async () => {
    if (!passphrase || passphrase.length < 4) {
      setStatusMessage({ text: '보안을 위해 최소 4자 이상의 마스터 비밀번호를 입력해 주세요.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ text: 'AES-256 GCM 암호화 및 클라우드 업로드 중...', type: 'info' });

    try {
      const payload = aggregateLocalVault(people);
      const result = await uploadEncryptedVaultToCloud(payload, passphrase);

      if (result.success) {
        setStatusMessage({ text: result.message, type: 'success' });
        setSyncMeta(loadSyncMeta());
        onShowToast('클라우드 암호화 백업이 완료되었습니다.');
      } else {
        setStatusMessage({ text: result.message, type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 클라우드 복원 실행
  const handleRestore = async () => {
    if (!passphrase) {
      setStatusMessage({ text: '복호화를 위한 마스터 비밀번호를 입력해 주세요.', type: 'error' });
      return;
    }

    setIsLoading(true);
    setStatusMessage({ text: '클라우드 금고 조회 및 복호화 검증 중...', type: 'info' });

    try {
      const result = await downloadAndRestoreVault(passphrase);

      if (result.success && result.payload) {
        setStatusMessage({ text: result.message, type: 'success' });
        onRestoreSuccess(result.payload);
        onShowToast('클라우드 금고에서 성공적으로 복원되었습니다.');
      } else {
        setStatusMessage({ text: result.message, type: 'error' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-white border border-slate-200/90 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-sky-50/60 via-white to-blue-50/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-sky-600/10 border border-sky-500/20 flex items-center justify-center text-sky-700 shadow-2xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  Supabase 엔터프라이즈 클라우드 금고
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-100/80 text-sky-800 border border-sky-200">
                  Zero-Knowledge
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                대표님의 인맥 데이터를 256비트로 암호화하여 안전하게 백업 및 동기화합니다.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {/* Status Box */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>종단간 암호화 규격:</span>
              </div>
              <span className="font-mono font-bold text-slate-900">PBKDF2 + AES-256 GCM</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-600">
                <RefreshCw className="w-4 h-4 text-blue-600" />
                <span>클라우드 서버 상태:</span>
              </div>
              <span className="flex items-center gap-1.5 font-medium">
                {connectionCheck.checked ? (
                  connectionCheck.connected ? (
                    <span className="text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span> 정상 연결 ({connectionCheck.latency}ms)
                    </span>
                  ) : (
                    <span className="text-amber-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span> 로컬 안전 볼트 모드
                    </span>
                  )
                ) : (
                  <span className="text-slate-400">연결 확인 중...</span>
                )}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
              <span className="text-slate-500">최종 백업 일시:</span>
              <span className="text-slate-700 font-mono">
                {syncMeta.lastSyncAt ? new Date(syncMeta.lastSyncAt).toLocaleString('ko-KR') : '아직 백업 이력 없음'}
              </span>
            </div>
          </div>

          {/* Passphrase Input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-blue-600" />
              마스터 암호화 비밀번호 (Master Passphrase)
            </label>
            <div className="relative">
              <input 
                type={showPassphrase ? 'text' : 'password'}
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder="비밀번호를 입력하세요 (다른 기기 복원 시 필요)"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassphrase(!showPassphrase)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              * 영지식(Zero-Knowledge) 원칙에 따라 서버 관리자도 복호화할 수 없으므로, 비밀번호를 분실하지 않도록 유의하세요.
            </p>
          </div>

          {/* Status Message Alert */}
          {statusMessage && (
            <div className={`p-3.5 rounded-2xl text-xs leading-relaxed flex items-start gap-2.5 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                : statusMessage.type === 'error'
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}>
              {statusMessage.type === 'success' && <Check className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 animate-spin" />}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handleBackup}
              disabled={isLoading}
              className="px-4 py-3 rounded-2xl text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white shadow-2xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ArrowUpCircle className="w-4 h-4" />
              <span>지금 암호화 백업</span>
            </button>
            <button
              onClick={handleRestore}
              disabled={isLoading}
              className="px-4 py-3 rounded-2xl text-xs font-bold bg-white hover:bg-slate-50 text-slate-800 border border-slate-200/90 shadow-2xs transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ArrowDownCircle className="w-4 h-4 text-slate-600" />
              <span>클라우드에서 복원</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="text-[11px] text-slate-500 font-mono">
            인맥 {people.length}명 • 로컬 안전 보관
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-all"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
