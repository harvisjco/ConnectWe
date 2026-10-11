import React, { useState, useEffect } from 'react';
import { 
  getInactivityState, 
  subscribeToInactivity, 
  unlockApp,
  initInactivityEngine
} from '../../services/inactivityGuardService';
import { authenticateWithBiometrics } from '../../services/biometricAuthService';
import { ShieldAlert, Fingerprint, Lock, ArrowRight, KeyRound } from 'lucide-react';
import { pushToast } from '../../services/toastQueueService';

export const InactivityLockOverlay: React.FC = () => {
  const [isLocked, setIsLocked] = useState(() => getInactivityState().isLocked);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // 백그라운드 엔진 리스너 및 이벤트 등록
  useEffect(() => {
    const cleanupEngine = initInactivityEngine();
    const unsubscribe = subscribeToInactivity((state) => {
      setIsLocked(state.isLocked);
    });

    return () => {
      cleanupEngine();
      unsubscribe();
    };
  }, []);

  if (!isLocked) return null;

  // 생체 인증 시도
  const handleBiometricUnlock = async () => {
    setIsAuthenticating(true);
    try {
      const result = await authenticateWithBiometrics();
      if (result.success) {
        unlockApp();
        setPinInput('');
        setPinError(false);
        pushToast('생체 인증으로 안전하게 복귀되었습니다.', 'success');
      } else {
        pushToast(result.message || '생체 인증 실패. PIN 번호를 입력하세요.', 'warning');
      }
    } catch {
      pushToast('생체 인증 중 오류가 발생했습니다.', 'error');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // PIN / 비밀번호 잠금 해제 (데모 및 기본 PIN: 1234 또는 사용자 지정)
  const handlePinUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === '1234' || pinInput.trim().length >= 4) {
      unlockApp();
      setPinInput('');
      setPinError(false);
      pushToast('화면 잠금이 정상 해제되었습니다.', 'success');
    } else {
      setPinError(true);
      pushToast('PIN 번호는 최소 4자리 이상이어야 합니다. (기본: 1234)', 'error');
    }
  };

  return (
    <div 
      role="dialog"
      aria-modal="true"
      aria-label="보안 화면 잠금"
      className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300 select-none"
    >
      <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl text-center space-y-6 relative overflow-hidden">
        {/* 상단 장식 링 */}
        <div className="w-20 h-20 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 text-indigo-600 dark:text-indigo-400 mx-auto flex items-center justify-center shadow-inner">
          <Lock className="w-9 h-9" />
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center justify-center gap-2">
            <span>대외비 화면 보안 잠금</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              Auto-Lock
            </span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-xs mx-auto">
            경영진 인맥 및 실공시 데이터 보호를 위해 장시간 무활동 시 안전하게 잠금 처리되었습니다.
          </p>
        </div>

        {/* 생체인증 원터치 언락 */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleBiometricUnlock}
            disabled={isAuthenticating}
            className="w-full flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-98 text-white font-semibold text-sm shadow-md transition-all cursor-pointer"
          >
            <Fingerprint className="w-5 h-5" />
            <span>{isAuthenticating ? '생체 센서 확인 중...' : 'Face ID / 지문으로 복귀'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
          <span className="text-[11px] font-semibold text-slate-400">또는 보안 PIN 입력</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-slate-800" />
        </div>

        {/* PIN 입력 폼 */}
        <form onSubmit={handlePinUnlock} className="space-y-3">
          <div className="relative">
            <input
              type="password"
              maxLength={8}
              value={pinInput}
              onChange={(e) => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="보안 PIN (기본: 1234)"
              className={`w-full px-4 py-3 rounded-xl text-center text-sm font-mono tracking-widest bg-slate-50 dark:bg-slate-800/60 border ${
                pinError 
                  ? 'border-rose-500 ring-2 ring-rose-500/20' 
                  : 'border-slate-300 dark:border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
              } text-slate-900 dark:text-slate-100 outline-none transition-all`}
            />
          </div>

          <button
            type="submit"
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-all cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>PIN 번호로 잠금 해제</span>
            <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
          </button>
        </form>

        <div className="pt-2">
          <p className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-center gap-1">
            <ShieldAlert className="w-3 h-3 text-slate-400" />
            <span>Enterprise Session Guard 활성 중</span>
          </p>
        </div>
      </div>
    </div>
  );
};
