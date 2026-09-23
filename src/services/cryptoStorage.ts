/**
 * Web Crypto API (AES-GCM 256-bit) 기반 로컬 암호화 스토리지 유틸리티
 * 개인정보보호법(PIPA) 준수: 초민감 개인 연락처 및 메모를 브라우저 로컬스토리지에 안전하게 암호화 보관
 */

const SALT = new Uint8Array([0x43, 0x6f, 0x6e, 0x6e, 0x65, 0x63, 0x74, 0x57, 0x65, 0x53, 0x61, 0x6c, 0x74, 0x32, 0x30, 0x32]); // "ConnectWeSalt202"

/**
 * 디바이스 고유 키 또는 비밀번호로부터 AES-GCM 256bit 암호화 키 유도 (PBKDF2)
 */
async function deriveKey(passphrase: string): Promise<CryptoKey> {
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
      salt: SALT,
      iterations: 100000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * 텍스트 암호화 (IV + 암호문 -> Base64)
 */
export async function encryptData(plainText: string, masterKey: string = 'ConnectWe_Default_Local_Key_v1'): Promise<string> {
  try {
    const key = await deriveKey(masterKey);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for AES-GCM
    const enc = new TextEncoder();
    const encodedData = enc.encode(plainText);

    const cipherBuffer = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encodedData
    );

    // IV + Ciphertext 결합
    const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(cipherBuffer), iv.length);

    // Base64 변환
    let binary = '';
    const bytes = new Uint8Array(combined);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (err) {
    console.error('Encryption failed:', err);
    return plainText; // 폴백
  }
}

/**
 * 텍스트 복호화 (Base64 -> IV + 암호문 -> 평문)
 */
export async function decryptData(cipherBase64: string, masterKey: string = 'ConnectWe_Default_Local_Key_v1'): Promise<string> {
  try {
    const key = await deriveKey(masterKey);
    const binary = atob(cipherBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const iv = bytes.slice(0, 12);
    const ciphertext = bytes.slice(12);

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      ciphertext
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch (err) {
    // 암호화되지 않은 기존 평문 데이터일 경우 원문 반환
    return cipherBase64;
  }
}
