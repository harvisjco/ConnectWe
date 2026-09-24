/**
 * Web Crypto API (AES-GCM 256-bit) 기반 엔터프라이즈 암호화 스토리지 유틸리티
 * 
 * 보안 하드닝 규격 (NIST SP 800-132 & OWASP 준수):
 * 1. 동적 무작위 Salt (16바이트 CSPRNG) 매 암호화마다 생성하여 레인보우 테이블 무력화
 * 2. PBKDF2 (310,000 iterations, SHA-256) 기반 고강도 키 유도
 * 3. AES-GCM 256-bit 무작위 IV (12바이트) 적용
 * 4. 바이너리 패키징: [Salt (16B)] + [IV (12B)] + [Ciphertext + AuthTag]
 * 5. Fail-Safe 원칙: 암호화/복호화 실패 시 평문을 절대 유출하지 않고 명시적 예외 발생
 */

const SALT_LENGTH = 16; // 128-bit Salt
const IV_LENGTH = 12;   // 96-bit IV for AES-GCM
const PBKDF2_ITERATIONS = 310000;

/**
 * 비밀번호와 솔트로부터 AES-GCM 256bit 암호화 키 유도 (PBKDF2)
 */
export async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('[Security] 암호화 마스터 패스프레이즈가 지정되지 않았습니다.');
  }

  const enc = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 텍스트 암호화 (Salt[16B] + IV[12B] + Ciphertext → Base64)
 * Fail-Safe: 암호화 실패 시 평문을 절대로 반환하지 않음
 */
export async function encryptData(
  plainText: string,
  passphrase: string
): Promise<string> {
  if (!plainText) return '';
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('[Security] 암호화에는 최소 1자 이상의 유효한 비밀번호가 필요합니다.');
  }

  try {
    // 1. 암호학적으로 안전한 동적 무작위 Salt & IV 생성 (CSPRNG)
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // 2. 솔트 기반 키 유도
    const key = await deriveKey(passphrase, salt);

    // 3. AES-GCM 암호화
    const enc = new TextEncoder();
    const encodedData = enc.encode(plainText);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    // 4. 단일 바이너리 결합: [Salt: 16B] + [IV: 12B] + [Ciphertext]
    const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + cipherBuffer.byteLength);
    combined.set(salt, 0);
    combined.set(iv, SALT_LENGTH);
    combined.set(new Uint8Array(cipherBuffer), SALT_LENGTH + IV_LENGTH);

    // 5. 안전한 Base64 인코딩
    let binary = '';
    for (let i = 0; i < combined.byteLength; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error('[Security] AES-256-GCM encryption failed:', err);
    throw new Error(`[Security] 데이터 암호화 실패: ${err instanceof Error ? err.message : String(err)}`);
  }
}

/**
 * 텍스트 복호화 (Base64 → Salt[16B] + IV[12B] + Ciphertext → 평문)
 */
export async function decryptData(
  cipherBase64: string,
  passphrase: string
): Promise<string> {
  if (!cipherBase64) return '';
  if (!passphrase || passphrase.trim().length === 0) {
    throw new Error('[Security] 복호화를 위한 비밀번호가 입력되지 않았습니다.');
  }

  try {
    const binary = atob(cipherBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // 최소 헤더 크기 검증 (Salt 16B + IV 12B = 28B 이상)
    if (bytes.length < SALT_LENGTH + IV_LENGTH) {
      throw new Error('암호화 데이터 형식이 올바르지 않습니다.');
    }

    // 1. 헤더로부터 동적 Salt 및 IV 분리
    const salt = bytes.slice(0, SALT_LENGTH);
    const iv = bytes.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
    const ciphertext = bytes.slice(SALT_LENGTH + IV_LENGTH);

    // 2. 분리된 솔트로 키 유도
    const key = await deriveKey(passphrase, salt);

    // 3. 복호화 수행 및 무결성 태그 검증
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    throw new Error('복호화 실패: 패스프레이즈가 일치하지 않거나 암호문이 손상되었습니다.');
  }
}
