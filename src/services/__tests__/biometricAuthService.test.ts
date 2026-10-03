import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  isBiometricSupported, 
  hasRegisteredBiometricKey, 
  registerBiometricKey, 
  unlockVaultWithBiometric, 
  clearBiometricKey 
} from '../biometricAuthService';

describe('biometricAuthService WebAuthn & Local Key Management', () => {
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
    clearBiometricKey();
  });

  it('기기 생체인증 지원 여부를 불리언 값으로 반환한다', async () => {
    const supported = await isBiometricSupported();
    expect(typeof supported).toBe('boolean');
  });

  it('생체인증 키 등록 후 원터치로 복원된다 (폴백/시뮬레이션 모드 검증)', async () => {
    expect(hasRegisteredBiometricKey()).toBe(false);

    const regResult = await registerBiometricKey('my-c-level-vault-pass');
    expect(regResult.success).toBe(true);
    expect(hasRegisteredBiometricKey()).toBe(true);

    const unlockResult = await unlockVaultWithBiometric();
    expect(unlockResult.success).toBe(true);
    expect(unlockResult.passphrase).toBe('my-c-level-vault-pass');
  });

  it('clearBiometricKey 호출 시 등록된 생체인증 정보가 완전히 삭제된다', async () => {
    await registerBiometricKey('temp-pass');
    expect(hasRegisteredBiometricKey()).toBe(true);

    clearBiometricKey();
    expect(hasRegisteredBiometricKey()).toBe(false);

    const unlockResult = await unlockVaultWithBiometric();
    expect(unlockResult.success).toBe(false);
  });
});
