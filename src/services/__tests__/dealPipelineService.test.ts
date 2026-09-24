import { describe, it, expect } from 'vitest';
import { calculateDealHealthScore, DealStakeholder } from '../dealPipelineService';

describe('dealPipelineService - calculateDealHealthScore', () => {
  it('스테이크홀더가 없을 경우 건전도 점수는 기본 15점이어야 한다', () => {
    const score = calculateDealHealthScore([]);
    expect(score).toBe(15);
  });

  it('의사결정권자(DECISION_MAKER)가 포함되면 점수가 유의미하게 상승해야 한다', () => {
    const stakeholders: DealStakeholder[] = [
      {
        personId: 'p1',
        personName: '김대표',
        company: '삼성전자',
        title: '대표이사',
        role: 'DECISION_MAKER',
        closeness: 1,
        isDartExecutive: true,
      },
    ];

    const score = calculateDealHealthScore(stakeholders);
    // Base 10 + Role 40 + Closeness 15 + DART 15 = 80
    expect(score).toBeGreaterThanOrEqual(75);
  });

  it('챔피언과 의사결정권자가 모두 포진하고 DART 임원이 결합되면 100점 만점을 초과하지 않고 100점으로 클램프되어야 한다', () => {
    const stakeholders: DealStakeholder[] = [
      {
        personId: 'p1',
        personName: '김대표',
        company: '카카오',
        title: '대표이사',
        role: 'DECISION_MAKER',
        closeness: 1,
        isDartExecutive: true,
      },
      {
        personId: 'p2',
        personName: '이부사장',
        company: '카카오',
        title: '부사장',
        role: 'CHAMPION',
        closeness: 1,
        isDartExecutive: true,
      },
      {
        personId: 'p3',
        personName: '박팀장',
        company: '카카오',
        title: '팀장',
        role: 'INFLUENCER',
        closeness: 2,
        isDartExecutive: false,
      },
    ];

    const score = calculateDealHealthScore(stakeholders);
    expect(score).toBe(100);
  });
});
