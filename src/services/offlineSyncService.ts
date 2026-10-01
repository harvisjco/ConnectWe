import { silentSyncEngine } from './silentSyncEngine';

export type OfflineActionType = 
  | 'UPSERT_PERSON' 
  | 'DELETE_PERSON' 
  | 'ADD_MEETING_LOG' 
  | 'UPDATE_DEAL';

export interface OfflineSyncAction {
  id: string;
  type: OfflineActionType;
  payload: unknown;
  timestamp: number;
}

export interface OfflineSyncState {
  isOnline: boolean;
  pendingCount: number;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  lastSyncStatus: 'success' | 'offline' | 'error' | 'idle';
}

type OfflineSyncListener = (state: OfflineSyncState) => void;

const OFFLINE_QUEUE_KEY = 'cw_offline_pending_actions';

class OfflineSyncService {
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private pendingQueue: OfflineSyncAction[] = [];
  private listeners: Set<OfflineSyncListener> = new Set();
  private lastSyncedAt: Date | null = null;
  private isSyncing: boolean = false;
  private lastSyncStatus: 'success' | 'offline' | 'error' | 'idle' = 'idle';

  constructor() {
    this.loadQueueFromStorage();
    this.initEventListeners();
  }

  private initEventListeners() {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.isOnline = true;
      this.lastSyncStatus = 'idle';
      this.notify();
      // 네트워크 복구 시 자동 동기화 시도
      void this.syncNow();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.lastSyncStatus = 'offline';
      this.notify();
    });
  }

  private loadQueueFromStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(OFFLINE_QUEUE_KEY);
        if (raw) {
          this.pendingQueue = JSON.parse(raw) as OfflineSyncAction[];
        }
      }
    } catch {
      this.pendingQueue = [];
    }
  }

  private saveQueueToStorage() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(this.pendingQueue));
      }
    } catch {
      // safe fallback
    }
  }

  public subscribe(listener: OfflineSyncListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach(fn => fn(state));
  }

  public getState(): OfflineSyncState {
    return {
      isOnline: this.isOnline,
      pendingCount: this.pendingQueue.length,
      lastSyncedAt: this.lastSyncedAt,
      isSyncing: this.isSyncing,
      lastSyncStatus: this.lastSyncStatus
    };
  }

  /**
   * 오프라인 또는 온라인 상태에서 발생한 작업 큐잉
   */
  public enqueueAction(type: OfflineActionType, payload: unknown): void {
    const action: OfflineSyncAction = {
      id: `offline-act-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      type,
      payload,
      timestamp: Date.now()
    };

    this.pendingQueue.push(action);
    this.saveQueueToStorage();
    this.notify();

    // 온라인 상태라면 백그라운드에서 즉시 볼트 동기화 처리
    if (this.isOnline) {
      silentSyncEngine.queueVaultSync(action.id, payload);
      void this.syncNow();
    }
  }

  /**
   * 수동 또는 네트워크 복구 시 큐 일괄 동기화 실행
   */
  public async syncNow(): Promise<{ success: boolean; syncedCount: number }> {
    if (!this.isOnline) {
      this.lastSyncStatus = 'offline';
      this.notify();
      return { success: false, syncedCount: 0 };
    }

    if (this.isSyncing) {
      return { success: true, syncedCount: 0 };
    }

    this.isSyncing = true;
    this.notify();

    try {
      // silentSyncEngine의 로컬 암호화 볼트 큐 비우기 실행
      await silentSyncEngine.processVaultQueue();

      const syncedCount = this.pendingQueue.length;
      this.pendingQueue = [];
      this.saveQueueToStorage();

      this.lastSyncedAt = new Date();
      this.lastSyncStatus = 'success';
      this.isSyncing = false;
      this.notify();

      return { success: true, syncedCount };
    } catch {
      this.lastSyncStatus = 'error';
      this.isSyncing = false;
      this.notify();
      return { success: false, syncedCount: 0 };
    }
  }

  /**
   * 테스트 및 디버깅용 상태 강제 주입
   */
  public __setOnlineForTesting(online: boolean) {
    this.isOnline = online;
    this.notify();
  }

  public __clearQueueForTesting() {
    this.pendingQueue = [];
    this.saveQueueToStorage();
    this.notify();
  }
}

export const offlineSyncService = new OfflineSyncService();
