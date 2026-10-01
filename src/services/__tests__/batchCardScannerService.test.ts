import { describe, it, expect } from 'vitest';
import { 
  convertCardDataToPersonWithDart, 
  processBatchOcrResults 
} from '../batchCardScannerService';
import { ExtractedCardData } from '../cardOcrParser';

describe('batchCardScannerService (명함 일괄 스캔 & DART 자동 결합)', () => {
  it('일반 명함 데이터를 Person 객체로 변환하고 기본 필드를 생성해야 한다', () => {
    const cardData: ExtractedCardData = {
      name: '이진우',
      currentCompany: '넥스트비전',
      currentTitle: '대표이사 / CEO',
      currentDepartment: '경영전략실',
      mobile: '010-8888-9999',
      email: 'jinwoo@nextvision.io',
      primaryDomain: 'AI 솔루션',
      rawText: '이진우 대표이사'
    };

    const { person, isDartMatched } = convertCardDataToPersonWithDart(cardData, 'card_01.jpg');

    expect(person.name).toBe('이진우');
    expect(person.currentCompany).toBe('넥스트비전');
    expect(person.currentTitle).toBe('대표이사 / CEO');
    expect(person.mobile).toBe('010-8888-9999');
    expect(person.closeness).toBe(3);
    expect(isDartMatched).toBe(false);
  });

  it('다수의 명함 텍스트를 한 번에 일괄 처리하여 성공 목록을 반환해야 한다', () => {
    const inputs = [
      {
        id: 'item-1',
        fileName: 'card_tech.png',
        rawText: `Name: 김철수\nCompany: 카카오\nTitle: 소장\nMobile: 010-1234-5678\nEmail: cs.kim@kakao.com`
      },
      {
        id: 'item-2',
        fileName: 'card_startup.jpg',
        rawText: `Name: 박지민\nCompany: 스타트업에이아이\nTitle: 대표\nMobile: 010-2222-3333\nEmail: jm@startupai.com`
      }
    ];

    const results = processBatchOcrResults(inputs);

    expect(results.length).toBe(2);
    expect(results[0].status).toBe('SUCCESS');
    expect(results[0].person?.name).toBe('김철수');
    expect(results[1].status).toBe('SUCCESS');
    expect(results[1].person?.name).toBe('박지민');
  });
});
