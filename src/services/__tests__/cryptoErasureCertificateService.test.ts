import { describe, it, expect } from 'vitest';
import {
  maskPersonalInfo,
  cryptoShredObject,
  issueErasureCertificate,
  formatErasureCertificateDocument
} from '../cryptoErasureCertificateService';

describe('cryptoErasureCertificateService - GDPR 잊힐 권리 암호학적 완전 파기 인증서 검증', () => {
  describe('maskPersonalInfo', () => {
    it('성명과 기업명을 개인정보 유출 방지용으로 안전하게 마스킹해야 한다', () => {
      expect(maskPersonalInfo('이재용', '삼성전자')).toEqual({
        maskedName: '이*용',
        maskedCompany: '삼성***'
      });
      expect(maskPersonalInfo('김철', 'LG')).toEqual({
        maskedName: '김*',
        maskedCompany: 'LG***'
      });
      expect(maskPersonalInfo('스티브잡스', '애플코리아')).toEqual({
        maskedName: '스***스',
        maskedCompany: '애플***'
      });
    });
  });

  describe('cryptoShredObject', () => {
    it('객체 내 모든 속성을 난수 덮어쓰기 후 완전히 삭제(Crypto-shredding)해야 한다', () => {
      const sensitiveData: Record<string, any> = {
        name: '민감 인맥',
        mobile: '010-1234-5678',
        memo: '극비 협상 내역'
      };

      cryptoShredObject(sensitiveData);

      expect(Object.keys(sensitiveData).length).toBe(0);
      expect(sensitiveData.name).toBeUndefined();
      expect(sensitiveData.mobile).toBeUndefined();
    });
  });

  describe('issueErasureCertificate', () => {
    it('SHA-256 전자서명과 비가역 솔트 해시가 포함된 공식 파기 인증서를 발급해야 한다', async () => {
      const cert = await issueErasureCertificate({
        personId: 'person-secret-999',
        personName: '홍길동',
        personCompany: '대외비파트너스',
        operatorId: 'cso-officer',
        operatorRole: '정보보호최고책임자'
      });

      expect(cert.certificateId).toMatch(/^CW-ERASURE-\d{8}-[A-F0-9]+$/);
      expect(cert.erasedAt).toBeDefined();
      expect(cert.targetAnonymizedHash.length).toBeGreaterThanOrEqual(32);
      expect(cert.maskedName).toBe('홍*동');
      expect(cert.maskedCompany).toBe('대외***');
      expect(cert.erasureMethod).toBe('CRYPTO_SHREDDING_3PASS_ZEROIZE');
      expect(cert.complianceStandards).toContain('GDPR Article 17 (Right to Erasure / 잊힐 권리)');
      expect(cert.complianceStandards).toContain('개인정보보호법 제21조 (개인정보의 파기)');
      expect(cert.cryptographicProof.signatureDigest.length).toBeGreaterThanOrEqual(32);
      expect(cert.cryptographicProof.erasureVerificationToken).toContain('PROOF-V1-');
    });
  });

  describe('formatErasureCertificateDocument', () => {
    it('법무/감사 제출용 공식 인증서 텍스트 문서를 올바르게 생성해야 한다', async () => {
      const cert = await issueErasureCertificate({
        personId: 'person-1',
        personName: '김대표',
        personCompany: '카카오'
      });

      const doc = formatErasureCertificateDocument(cert);

      expect(doc).toContain('ConnectWe 공식 데이터 암호학적 완전 파기 증명서');
      expect(doc).toContain(cert.certificateId);
      expect(doc).toContain(cert.cryptographicProof.erasureVerificationToken);
      expect(doc).toContain('3회 난수 덮어쓰기 비가역 파기');
      expect(doc).toContain('ISO/IEC 27001:2022');
    });
  });
});
