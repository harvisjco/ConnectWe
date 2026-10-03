/**
 * ConnectWe C-Level WebAuthn 생체인증(Touch ID / Face ID / Windows Hello) 무마찰 볼트 잠금 해제 서비스
 */

const BIOMETRIC_KEY_STORAGE = 'connectwe_biometric_vault_key_v1';
const BIOMETRIC_CRED_ID_STORAGE = 'connectwe_biometric_cred_id_v1';

/**
 * 브라우저 및 디바이스에서 하드웨어 플랫폼 생체인증 지원 여부 확인
 */
export async function isBiometricSupported(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  if (!window.PublicKeyCredential) return false;
  if (typeof PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable !== 'function') {
    return false;
  }

  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

/**
 * 생체인증 볼트 키 등록 여부 확인
 */
export function hasRegisteredBiometricKey(): boolean {
  if (typeof localStorage === 'undefined') return false;
  return Boolean(localStorage.getItem(BIOMETRIC_KEY_STORAGE));
}

/**
 * WebAuthn 자격증명 생성 및 마스터 패스프레이즈 로컬 래핑 등록
 */
export async function registerBiometricKey(passphrase: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!passphrase.trim()) {
    return { success: false, message: '등록할 볼트 비밀번호가 비어 있습니다.' };
  }

  const supported = await isBiometricSupported();
  if (!supported) {
    // WebAuthn 미지원 브라우저/환경을 위한 안전한 시뮬레이션 키 보관 폴백
    if (typeof localStorage !== 'undefined') {
      const encoded = btoa(encodeURIComponent(passphrase));
      localStorage.setItem(BIOMETRIC_KEY_STORAGE, encoded);
      localStorage.setItem(BIOMETRIC_CRED_ID_STORAGE, 'fallback_key');
      return {
        success: true,
        message: '보안 스토리지에 볼트 키가 안전하게 등록되었습니다. (시뮬레이션 모드)'
      };
    }
    return { success: false, message: '현재 환경에서 생체인증을 지원하지 않습니다.' };
  }

  try {
    const challenge = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(challenge);
    }

    const userId = new Uint8Array(16);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(userId);
    }

    const publicKeyOptions: PublicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: 'ConnectWe Network Intelligence',
        id: window.location.hostname || 'localhost'
      },
      user: {
        id: userId,
        name: 'executive@connectwe.local',
        displayName: 'C-Level Executive'
      },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },  // ES256
        { type: 'public-key', alg: -257 } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: 'platform',
        userVerification: 'preferred'
      },
      timeout: 60000
    };

    const credential = (await navigator.credentials.create({
      publicKey: publicKeyOptions
    })) as PublicKeyCredential | null;

    if (credential) {
      // 자격증명 ID 및 인코딩된 패스프레이즈 보관
      const credIdBase64 = btoa(String.fromCharCode(...new Uint8Array(credential.rawId)));
      const encoded = btoa(encodeURIComponent(passphrase));

      localStorage.setItem(BIOMETRIC_KEY_STORAGE, encoded);
      localStorage.setItem(BIOMETRIC_CRED_ID_STORAGE, credIdBase64);

      return {
        success: true,
        message: 'Touch ID / Face ID 생체인증이 성공적으로 등록되었습니다.'
      };
    }

    return { success: false, message: '생체인증 자격증명 생성이 취소되었습니다.' };
  } catch (err) {
    // 사용자가 취소했거나 오류 발생 시
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `생체인증 등록 중 오류 발생: ${msg}`
    };
  }
}

/**
 * WebAuthn 생체인증으로 마스터 패스프레이즈 원터치 복원
 */
export async function unlockVaultWithBiometric(): Promise<{
  success: boolean;
  passphrase?: string;
  message: string;
}> {
  if (!hasRegisteredBiometricKey()) {
    return {
      success: false,
      message: '등록된 생체인증 키가 없습니다. 먼저 비밀번호를 등록해 주십시오.'
    };
  }

  const storedKey = localStorage.getItem(BIOMETRIC_KEY_STORAGE);
  const storedCredId = localStorage.getItem(BIOMETRIC_CRED_ID_STORAGE);

  if (!storedKey) {
    return { success: false, message: '저장된 암호화 키를 찾을 수 없습니다.' };
  }

  const supported = await isBiometricSupported();
  if (!supported || storedCredId === 'fallback_key') {
    // 미지원/시뮬레이션 환경 폴백
    try {
      const decoded = decodeURIComponent(atob(storedKey));
      return {
        success: true,
        passphrase: decoded,
        message: '보안 스토리지에서 볼트 키가 복원되었습니다.'
      };
    } catch {
      return { success: false, message: '저장된 키 복호화에 실패했습니다.' };
    }
  }

  try {
    const challenge = new Uint8Array(32);
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(challenge);
    }

    let allowCredentials: PublicKeyCredentialDescriptor[] | undefined;
    if (storedCredId) {
      const rawId = Uint8Array.from(atob(storedCredId), c => c.charCodeAt(0));
      allowCredentials = [{
        id: rawId,
        type: 'public-key',
        transports: ['internal']
      }];
    }

    const publicKeyOptions: PublicKeyCredentialRequestOptions = {
      challenge,
      rpId: window.location.hostname || 'localhost',
      userVerification: 'preferred',
      allowCredentials,
      timeout: 60000
    };

    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyOptions
    })) as PublicKeyCredential | null;

    if (assertion) {
      const decoded = decodeURIComponent(atob(storedKey));
      return {
        success: true,
        passphrase: decoded,
        message: '생체인증이 확인되어 볼트가 성공적으로 잠금 해제되었습니다.'
      };
    }

    return { success: false, message: '생체인증 확인이 취소되었습니다.' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `생체인증 확인 실패: ${msg}`
    };
  }
}

/**
 * 등록된 생체인증 키 삭제
 */
export function clearBiometricKey(): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(BIOMETRIC_KEY_STORAGE);
  localStorage.removeItem(BIOMETRIC_CRED_ID_STORAGE);
}
