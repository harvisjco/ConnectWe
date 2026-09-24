import { describe, it, expect } from 'vitest';
import { supabase, checkSupabaseConnection } from '../supabaseClient';

describe('supabaseClient - 연결 및 클라이언트 초기화', () => {
  it('Supabase 클라이언트 인스턴스가 정상적으로 생성되어 있어야 한다', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabase.from).toBeDefined();
  });

  it('checkSupabaseConnection 함수가 에러 없이 결과 객체를 반환해야 한다', async () => {
    const result = await checkSupabaseConnection();
    expect(result).toHaveProperty('connected');
    expect(result).toHaveProperty('latencyMs');
    expect(result).toHaveProperty('url');
    expect(result.url).toContain('supabase.co');
  });
});
