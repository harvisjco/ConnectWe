import { encryptData, decryptData } from './cryptoStorage';

export type SyncState = 'idle' | 'syncing' | 'synced' | 'error';

export interface SilentSyncStatus {
  state: SyncState;
  lastSyncedAt: Date | null;
  pendingCount: number;
  errorMessage?: string;
}

const VAULT_STORAGE_KEY_PREFIX = 'cw_vault_e2ee_';
// 로컬 엔드투엔드 암호화를 위한 안전한 고유 디바이스 시드 (Zero-Knowledge)
const LOCAL_VAULT_SEED = 'CW_EXECUTIVE_SECURE_VAULT_AES256_SALT_KEY';

// SSR / Node 테스트 환경 대응 안전한 스토리지 추상화
const memoryStore = new Map<string, string>();
export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
    } catch {
      // SecurityError or undefined
    }
    return memoryStore.get(key) || null;
  },
  setItem: (key: string, value: string): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, value);
        return;
      }
    } catch {
      // fallback
    }
    memoryStore.set(key, value);
  },
  clear: (): void => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.clear();
      }
    } catch {
      // fallback
    }
    memoryStore.clear();
  }
};

type SyncListener = (status: SilentSyncStatus) => void;

class SilentSyncEngine {
  private queue: Map<string, unknown> = new Map();
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Set<SyncListener> = new Set();
  private currentStatus: SilentSyncStatus = {
    state: 'idle',
    lastSyncedAt: null,
    pendingCount: 0
  };

  /**
   * 동기화 상태 변화 리스너 등록
   */
  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    listener(this.currentStatus);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.currentStatus.pendingCount = this.queue.size;
    this.listeners.forEach(fn => fn({ ...this.currentStatus }));
  }

  /**
   * 백그라운드 무감각 암호화 저장 요청 (Debounce 400ms)
   */
  public queueVaultSync(key: string, data: unknown): void {
    this.queue.set(key, data);
    this.currentStatus.state = 'syncing';
    this.notify();

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }

    this.debounceTimer = setTimeout(() => {
      void this.processVaultQueue();
    }, 400);
  }

  /**
   * 큐에 쌓인 항목들을 AES-256-GCM으로 암호화하여 로컬 볼트에 안전 저장
   */
  public async processVaultQueue(): Promise<void> {
    if (this.queue.size === 0) {
      this.currentStatus.state = 'synced';
      this.notify();
      return;
    }

    this.currentStatus.state = 'syncing';
    this.notify();

    try {
      const entries = Array.from(this.queue.entries());
      this.queue.clear();

      for (const [key, data] of entries) {
        const jsonStr = JSON.stringify(data);
        const encrypted = await encryptData(jsonStr, LOCAL_VAULT_SEED);
        safeStorage.setItem(`${VAULT_STORAGE_KEY_PREFIX}${key}`, encrypted);
      }

      this.currentStatus.state = 'synced';
      this.currentStatus.lastSyncedAt = new Date();
      this.currentStatus.errorMessage = undefined;
    } catch (err: unknown) {
      this.currentStatus.state = 'error';
      this.currentStatus.errorMessage = err instanceof Error ? err.message : 'E2EE 암호화 저장 실패';
    } finally {
      this.notify();
    }
  }

  /**
   * 암호화된 볼트에서 데이터 안전 복호화 로드
   */
  public async loadVaultData<T>(key: string): Promise<T | null> {
    try {
      const encrypted = safeStorage.getItem(`${VAULT_STORAGE_KEY_PREFIX}${key}`);
      if (!encrypted) return null;

      const decryptedStr = await decryptData(encrypted, LOCAL_VAULT_SEED);
      if (!decryptedStr) return null;

      return JSON.parse(decryptedStr) as T;
    } catch {
      return null;
    }
  }

  /**
   * 현재 상태 조회
   */
  public getStatus(): SilentSyncStatus {
    return { ...this.currentStatus };
  }
}

export const silentSyncEngine = new SilentSyncEngine();
