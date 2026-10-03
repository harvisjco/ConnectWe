import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  getTenantVaultId, 
  uploadEncryptedVaultToCloud, 
  downloadAndRestoreVault, 
  aggregateLocalVault 
} from '../cloudSyncService';
import { Person } from '../../types/network';

vi.mock('../supabaseClient', () => ({
  checkSupabaseConnection: vi.fn().mockResolvedValue({
    connected: false,
    latencyMs: 10,
    url: 'https://mock.supabase.co'
  }),
  supabase: {
    from: vi.fn().mockReturnValue({
      upsert: vi.fn().mockResolvedValue({ error: null }),
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: null })
        })
      })
    })
  }
}));

describe('cloudSyncService Multi-Tenant Vault Isolation', () => {
  class MockStorage {
    private store: Record<string, string> = {};
    getItem(key: string): string | null {
      return this.store[key] ?? null;
    }
    setItem(key: string, value: string): void {
      this.store[key] = String(value);
    }
    removeItem(key: string): void {
      delete this.store[key];
    }
    clear(): void {
      this.store = {};
    }
  }

  beforeEach(() => {
    vi.stubGlobal('localStorage', new MockStorage());
  });

  it('사용자 ID가 주어지면 테넌트 격리된 볼트 ID를 반환한다', () => {
    expect(getTenantVaultId('user_alpha')).toBe('connectwe_vault_user_alpha');
    expect(getTenantVaultId('user_beta')).toBe('connectwe_vault_user_beta');
    expect(getTenantVaultId()).toBe('connectwe_master_vault');
  });

  it('서로 다른 사용자의 로컬 E2EE 볼트 데이터는 독립적으로 보관 및 복원된다', async () => {
    const personA: Person = {
      id: 'p_a1',
      name: '이수만',
      currentCompany: '엔터테크',
      currentDepartment: '경영전략본부',
      currentTitle: '프로듀서',
      mobile: '010-1111-2222',
      email: 'lee@entertech.co.kr',
      primaryDomain: '경영/전략',
      estimatedAgeGroup: '50s_plus',
      isAgeEstimated: false,
      connectionChannel: 'business_card',
      sourceType: 'SOURCE_DATA',
      closeness: 3,
      isStale: false,
      skills: [],
      careers: [],
      academics: []
    };

    const personB: Person = {
      id: 'p_b1',
      name: '박진영',
      currentCompany: 'JYP파트너스',
      currentDepartment: '투자총괄',
      currentTitle: '대표',
      mobile: '010-3333-4444',
      email: 'park@jyppartners.com',
      primaryDomain: '투자/VC',
      estimatedAgeGroup: '50s_plus',
      isAgeEstimated: false,
      connectionChannel: 'business_card',
      sourceType: 'SOURCE_DATA',
      closeness: 3,
      isStale: false,
      skills: [],
      careers: [],
      academics: []
    };

    const payloadA = aggregateLocalVault([personA]);
    const payloadB = aggregateLocalVault([personB]);

    // User A 백업
    await uploadEncryptedVaultToCloud(payloadA, 'pass-a', 'user_alpha');
    // User B 백업
    await uploadEncryptedVaultToCloud(payloadB, 'pass-b', 'user_beta');

    // User A 복원
    const restoredA = await downloadAndRestoreVault('pass-a', 'user_alpha');
    expect(restoredA.success).toBe(true);
    expect(restoredA.people?.length).toBe(1);
    expect(restoredA.people?.[0].name).toBe('이수만');

    // User B 복원
    const restoredB = await downloadAndRestoreVault('pass-b', 'user_beta');
    expect(restoredB.success).toBe(true);
    expect(restoredB.people?.length).toBe(1);
    expect(restoredB.people?.[0].name).toBe('박진영');
  });
});
