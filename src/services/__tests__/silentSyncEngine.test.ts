import { describe, it, expect, beforeEach } from 'vitest';
import { silentSyncEngine, safeStorage } from '../silentSyncEngine';

describe('silentSyncEngine (무감각 E2EE 백그라운드 데이터 볼트)', () => {
  beforeEach(() => {
    safeStorage.clear();
  });

  it('데이터 볼트 동기화 상태를 정상적으로 구독하고 초기 상태를 반환해야 한다', () => {
    const status = silentSyncEngine.getStatus();
    expect(status).toBeDefined();
    expect(['idle', 'synced', 'syncing']).toContain(status.state);
  });

  it('데이터 큐잉 및 암호화 저장이 완료되면 synced 상태로 전이되어야 한다', async () => {
    const testData = { name: '이순신', company: '충무공해운' };
    silentSyncEngine.queueVaultSync('test_person_1', testData);

    // 강제 즉시 실행
    await silentSyncEngine.processVaultQueue();

    const status = silentSyncEngine.getStatus();
    expect(status.state).toBe('synced');
    expect(status.lastSyncedAt).not.toBeNull();

    // 로드 및 복호화 검증
    const loaded = await silentSyncEngine.loadVaultData<typeof testData>('test_person_1');
    expect(loaded).toEqual(testData);
  });
});
