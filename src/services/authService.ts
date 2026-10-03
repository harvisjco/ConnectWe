import { supabase } from './supabaseClient';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  isDemo?: boolean;
  createdAt?: string;
}

const DEMO_USER_STORAGE_KEY = 'connectwe_demo_auth_user';
const ACTIVE_USER_ID_KEY = 'connectwe_active_user_id';

type AuthListener = (user: AuthUser | null) => void;
const listeners = new Set<AuthListener>();

function notifyListeners(user: AuthUser | null) {
  if (typeof window !== 'undefined' && user?.id) {
    localStorage.setItem(ACTIVE_USER_ID_KEY, user.id);
  } else if (typeof window !== 'undefined') {
    localStorage.removeItem(ACTIVE_USER_ID_KEY);
  }
  listeners.forEach((listener) => {
    try {
      listener(user);
    } catch (err) {
      console.error('Error in auth listener:', err);
    }
  });
}

function mapSupabaseUser(sbUser: SupabaseUser | null): AuthUser | null {
  if (!sbUser) return null;
  return {
    id: sbUser.id,
    email: sbUser.email || '',
    name: sbUser.user_metadata?.name || sbUser.email?.split('@')[0] || '경영진',
    avatarUrl: sbUser.user_metadata?.avatar_url,
    isDemo: false,
    createdAt: sbUser.created_at,
  };
}

/**
 * 데모 계정 세션 로드 (로컬 테스트 및 심사용)
 */
function getDemoUser(): AuthUser | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(DEMO_USER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * 현재 로그인된 사용자 확인 (Supabase 세션 우선 ➔ 데모 세션 폴백)
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  // 1. 데모 사용자 확인
  const demo = getDemoUser();
  if (demo) return demo;

  // 2. Supabase 세션 확인
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error || !session?.user) {
      return null;
    }
    return mapSupabaseUser(session.user);
  } catch (err) {
    console.warn('Supabase getSession failed, fallback to null:', err);
    return null;
  }
}

/**
 * 이메일 / 비밀번호 로그인
 */
export async function signInWithEmail(email: string, password: string): Promise<{
  user: AuthUser | null;
  error?: string;
}> {
  // 기존 데모 사용자 클린업
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
  }

  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { user: null, error: error.message };
    }

    const authUser = mapSupabaseUser(data.user);
    notifyListeners(authUser);
    return { user: authUser };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : '로그인 처리 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 신규 회원가입
 */
export async function signUpWithEmail(
  email: string,
  password: string,
  name?: string
): Promise<{
  user: AuthUser | null;
  requiresEmailConfirmation?: boolean;
  error?: string;
}> {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
        },
      },
    });

    if (error) {
      return { user: null, error: error.message };
    }

    const requiresEmailConfirmation = !data.session;
    const authUser = mapSupabaseUser(data.user);
    if (!requiresEmailConfirmation) {
      notifyListeners(authUser);
    }
    return {
      user: authUser,
      requiresEmailConfirmation,
    };
  } catch (err) {
    return {
      user: null,
      error: err instanceof Error ? err.message : '회원가입 처리 중 오류가 발생했습니다.',
    };
  }
}

/**
 * 로그아웃 (Supabase 세션 및 데모 세션 해제)
 */
export async function signOut(): Promise<{ success: boolean; error?: string }> {
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(DEMO_USER_STORAGE_KEY);
  }

  try {
    await supabase.auth.signOut();
    notifyListeners(null);
    return { success: true };
  } catch (err) {
    notifyListeners(null);
    return {
      success: false,
      error: err instanceof Error ? err.message : '로그아웃 중 오류가 발생했습니다.',
    };
  }
}

/**
 * C-Level 데모 계정 체험 (테스트/오프라인 환경용 원클릭 로그인)
 */
export function signInWithDemoAccount(demoEmail: string = 'executive@connectwe.corp'): AuthUser {
  const demoUser: AuthUser = {
    id: 'usr_demo_c_level_77',
    email: demoEmail,
    name: '김진우 (파트너 대표)',
    isDemo: true,
    createdAt: new Date().toISOString(),
  };

  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(DEMO_USER_STORAGE_KEY, JSON.stringify(demoUser));
  }

  notifyListeners(demoUser);
  return demoUser;
}

/**
 * 인증 상태 변경 리스너 등록
 */
export function onAuthStateChange(listener: AuthListener): () => void {
  listeners.add(listener);

  // Supabase auth state change 리스너 연동
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
    // 데모 사용자가 활성화되어 있으면 Supabase 이벤트 무시
    if (getDemoUser()) return;
    const mapped = session?.user ? mapSupabaseUser(session.user) : null;
    notifyListeners(mapped);
  });

  // 초기 1회 현재 상태 전달
  getCurrentUser().then((user) => {
    listener(user);
  });

  return () => {
    listeners.delete(listener);
    subscription.unsubscribe();
  };
}

/**
 * 현재 활성화된 사용자 ID (동기적 조회)
 */
export function getActiveUserId(): string | null {
  if (typeof localStorage === 'undefined') return null;
  const demo = getDemoUser();
  if (demo?.id) return demo.id;
  return localStorage.getItem(ACTIVE_USER_ID_KEY);
}
