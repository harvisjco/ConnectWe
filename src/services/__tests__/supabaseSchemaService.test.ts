import { describe, it, expect, vi } from 'vitest';
import { inspectDatabaseSchema, getPhase2MigrationSql } from '../supabaseSchemaService';

vi.mock('../supabaseClient', () => ({
  checkSupabaseConnection: vi.fn().mockResolvedValue({
    connected: true,
    latencyMs: 15,
    url: 'https://mock.supabase.co'
  }),
  supabase: {
    from: vi.fn().mockImplementation((table: string) => ({
      select: vi.fn().mockReturnValue({
        limit: vi.fn().mockResolvedValue({
          data: table === 'user_vaults' ? [{ vault_id: 'test' }] : [],
          error: null
        })
      })
    }))
  }
}));

describe('supabaseSchemaService Inspection & DDL', () => {
  it('연결된 데이터베이스의 테이블 및 RLS 활성 상태를 점검한다', async () => {
    const res = await inspectDatabaseSchema();
    expect(res.connected).toBe(true);
    expect(res.hasUserVaultsTable).toBe(true);
    expect(res.hasProfilesTable).toBe(true);
    expect(res.hasAuditLogsTable).toBe(true);
    expect(res.rlsActive).toBe(true);
  });

  it('Phase 2 RLS 마이그레이션 SQL 문자열을 반환한다', () => {
    const sql = getPhase2MigrationSql();
    expect(sql).toContain('ROW LEVEL SECURITY');
    expect(sql).toContain('user_vaults');
    expect(sql).toContain('profiles');
  });
});
