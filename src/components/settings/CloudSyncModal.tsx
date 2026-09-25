import React, { useState } from 'react';
import { Person } from '../../types/network';
import { 
  getCloudSyncConfig, 
  pushEncryptedBackupToCloud, 
  pullEncryptedBackupFromCloud 
} from '../../services/cloudSyncService';
import { 
  Cloud, Lock, ShieldCheck, 
  UploadCloud, DownloadCloud, CheckCircle2
} from 'lucide-react';
import { ModalShell } from '../ui';

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
    <ModalShell
      isOpen={true}
      onClose={onClose}
      title="E2EE 클라우드 동기화 볼트 (Multi-device Sync)"
      subtitle="기기 간 안전한 실시간 암호화 동기화"
      maxWidth="lg"
      icon={<Cloud className="w-5 h-5" />}
    >
      <div className="space-y-5 text-xs text-slate-600">
        
        {/* Security Banner */}
        <div className="p-4.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
          <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Zero-Knowledge 종단간 암호화(E2EE) 아키텍처</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            사용자의 연락처와 메모는 <strong>내 스마트폰/PC 브라우저에서 AES-256으로 완전히 암호화된 후 전송</strong>되므로, 클라우드 서버 관리자조차 사용자의 인맥 내용을 열람할 수 없습니다.
          </p>
        </div>

        {/* Sync Status Status Card */}
        <div className="p-4.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">동기화 볼트 상태:</span>
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
              config.lastSyncedAt
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {config.lastSyncedAt ? '클라우드 보호 활성' : '미동기화'}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">보호 중인 인맥 노드:</span>
            <span className="font-bold text-slate-900 font-mono">{people.length}명</span>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">최근 동기화 시각:</span>
            <span className="font-mono font-medium text-slate-700">{config.lastSyncedAt || '기록 없음'}</span>
          </div>
        </div>

        {/* Passphrase Input */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-indigo-600" />
            <span>동기화 마스터 비밀번호 (선택 사항)</span>
          </label>
          <input
            type="password"
            value={passphrase}
            onChange={(e) => setPassphrase(e.target.value)}
            placeholder="미입력 시 디바이스 기본 마스터 키 사용"
            className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-mono shadow-xs"
          />
          <p className="text-[11px] text-slate-400 mt-1">
            다른 기기에서 복원할 때 동일한 비밀번호를 입력해야 복호화됩니다.
          </p>
        </div>

        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-indigo-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span className="font-medium">{statusMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <button
            onClick={handlePushSync}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs transition-all shadow-md shadow-indigo-600/20 active:scale-95 min-h-[36px]"
          >
            <UploadCloud className="w-4 h-4" />
            <span>{isSyncing ? '동기화 중...' : '클라우드에 백업'}</span>
          </button>

          <button
            onClick={handlePullRestore}
            disabled={isSyncing}
            className="flex items-center justify-center gap-2 py-3 rounded-2xl bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-xs transition-all active:scale-95 min-h-[36px]"
          >
            <DownloadCloud className="w-4 h-4 text-emerald-600" />
            <span>클라우드에서 복원</span>
          </button>
        </div>

      </div>
    </ModalShell>
  );
};
