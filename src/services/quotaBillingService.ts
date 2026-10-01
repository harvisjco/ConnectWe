export interface QuotaStatus {
  freeScansRemaining: number;
  freeScansLimit: number;
  paidCredits: number;
  customApiKeyActive: boolean;
  maskedApiKey?: string;
  lastResetDate: string;
}

export type ScanExecutionMode = 'byok' | 'free' | 'paid' | 'fallback_local';

export interface QuotaConsumptionResult {
  allowed: boolean;
  mode: ScanExecutionMode;
  message: string;
  freeRemaining: number;
  creditsRemaining: number;
}

class SafeStorage {
  private mem = new Map<string, string>();

  getItem(key: string): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        return window.localStorage.getItem(key);
      } catch {
        return this.mem.get(key) || null;
      }
    }
    return this.mem.get(key) || null;
  }

  setItem(key: string, value: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(key, value);
        this.mem.set(key, value);
        return;
      } catch {
        this.mem.set(key, value);
        return;
      }
    }
    this.mem.set(key, value);
  }

  removeItem(key: string): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.removeItem(key);
      } catch {
        // ignore
      }
    }
    this.mem.delete(key);
  }
}

const storage = new SafeStorage();

const STORAGE_KEY_QUOTA = 'connectwe_scan_quota';
const STORAGE_KEY_CREDITS = 'connectwe_scan_credits';
const STORAGE_KEY_CUSTOM_KEY = 'connectwe_gemini_api_key';

const DAILY_FREE_LIMIT = 20;
const INITIAL_WELCOME_CREDITS = 10;

function getTodayString(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * 현재 명함 스캔 쿼터 및 크레딧 상태 조회
 */
export function getScanQuotaStatus(): QuotaStatus {
  const today = getTodayString();
  const savedQuotaRaw = storage.getItem(STORAGE_KEY_QUOTA);
  let freeScansRemaining = DAILY_FREE_LIMIT;
  let lastResetDate = today;

  if (savedQuotaRaw) {
    try {
      const parsed = JSON.parse(savedQuotaRaw);
      if (parsed.lastResetDate === today) {
        freeScansRemaining = typeof parsed.remaining === 'number' ? parsed.remaining : DAILY_FREE_LIMIT;
        lastResetDate = parsed.lastResetDate;
      } else {
        // 날짜가 바뀌었으면 무료 쿼터 자동 리셋
        freeScansRemaining = DAILY_FREE_LIMIT;
        lastResetDate = today;
        storage.setItem(STORAGE_KEY_QUOTA, JSON.stringify({ remaining: DAILY_FREE_LIMIT, lastResetDate: today }));
      }
    } catch {
      freeScansRemaining = DAILY_FREE_LIMIT;
    }
  } else {
    storage.setItem(STORAGE_KEY_QUOTA, JSON.stringify({ remaining: DAILY_FREE_LIMIT, lastResetDate: today }));
  }

  // 크레딧 조회
  const savedCredits = storage.getItem(STORAGE_KEY_CREDITS);
  let paidCredits = INITIAL_WELCOME_CREDITS;
  if (savedCredits !== null) {
    const num = parseInt(savedCredits, 10);
    if (!isNaN(num)) paidCredits = num;
  } else {
    storage.setItem(STORAGE_KEY_CREDITS, String(INITIAL_WELCOME_CREDITS));
  }

  // 사용자 지정 Gemini API Key 조회
  const customKey = storage.getItem(STORAGE_KEY_CUSTOM_KEY);
  const customApiKeyActive = Boolean(customKey && customKey.trim().length > 10);
  const maskedApiKey = customApiKeyActive
    ? `${customKey!.trim().slice(0, 4)}••••••••${customKey!.trim().slice(-4)}`
    : undefined;

  return {
    freeScansRemaining,
    freeScansLimit: DAILY_FREE_LIMIT,
    paidCredits,
    customApiKeyActive,
    maskedApiKey,
    lastResetDate
  };
}

/**
 * 스캔 1회에 대한 쿼터 소비 또는 차감
 */
export function consumeScanQuota(): QuotaConsumptionResult {
  const status = getScanQuotaStatus();

  // 1. 사용자 본인 API 키(BYOK) 등록되어 있는 경우 -> 무제한 사용
  if (status.customApiKeyActive) {
    return {
      allowed: true,
      mode: 'byok',
      message: '등록된 개인 Gemini API 키로 무제한 고정밀 스캔을 실행합니다.',
      freeRemaining: status.freeScansRemaining,
      creditsRemaining: status.paidCredits
    };
  }

  // 2. 일일 무료 쿼터 잔여가 있는 경우 -> 무료 1회 차감
  if (status.freeScansRemaining > 0) {
    const newRemaining = status.freeScansRemaining - 1;
    storage.setItem(
      STORAGE_KEY_QUOTA,
      JSON.stringify({ remaining: newRemaining, lastResetDate: status.lastResetDate })
    );

    return {
      allowed: true,
      mode: 'free',
      message: `오늘 무료 Gemini Vision 스캔 1회를 사용했습니다. (잔여: ${newRemaining}/${status.freeScansLimit}회)`,
      freeRemaining: newRemaining,
      creditsRemaining: status.paidCredits
    };
  }

  // 3. 무료 쿼터 소진 후 유료 크레딧이 남아있는 경우 -> 크레딧 1개(50원) 차감
  if (status.paidCredits > 0) {
    const newCredits = status.paidCredits - 1;
    storage.setItem(STORAGE_KEY_CREDITS, String(newCredits));

    return {
      allowed: true,
      mode: 'paid',
      message: `유료 스캔 크레딧 1개가 차감되었습니다. (잔여: ${newCredits} 크레딧)`,
      freeRemaining: 0,
      creditsRemaining: newCredits
    };
  }

  // 4. 무료 및 크레딧 모두 소진 -> 온디바이스 로컬 파서(0원) 폴백 안내
  return {
    allowed: false,
    mode: 'fallback_local',
    message: '오늘의 무료 스캔 한도가 소진되었습니다. 크레딧 충전 또는 온디바이스 로컬 파서로 스캔을 계속합니다.',
    freeRemaining: 0,
    creditsRemaining: 0
  };
}

/**
 * 크레딧 충전 (시뮬레이션 및 결제 후 반영)
 */
export function rechargeCredits(amount: number): number {
  const status = getScanQuotaStatus();
  const updated = Math.max(0, status.paidCredits + amount);
  storage.setItem(STORAGE_KEY_CREDITS, String(updated));
  return updated;
}

/**
 * 사용자 본인 Gemini API Key 등록 (BYOK)
 */
export function setCustomGeminiApiKey(apiKey: string): void {
  if (apiKey.trim()) {
    storage.setItem(STORAGE_KEY_CUSTOM_KEY, apiKey.trim());
  } else {
    storage.removeItem(STORAGE_KEY_CUSTOM_KEY);
  }
}

/**
 * 등록된 사용자 API 키 가져오기
 */
export function getCustomGeminiApiKey(): string | null {
  return storage.getItem(STORAGE_KEY_CUSTOM_KEY);
}

/**
 * 테스트 및 디버그용: 쿼터 리셋
 */
export function resetQuotaForTesting(): void {
  storage.removeItem(STORAGE_KEY_QUOTA);
  storage.removeItem(STORAGE_KEY_CREDITS);
  storage.removeItem(STORAGE_KEY_CUSTOM_KEY);
}
