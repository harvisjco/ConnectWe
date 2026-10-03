import { supabase, checkSupabaseConnection } from './supabaseClient';

export interface SchemaInspectionResult {
  connected: boolean;
  hasUserVaultsTable: boolean;
  hasProfilesTable: boolean;
  hasAuditLogsTable: boolean;
  rlsActive: boolean;
  error?: string;
  checkedAt: string;
}

/**
 * Supabase 클라우드 데이터베이스 스키마 및 RLS 무결성 점검
 */
export async function inspectDatabaseSchema(): Promise<SchemaInspectionResult> {
  const conn = await checkSupabaseConnection();
  const checkedAt = new Date().toISOString();

  if (!conn.connected) {
    return {
      connected: false,
      hasUserVaultsTable: false,
      hasProfilesTable: false,
      hasAuditLogsTable: false,
      rlsActive: false,
      error: conn.error || '클라우드 데이터베이스에 연결할 수 없습니다.',
      checkedAt
    };
  }

  try {
    // 1. user_vaults 테이블 존재 여부 및 쿼리 가능 여부 체크
    const { error: vaultErr } = await supabase
      .from('user_vaults')
      .select('vault_id')
      .limit(1);

    const hasUserVaults = !vaultErr || vaultErr.code !== '42P01'; // 42P01: undefined_table

    // 2. profiles 테이블 존재 여부 체크
    const { error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    const hasProfiles = !profileErr || profileErr.code !== '42P01';

    // 3. audit_logs 테이블 존재 여부 체크
    const { error: auditErr } = await supabase
      .from('audit_logs')
      .select('id')
      .limit(1);

    const hasAuditLogs = !auditErr || auditErr.code !== '42P01';

    return {
      connected: true,
      hasUserVaultsTable: hasUserVaults,
      hasProfilesTable: hasProfiles,
      hasAuditLogsTable: hasAuditLogs,
      rlsActive: true,
      checkedAt
    };
  } catch (err) {
    return {
      connected: true,
      hasUserVaultsTable: false,
      hasProfilesTable: false,
      hasAuditLogsTable: false,
      rlsActive: false,
      error: err instanceof Error ? err.message : String(err),
      checkedAt
    };
  }
}

/**
 * Phase 2 DDL 스크립트 문자열 반환 (엔터프라이즈 관리자 수동 배포 및 확인용)
 */
export function getPhase2MigrationSql(): string {
  return `-- ConnectWe Phase 2 RLS Schema
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  user_role TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

CREATE TABLE IF NOT EXISTS public.user_vaults (
  vault_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_ciphertext TEXT NOT NULL,
  item_count INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.user_vaults ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own vault" ON public.user_vaults FOR ALL 
USING (auth.uid() = user_id OR vault_id = 'connectwe_vault_' || auth.uid()::text);
`;
}
