import { describe, it, expect, beforeEach } from 'vitest';
import { offlineSyncService } from '../offlineSyncService';

describe('offlineSyncService - 오프라인 안심 동기화 및 큐잉 검증', () => {
  beforeEach(() => {
    offlineSyncService.__clearQueueForTesting();
    offlineSyncService.__setOnlineForTesting(true);
  });

  it('기본 상태에서는 온라인이고 대기 큐는 비어있어야 한다', () => {
    const state = offlineSyncService.getState();
    expect(state.isOnline).toBe(true);
    expect(state.pendingCount).toBe(0);
  });

  it('오프라인 상태에서 액션을 큐잉하면 pendingCount가 증가해야 한다', () => {
    offlineSyncService.__setOnlineForTesting(false);

    offlineSyncService.enqueueAction('UPSERT_PERSON', {
      id: 'p-offline-1',
      name: '홍길동'
    });

    const state = offlineSyncService.getState();
    expect(state.isOnline).toBe(false);
    expect(state.pendingCount).toBe(1);
  });

  it('오프라인 상태에서 syncNow를 호출하면 오프라인 상태를 반환하고 큐를 유지해야 한다', async () => {
    offlineSyncService.__setOnlineForTesting(false);
    offlineSyncService.enqueueAction('ADD_MEETING_LOG', { note: '기내 회고' });

    const result = await offlineSyncService.syncNow();
    expect(result.success).toBe(false);
    expect(offlineSyncService.getState().pendingCount).toBe(1);
  });

  it('온라인 복구 후 syncNow를 호출하면 큐가 비워지고 성공해야 한다', async () => {
    offlineSyncService.__setOnlineForTesting(false);
    offlineSyncService.enqueueAction('UPSERT_PERSON', { id: 'p-1', name: '김대표' });
    expect(offlineSyncService.getState().pendingCount).toBe(1);

    // 온라인으로 복구
    offlineSyncService.__setOnlineForTesting(true);
    const result = await offlineSyncService.syncNow();
    expect(result.success).toBe(true);
    expect(result.syncedCount).toBe(1);
    expect(offlineSyncService.getState().pendingCount).toBe(0);
    expect(offlineSyncService.getState().lastSyncStatus).toBe('success');
  });
});
