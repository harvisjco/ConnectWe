import React, { useState } from 'react';
import { X, Lock, Unlock, Eye, EyeOff, ShieldCheck, AlertTriangle, Key } from 'lucide-react';
import { encryptData, decryptData } from '../../services/cryptoStorage';

interface EncryptionSetupModalProps {
  onClose: () => void;
  onShowToast: (msg: string) => void;
}

type Step = 'intro' | 'set_password' | 'confirm' | 'done';

export const EncryptionSetupModal: React.FC<EncryptionSetupModalProps> = ({
  onClose,
  onShowToast,
}) => {
  const [step, setStep] = useState<Step>('intro');
  const [password, setPassword] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const isEncrypted = Boolean(localStorage.getItem('connectwe_encrypted'));

  const handleEnableEncryption = async () => {
    if (password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    if (password !== confirmPw) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setIsLoading(true);
    setError('');

    try {
      const raw = localStorage.getItem('connectwe_people_v1') ?? localStorage.getItem('connectwe_people') ?? '[]';
      const encrypted = await encryptData(raw, password);
      localStorage.setItem('connectwe_people_enc', encrypted);
      localStorage.setItem('connectwe_encrypted', '1');
      // 원문 삭제
      localStorage.removeItem('connectwe_people_v1');
      localStorage.removeItem('connectwe_people');
      setStep('done');
      onShowToast('✅ AES-256-GCM 암호화가 활성화되었습니다. 비밀번호를 반드시 기억해 주세요!');
    } catch {
      setError('암호화 처리 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableEncryption = async () => {
    if (!password) { setError('현재 비밀번호를 입력해 주세요.'); return; }
    setIsLoading(true);
    setError('');

    try {
      const enc = localStorage.getItem('connectwe_people_enc');
      if (!enc) throw new Error('암호화된 데이터 없음');
      const raw = await decryptData(enc, password);
      localStorage.setItem('connectwe_people_v1', raw);
      localStorage.setItem('connectwe_people', raw);
      localStorage.removeItem('connectwe_people_enc');
      localStorage.removeItem('connectwe_encrypted');
      setStep('done');
      onShowToast('🔓 암호화가 해제되었습니다. 데이터가 복호화 저장되었습니다.');
    } catch {
      setError('비밀번호가 올바르지 않거나 복호화에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            {isEncrypted
              ? <Lock className="w-5 h-5 text-emerald-400" />
              : <Key className="w-5 h-5 text-amber-400" />}
            <h2 className="text-sm font-bold text-white">
              {isEncrypted ? 'AES-256-GCM 암호화 관리' : '로컬 데이터 암호화 설정'}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 현재 상태 표시 */}
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${
            isEncrypted
              ? 'bg-emerald-950/40 border-emerald-500/30'
              : 'bg-amber-950/40 border-amber-500/30'
          }`}>
            {isEncrypted
              ? <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              : <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />}
            <div className="space-y-1">
              <p className={`text-xs font-semibold ${isEncrypted ? 'text-emerald-300' : 'text-amber-300'}`}>
                {isEncrypted ? '암호화 활성 상태' : '암호화 비활성 상태'}
              </p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isEncrypted
                  ? '인맥 데이터가 AES-256-GCM + PBKDF2 방식으로 로컬 암호화 저장 중입니다. 비밀번호 없이는 타인이 데이터를 열람할 수 없습니다.'
                  : '현재 인맥 데이터가 평문으로 LocalStorage에 저장되어 있습니다. 암호화를 활성화하면 전화번호, 이메일, 메모가 완전히 보호됩니다.'}
              </p>
            </div>
          </div>

          {step === 'done' ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-14 h-14 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-sm font-semibold text-white">설정이 완료되었습니다</p>
              <p className="text-[11px] text-slate-400">페이지를 새로고침하면 변경사항이 적용됩니다.</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-colors"
              >
                새로고침
              </button>
            </div>
          ) : (
            <>
              {/* 비밀번호 입력 */}
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  {isEncrypted ? '현재 비밀번호' : '설정할 비밀번호 (최소 8자)'}
                </label>
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="비밀번호 입력..."
                    className="w-full px-4 py-2.5 pr-10 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                  >
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* 암호화 활성화 시: 확인 비밀번호 */}
                {!isEncrypted && (
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={confirmPw}
                    onChange={(e) => { setConfirmPw(e.target.value); setError(''); }}
                    placeholder="비밀번호 확인..."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                )}

                {error && (
                  <p className="text-[11px] text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" /> {error}
                  </p>
                )}
              </div>

              {/* 경고 문구 */}
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700 text-[11px] text-slate-400 space-y-1">
                <p className="font-semibold text-slate-300">주의사항</p>
                <p>• 비밀번호를 분실하면 데이터를 복구할 방법이 없습니다.</p>
                <p>• 암호화 전 JSON 백업을 먼저 다운로드하시길 권장합니다.</p>
                <p>• PBKDF2(310,000 iterations) + AES-256-GCM 군사급 보안 적용.</p>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium transition-colors"
                >
                  취소
                </button>
                {isEncrypted ? (
                  <button
                    onClick={handleDisableEncryption}
                    disabled={isLoading}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                  >
                    {isLoading ? <span className="animate-spin">⟳</span> : <Unlock className="w-4 h-4" />}
                    암호화 해제
                  </button>
                ) : (
                  <button
                    onClick={handleEnableEncryption}
                    disabled={isLoading || !password || !confirmPw}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm font-semibold transition-colors"
                  >
                    {isLoading ? <span className="animate-spin">⟳</span> : <Lock className="w-4 h-4" />}
                    암호화 활성화
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
