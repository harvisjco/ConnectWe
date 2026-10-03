import { describe, it, expect } from 'vitest';
import { 
  calculateDealHealthScore, 
  DealStakeholder,
  parseDealAmount,
  formatAmountKorean,
  calculatePipelineMetrics
} from '../dealPipelineService';

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

  it('딜 규모 문자열을 원 단위 숫자로 정확히 파싱해야 한다', () => {
    expect(parseDealAmount('35억원 (연간)')).toBe(3500000000);
    expect(parseDealAmount('8.5억원')).toBe(850000000);
    expect(parseDealAmount('5000만원')).toBe(50000000);
    expect(parseDealAmount('전략적 제휴')).toBe(0);
  });

  it('원 단위 금액을 한국어 억/만원 포맷으로 품격 있게 변환해야 한다', () => {
    expect(formatAmountKorean(3500000000)).toBe('35억원');
    expect(formatAmountKorean(850000000)).toBe('8.5억원');
    expect(formatAmountKorean(50000000)).toBe('5,000만원');
    expect(formatAmountKorean(0)).toBe('규모 협의 중');
  });

  it('파이프라인 지표가 올바르게 합산 및 가중 계산되어야 한다', () => {
    const deals = [
      {
        id: 'deal-1',
        title: '대형 딜',
        targetCompany: '삼성전자',
        targetIndustry: 'IT',
        dealSize: '10억원',
        stage: 'PROPOSAL' as const,
        expectedCloseDate: '2026-12-31',
        stakeholders: [
          {
            personId: 'p1',
            personName: '김대표',
            company: '삼성전자',
            title: '대표이사',
            role: 'DECISION_MAKER' as const,
            closeness: 1,
            isDartExecutive: true
          }
        ],
        healthScore: 80
      },
      {
        id: 'deal-2',
        title: '완료된 딜',
        targetCompany: '카카오',
        targetIndustry: 'IT',
        dealSize: '5억원',
        stage: 'WON' as const,
        expectedCloseDate: '2026-10-31',
        stakeholders: [],
        healthScore: 50
      }
    ];

    const metrics = calculatePipelineMetrics(deals);
    expect(metrics.totalDeals).toBe(2);
    expect(metrics.wonDeals).toBe(1);
    expect(metrics.activeDeals).toBe(1);
    expect(metrics.totalPipelineVolume).toBe(1500000000); // 15억원
    expect(metrics.formattedTotalVolume).toBe('15억원');
    // 10억 * 0.8 + 5억 * 0.5 = 8억 + 2.5억 = 10.5억
    expect(metrics.weightedPipelineVolume).toBe(1050000000);
    expect(metrics.formattedWeightedVolume).toBe('10.5억원');
    expect(metrics.avgHealthScore).toBe(65);
    expect(metrics.keymanCoverage).toBe(50);
  });
});

