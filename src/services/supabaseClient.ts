import { createClient, SupabaseClient } from '@supabase/supabase-js';

// 환경변수 추출 (Vite import.meta.env)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://fijbhtuuyrprqlataknq.supabase.co';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_xdEtBA0wZQondWkdekep9A_3YNLU71n';

/**
 * ConnectWe Supabase 싱글톤 클라이언트
 */
export const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

/**
 * Supabase 클라우드 연결 상태 점검
 */
export async function checkSupabaseConnection(): Promise<{
  connected: boolean;
  latencyMs: number;
  url: string;
  error?: string;
}> {
  const start = performance.now();
  try {
    // 가장 가벼운 헬스체크 쿼리 (인증 세션 체크)
    const { error } = await supabase.auth.getSession();
    const latencyMs = Math.round(performance.now() - start);

    if (error) {
      return {
        connected: false,
        latencyMs,
        url: SUPABASE_URL,
        error: error.message,
      };
    }

    return {
      connected: true,
      latencyMs,
      url: SUPABASE_URL,
    };
  } catch (err) {
    return {
      connected: false,
      latencyMs: Math.round(performance.now() - start),
      url: SUPABASE_URL,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
