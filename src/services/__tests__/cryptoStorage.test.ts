import { describe, it, expect } from 'vitest';
import { encryptData, decryptData } from '../cryptoStorage';

describe('cryptoStorage - 엔터프라이즈 암호화 하드닝 검증', () => {
  const samplePlainText = JSON.stringify({
    name: '김대표',
    mobile: '010-9999-8888',
    memo: '전략 인수합병 M&A 극비 논의 진행 중',
  });
  const passphrase = 'SuperSecretMasterKey2026!@#';

  it('데이터가 정상적으로 암호화되고 올바른 비밀번호로 원본과 100% 동일하게 복호화되어야 한다', async () => {
    const cipher = await encryptData(samplePlainText, passphrase);
    expect(cipher).not.toBe(samplePlainText);
    expect(cipher.length).toBeGreaterThan(30);

    const decrypted = await decryptData(cipher, passphrase);
    expect(decrypted).toBe(samplePlainText);
  });

  it('동일한 평문과 동일한 비밀번호라도 매번 동적 무작위 Salt와 IV로 인해 서로 다른 암호문이 생성되어야 한다 (레인보우 테이블 무력화)', async () => {
    const cipher1 = await encryptData(samplePlainText, passphrase);
    const cipher2 = await encryptData(samplePlainText, passphrase);

    expect(cipher1).not.toBe(cipher2);

    // 그러나 둘 다 동일한 비밀번호로 정상 복호화 가능해야 함
    const dec1 = await decryptData(cipher1, passphrase);
    const dec2 = await decryptData(cipher2, passphrase);
    expect(dec1).toBe(samplePlainText);
    expect(dec2).toBe(samplePlainText);
  });

  it('잘못된 비밀번호로 복호화 시도 시 절대로 원문이 유출되지 않고 명시적 오류가 발생해야 한다 (Fail-Safe)', async () => {
    const cipher = await encryptData(samplePlainText, passphrase);

    await expect(decryptData(cipher, 'WrongPassword123!')).rejects.toThrow();
  });

  it('비밀번호가 비어있거나 공백일 경우 암호화 시도 시 즉각 에러가 발생해야 한다', async () => {
    await expect(encryptData(samplePlainText, '')).rejects.toThrow();
    await expect(encryptData(samplePlainText, '   ')).rejects.toThrow();
  });
});
