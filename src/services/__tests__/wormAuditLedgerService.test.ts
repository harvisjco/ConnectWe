import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordAuditEvent,
  getAuditLedger,
  verifyLedgerIntegrity,
  exportAuditReportJson,
  clearAuditLedger,
  GENESIS_PREVIOUS_HASH
} from '../wormAuditLedgerService';

describe('wormAuditLedgerService - WORM 불변 감사 추적 원장 및 해시 체인 검증', () => {
  beforeEach(() => {
    clearAuditLedger();
  });

  it('최초 제네시스 블록은 GENESIS_PREVIOUS_HASH를 가리키며 유효한 SHA-256 해시를 가져야 한다', async () => {
    const block = await recordAuditEvent({
      actorId: 'usr-admin-01',
      actorRole: 'CEO / 최고경영자',
      actionType: 'VIEW_EXECUTIVE_DOSSIER',
      targetId: 'p-100',
      targetName: '이재용 회장',
      clientIpMasked: '211.234.120.***'
    });

    expect(block.index).toBe(0);
    expect(block.previousHash).toBe(GENESIS_PREVIOUS_HASH);
    expect(block.currentHash.length).toBeGreaterThanOrEqual(32);
    expect(block.targetName).toBe('이재용 회장');
  });

  it('연속된 감사 이벤트 기록 시 블록체인처럼 직전 블록의 해시와 완벽하게 연결되어야 한다', async () => {
    const b0 = await recordAuditEvent({
      actorId: 'usr-admin-01',
      actorRole: 'CEO',
      actionType: 'VIEW_EXECUTIVE_DOSSIER',
      targetId: 'p-1',
      targetName: '김대표'
    });

    const b1 = await recordAuditEvent({
      actorId: 'usr-sec-02',
      actorRole: '비서실장',
      actionType: 'EXPORT_CSV',
      targetId: 'all',
      targetName: '주소록 전체 내보내기'
    });

    const b2 = await recordAuditEvent({
      actorId: 'usr-admin-01',
      actorRole: 'CEO',
      actionType: 'DART_QUERY',
      targetId: 'corp-001',
      targetName: '삼성전자 정기공시 조회'
    });

    const ledger = getAuditLedger();
    expect(ledger.length).toBe(3);
    expect(b1.previousHash).toBe(b0.currentHash);
    expect(b2.previousHash).toBe(b1.currentHash);

    const integrity = await verifyLedgerIntegrity();
    expect(integrity.isValid).toBe(true);
    expect(integrity.totalBlocks).toBe(3);
  });

  it('중간 블록의 페이로드가 임의로 변조될 경우 무결성 검증에서 즉시 실패를 감지해야 한다', async () => {
    await recordAuditEvent({
      actorId: 'usr-1',
      actorRole: 'Auditor',
      actionType: 'VIEW_EXECUTIVE_DOSSIER',
      targetId: 'p-1',
      targetName: '인맥 A'
    });

    const b1 = await recordAuditEvent({
      actorId: 'usr-1',
      actorRole: 'Auditor',
      actionType: 'UPDATE_PERSON',
      targetId: 'p-2',
      targetName: '인맥 B'
    });

    await recordAuditEvent({
      actorId: 'usr-1',
      actorRole: 'Auditor',
      actionType: 'DELETE_PERSON',
      targetId: 'p-3',
      targetName: '인맥 C'
    });

    // 해커가 b1의 targetName을 임의 변조 시뮬레이션
    b1.targetName = '위조된 인맥 이름';

    const check = await verifyLedgerIntegrity();
    expect(check.isValid).toBe(false);
    expect(check.brokenIndex).toBe(1);
    expect(check.message).toContain('변조 감지');
  });

  it('ISMS-P/SOC2 컴플라이언스 준수 JSON 감사 보고서가 정상 내보내기 되어야 한다', async () => {
    await recordAuditEvent({
      actorId: 'usr-audit',
      actorRole: 'Compliance Officer',
      actionType: 'VIEW_CONFIDENTIAL_NETWORK',
      targetId: 'group-board',
      targetName: '이사회 대외비 네트워크'
    });

    const json = exportAuditReportJson();
    const parsed = JSON.parse(json);

    expect(parsed.reportTitle).toContain('WORM');
    expect(parsed.totalBlocks).toBe(1);
    expect(parsed.standardCompliance).toContain('ISMS-P');
    expect(parsed.blocks[0].actionType).toBe('VIEW_CONFIDENTIAL_NETWORK');
  });
});
