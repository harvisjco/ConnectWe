import { describe, it, expect } from 'vitest';
import { auditExecutiveTone, sanitizeExecutiveTone, polishToneForCluster } from '../executiveToneService';

describe('executiveToneService (경영진 품격 감수 AI 엔진)', () => {
  it('금지 어휘가 없는 정상적인 텍스트는 100점 만점 및 isSafe=true를 반환해야 한다', () => {
    const text = '소중한 인연과 함께 전략 협업 룸에서 정중한 일정 조율을 진행합니다.';
    const result = auditExecutiveTone(text);

    expect(result.isSafe).toBe(true);
    expect(result.score).toBe(100);
    expect(result.violations.length).toBe(0);
    expect(result.sanitizedText).toBe(text);
  });

  it('군사·사냥 어휘(타깃, 침투, 워룸)를 감지하고 감점 및 순화 텍스트를 제공해야 한다', () => {
    const text = '이번 분기 핵심 타깃 기업에 침투하기 위해 워룸을 소집합니다.';
    const result = auditExecutiveTone(text);

    expect(result.isSafe).toBe(false);
    expect(result.score).toBeLessThanOrEqual(40);
    expect(result.violations.length).toBeGreaterThanOrEqual(3);

    // 순화 텍스트 검증
    expect(result.sanitizedText).not.toContain('타깃');
    expect(result.sanitizedText).not.toContain('침투');
    expect(result.sanitizedText).not.toContain('워룸');
    expect(result.sanitizedText).toContain('관심 인재');
    expect(result.sanitizedText).toContain('전략 협업 룸');
  });

  it('도구화·화폐화 어휘(바운티, 인맥 자산)를 순화해야 한다', () => {
    const text = '인재 추천 바운티를 지급하고 총 인맥 자산을 확대합니다.';
    const sanitized = sanitizeExecutiveTone(text);

    expect(sanitized).not.toContain('바운티');
    expect(sanitized).not.toContain('인맥 자산');
    expect(sanitized).toContain('추천 감사 리워드');
    expect(sanitized).toContain('소중한 인연');
  });

  it('5대 인재 클러스터별로 격조 높은 어조로 윤문(Tone Polisher)을 수행해야 한다', () => {
    const draft = '다음 주 미팅 가능한가요?';
    
    // 1. 상장사 거버넌스 리더
    const listedResult = polishToneForCluster(draft, 'LISTED_EXECUTIVE', {
      recipientName: '홍길동',
      recipientCompany: '삼성전자',
      recipientTitle: '전무'
    });
    expect(listedResult).toContain('홍길동 전무님께');
    expect(listedResult).toContain('전자공시(DART)');
    expect(listedResult).toContain('투명한 공적 거버넌스');

    // 2. 어자일 벤처 리더
    const ventureResult = polishToneForCluster(draft, 'VENTURE_LEADER', {
      recipientName: '이수민',
      recipientCompany: '비바리퍼블리카',
      recipientTitle: '대표'
    });
    expect(ventureResult).toContain('신속한 의사결정과 역동적인 사업 스케일업');

    // 3. 딥테크 R&D 펠로우
    const techResult = polishToneForCluster(draft, 'TECH_FELLOW', {
      recipientName: '김철수',
      recipientCompany: '네이버 클라우드',
      recipientTitle: '수석연구원'
    });
    expect(techResult).toContain('원천 기술 R&D 성과');
    expect(techResult).toContain('공학적 통찰');
  });
});
