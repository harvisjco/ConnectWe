import React, { useState } from 'react';
import { Person } from '../../types/network';
import { 
  getCloudSyncConfig, 
  pushEncryptedBackupToCloud, 
  pullEncryptedBackupFromCloud 
} from '../../services/cloudSyncService';
import { 
  Cloud, Lock, ShieldCheck, 
  UploadCloud, DownloadCloud, X, CheckCircle2
} from 'lucide-react';

interface CloudSyncModalProps {
  people: Person[];
  onUpdatePeople: (people: Person[]) => void;
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  people,
  onUpdatePeople,
  onClose,
  onShowToast
}) => {
  const [config, setConfig] = useState(() => getCloudSyncConfig());
  const [passphrase, setPassphrase] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // E2EE 백업 전송
  const handlePushSync = async () => {
    setIsSyncing(true);
    setStatusMessage('브라우저에서 인맥 데이터를 AES-256 E2EE 암호화 중...');

    const res = await pushEncryptedBackupToCloud(people, passphrase || undefined);
    setIsSyncing(false);
    setStatusMessage(res.message);

    if (res.success) {
      setConfig(getCloudSyncConfig());
      onShowToast('✅ 클라우드 볼트에 암호화 백업이 완료되었습니다.');
    }
  };

  // E2EE 백업 복원
  const handlePullRestore = async () => {
    if (!confirm('클라우드 볼트의 암호화 데이터로 현재 인맥을 복원하시겠습니까?')) return;

    setIsSyncing(true);
    setStatusMessage('클라우드 볼트에서 데이터를 다운로드하여 복호화 중...');

    const res = await pullEncryptedBackupFromCloud(passphrase || undefined);
    setIsSyncing(false);
    setStatusMessage(res.message);

    if (res.success && res.people) {
      onUpdatePeople(res.people);
      onShowToast(res.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-800/50 text-indigo-600 dark:text-indigo-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                E2EE 클라우드 동기화 볼트 (Multi-device Sync)
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">기기 간 안전한 실시간 암호화 동기화</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-xs text-slate-600 dark:text-slate-300">
          
          {/* Security Banner */}
          <div className="p-4.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-500/30 space-y-2">
            <div className="flex items-center gap-2 text-indigo-950 dark:text-indigo-300 font-bold text-xs">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <span>Zero-Knowledge 종단간 암호화(E2EE) 아키텍처</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
              사용자의 연락처와 메모는 <strong>내 스마트폰/PC 브라우저에서 AES-256으로 완전히 암호화된 후 전송</strong>되므로, 클라우드 서버 관리자조차 사용자의 인맥 내용을 열람할 수 없습니다.
            </p>
          </div>

          {/* Sync Status Status Card */}
          <div className="p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">동기화 볼트 상태:</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                config.lastSyncedAt
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30'
              }`}>
                {config.lastSyncedAt ? '클라우드 보호 활성' : '미동기화'}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">보호 중인 인맥 노드:</span>
              <span className="font-bold text-slate-900 dark:text-white font-mono">{people.length}명</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">최근 동기화 시각:</span>
              <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{config.lastSyncedAt || '기록 없음'}</span>
            </div>
          </div>

          {/* Passphrase Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>동기화 마스터 비밀번호 (선택 사항)</span>
            </label>
            <input
              type="password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="미입력 시 디바이스 기본 마스터 키 사용"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono shadow-xs"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              다른 기기에서 복원할 때 동일한 비밀번호를 입력해야 복호화됩니다.
            </p>
          </div>

          {statusMessage && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
              <span className="font-medium">{statusMessage}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={handlePushSync}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isSyncing ? '동기화 중...' : '클라우드에 백업'}</span>
            </button>

            <button
              onClick={handlePullRestore}
              disabled={isSyncing}
              className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50 text-slate-700 dark:text-slate-200 font-bold text-xs border border-slate-200 dark:border-slate-700 shadow-xs transition-all active:scale-95"
            >
              <DownloadCloud className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>클라우드에서 복원</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
