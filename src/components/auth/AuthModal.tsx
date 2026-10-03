import React, { useState } from 'react';
import { 
  X, Lock, Mail, User, ShieldCheck, 
  ArrowRight, Sparkles, Check, AlertCircle, Loader2, Fingerprint
} from 'lucide-react';
import { 
  signInWithEmail, 
  signUpWithEmail, 
  signInWithDemoAccount, 
  AuthUser 
} from '../../services/authService';
import { authenticateWithBiometrics } from '../../services/biometricAuthService';
import { migrateGuestPeopleToUser, loadPeopleFromStorage } from '../../services/storageService';
import { Person } from '../../types/network';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser, updatedPeople?: Person[]) => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

type AuthTab = 'signin' | 'signup';

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  onShowToast
}) => {
  const [activeTab, setActiveTab] = useState<AuthTab>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // 게스트 모드 인맥 수 확인
  const guestCount = React.useMemo(() => {
    try {
      const guestPeople = loadPeopleFromStorage('guest');
      return guestPeople.length;
    } catch {
      return 0;
    }
  }, [isOpen]);

  const [shouldMigrateGuest, setShouldMigrateGuest] = useState(true);

  if (!isOpen) return null;

  const handlePostAuthMigration = (user: AuthUser) => {
    let updatedPeople: Person[] | undefined;
    if (shouldMigrateGuest && guestCount > 0) {
      const result = migrateGuestPeopleToUser(user.id);
      updatedPeople = result.people;
      if (result.migratedCount > 0) {
        onShowToast(`기존 로컬 인맥 ${result.migratedCount}명이 [${user.email}] 계정의 안전 볼트로 이전되었습니다.`, 'success');
      }
    }
    onAuthSuccess(user, updatedPeople);
    onClose();
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email || !password) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signInWithEmail(email, password);
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.user) {
        onShowToast(`[${res.user.name || res.user.email}] 님, 환영합니다. 안전 인맥 격리 모드가 활성화되었습니다.`, 'success');
        handlePostAuthMigration(res.user);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '로그인 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!email || !password) {
      setErrorMessage('이메일과 비밀번호를 모두 입력해 주세요.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await signUpWithEmail(email, password, name);
      if (res.error) {
        setErrorMessage(res.error);
      } else if (res.requiresEmailConfirmation) {
        onShowToast('가입 확인 이메일이 발송되었습니다. 메일함의 인증 링크를 확인해 주세요.', 'info');
        onClose();
      } else if (res.user) {
        onShowToast(`[${res.user.name || res.user.email}] 님 계정이 생성되었습니다. 독립 인맥 볼트가 생성되었습니다.`, 'success');
        handlePostAuthMigration(res.user);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '회원가입 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    setIsLoading(true);
    try {
      const demoUser = signInWithDemoAccount();
      onShowToast(`데모 계정 [${demoUser.name}]으로 체험을 시작합니다. 독립 인맥 볼트가 연결되었습니다.`, 'success');
      handlePostAuthMigration(demoUser);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricQuickLogin = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await authenticateWithBiometrics(email.trim() || undefined);
      if (res.success && res.user) {
        onShowToast(res.message, 'success');
        handlePostAuthMigration(res.user);
      } else {
        setErrorMessage(res.message);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : '생체인증 로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/90 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-indigo-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight text-white">경영진 안전 인증 센터</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/30 text-indigo-200 border border-indigo-400/30">
                  E2EE 격리
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                개인별 완벽히 분리된 인맥 볼트와 DART 팩트 인텔리전스를 제공합니다.
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="px-6 pt-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setActiveTab('signin'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'signin'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            기존 계정 로그인
          </button>
          <button
            type="button"
            onClick={() => { setActiveTab('signup'); setErrorMessage(null); }}
            className={`flex-1 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'signup'
                ? 'border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            신규 계정 생성
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {activeTab === 'signin' && (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleBiometricQuickLogin}
                disabled={isLoading}
                data-testid="btn-biometric-quick-login"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <Fingerprint className="w-4 h-4 text-emerald-100" />
                <span>Touch ID / Face ID 1초 퀵 로그인</span>
              </button>
              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
                <span className="flex-shrink mx-2 text-[10px] text-slate-400 font-medium">또는 이메일로 계속</span>
                <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              </div>
            </div>
          )}

          <form onSubmit={activeTab === 'signin' ? handleSignIn : handleSignUp} className="space-y-3.5">
            {activeTab === 'signup' && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  성명 / 직함
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="예: 홍길동 파트너 대표"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                업무용 이메일
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="executive@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 block mb-1">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder={activeTab === 'signup' ? '최소 6자 이상' : '비밀번호 입력'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* 게스트 인맥 마이그레이션 옵션 */}
            {guestCount > 0 && (
              <label className="flex items-start gap-2 p-2.5 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={shouldMigrateGuest}
                  onChange={(e) => setShouldMigrateGuest(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-[11px] text-slate-700 dark:text-slate-300 leading-snug">
                  현재 로컬 게스트 모드에서 등록한 <strong>{guestCount}명의 인맥</strong>을 내 계정의 전용 볼트로 안전하게 이전합니다.
                </span>
              </label>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-98 transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>처리 중...</span>
                </>
              ) : activeTab === 'signin' ? (
                <>
                  <span>로그인 및 인맥 볼트 열기</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              ) : (
                <>
                  <span>회원가입 및 볼트 생성</span>
                  <Check className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {activeTab === 'signin' && (
              <button
                type="button"
                onClick={handleBiometricQuickLogin}
                disabled={isLoading}
                className="w-full py-2 px-3 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-indigo-50/70 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
                data-testid="biometric-login-btn"
              >
                <Fingerprint className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>지문 / Face ID 생체인증 빠른 로그인</span>
              </button>
            )}
          </form>

          {/* 데모 계정 간편 체험 CTA */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={handleDemoSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>1초 C-Level 파트너 데모 계정으로 즉시 체험</span>
            </button>
          </div>
        </div>

        {/* Footer Zero-Knowledge Privacy Assurance */}
        <div className="px-6 py-3 bg-slate-50 dark:bg-slate-850 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3 h-3 text-emerald-600" />
            <span>Zero-Knowledge Multi-Tenant 격리</span>
          </div>
          <span>ConnectWe Trust Protocol</span>
        </div>
      </div>
    </div>
  );
};
