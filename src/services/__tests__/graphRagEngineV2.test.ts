import { describe, it, expect } from 'vitest';
import { executeGraphRagQuery } from '../graphRagEngine';
import { INITIAL_PEOPLE_SEED } from '../../data/mockNetworkData';

describe('graphRagEngine V2 Refactored Tests', () => {
  it('prevents over-matching on VC query and selects relevant partners', () => {
    // 기존에는 11명 전원이 매칭되었던 쿼리
    const query = '글로벌 Top-tier VC/PE 투자 파트너 및 심사역';
    const result = executeGraphRagQuery(query, INITIAL_PEOPLE_SEED);

    // 개선 후: 전체(11명)가 아니라 실제 투자/파트너/심사역 관련 인재만 선별되어야 함
    expect(result.matchedPeople.length).toBeLessThan(INITIAL_PEOPLE_SEED.length);
    expect(result.matchedPeople.length).toBeGreaterThan(0);
    // 김도현(알토스캐피탈 파트너스, 수석심사역)이 포함되어야 함
    expect(result.matchedPeople.some(p => p.name === '김도현')).toBe(true);
    // 가장 연관도가 높은 인재가 상단에 위치해야 함
    expect(result.matchedPeople[0].name).toBe('김도현');
  });

  it('matches correctly with Korean pure choseong query', () => {
    // 'ㄱㅅㅇ' 입력 시 '김서연' 매칭
    const result = executeGraphRagQuery('ㄱㅅㅇ', INITIAL_PEOPLE_SEED);
    expect(result.matchedPeople.length).toBeGreaterThanOrEqual(1);
    expect(result.matchedPeople[0].name).toBe('김서연');
  });

  it('suggests didYouMean for typos', () => {
    // '네이벼' 입력 시 0건이지만 didYouMean으로 '네이버' 제안
    const result = executeGraphRagQuery('네이벼', INITIAL_PEOPLE_SEED);
    expect(result.didYouMean).toBe('네이버');
    expect(result.reasoning).toContain('네이버');
  });

  it('sorts matched results by relevance score descending', () => {
    // '네이버' 검색 시 현직/전직 네이버 알럼나이가 상단에 랭킹
    const result = executeGraphRagQuery('네이버', INITIAL_PEOPLE_SEED);
    expect(result.matchedPeople.length).toBeGreaterThan(0);
    // 김서연, 한동훈, 윤아름 등이 상위권에 배치되어야 함
    const topNames = result.matchedPeople.slice(0, 3).map(p => p.name);
    expect(topNames.includes('김서연') || topNames.includes('한동훈') || topNames.includes('윤아름')).toBe(true);
  });
});
