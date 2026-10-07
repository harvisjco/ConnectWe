import { describe, it, expect } from 'vitest';
import {
  generateBusinessLetter,
  LETTER_SCENARIOS
} from '../businessLetterTemplateService';
import { Person } from '../../types/network';

const mockPerson: Person = {
  id: 'p-test',
  name: '강태우',
  currentCompany: '넥스트반도체',
  currentTitle: '부사장',
  currentDepartment: '설계총괄',
  mobile: '010-3333-4444',
  email: 'tw.kang@nextsemi.com',
  primaryDomain: 'HBM 패키징',
  skills: ['HBM', '2.5D 패키징'],
  closeness: 3,
  careers: [],
  academics: [],
  sourceType: 'DART_FACT',
  connectionChannel: 'dart',
  estimatedAgeGroup: '40s',
  isAgeEstimated: false,
  isStale: false
};

describe('BusinessLetterTemplateService Unit Tests', () => {
  it('defines 5 standard executive letter scenarios', () => {
    expect(LETTER_SCENARIOS).toHaveLength(5);
    const types = LETTER_SCENARIOS.map((s) => s.type);
    expect(types).toContain('TEA_TIME_INVITE');
    expect(types).toContain('POST_MEETING_THANKS');
    expect(types).toContain('COLLABORATION_REQUEST');
    expect(types).toContain('PROMOTION_CONGRATS');
    expect(types).toContain('WARM_RECONNECT');
  });

  it('generates TEA_TIME_INVITE letter with personalized person attributes', () => {
    const letter = generateBusinessLetter(mockPerson, 'TEA_TIME_INVITE', {
      senderName: '홍길동',
      senderCompany: 'ConnectWe 인텔리전스',
      customTopic: '차세대 HBM 전략'
    });

    expect(letter).toContain('안녕하십니까, 넥스트반도체 강태우 부사장님.');
    expect(letter).toContain('HBM 패키징 분야의 선도적인 통찰');
    expect(letter).toContain('[차세대 HBM 전략]');
    expect(letter).toContain('홍길동 드림');
    expect(letter).toContain('ConnectWe 인텔리전스');
  });

  it('generates POST_MEETING_THANKS letter with custom follow-up topic', () => {
    const letter = generateBusinessLetter(mockPerson, 'POST_MEETING_THANKS', {
      senderName: '이진우',
      customTopic: '공동 실증(PoC) 일정 합의'
    });

    expect(letter).toContain('안녕하십니까, 강태우 부사장님.');
    expect(letter).toContain('오늘 바쁘신 일정 중에도 귀한 시간을 내어주시고');
    expect(letter).toContain('[공동 실증(PoC) 일정 합의]');
    expect(letter).toContain('이진우 드림');
  });

  it('generates PROMOTION_CONGRATS and WARM_RECONNECT letters cleanly', () => {
    const congrats = generateBusinessLetter(mockPerson, 'PROMOTION_CONGRATS');
    expect(congrats).toContain('금번 넥스트반도체에서의 영전(취임) 소식');

    const reconnect = generateBusinessLetter(mockPerson, 'WARM_RECONNECT');
    expect(reconnect).toContain('오랜만에 반가운 마음으로 소식 전합니다');
  });
});

