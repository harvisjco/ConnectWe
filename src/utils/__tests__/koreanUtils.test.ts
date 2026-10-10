import { describe, it, expect } from 'vitest';
import {
  getChoseong,
  isPureChoseong,
  matchChoseong,
  getLevenshteinDistance,
  findClosestMatch
} from '../koreanUtils';

describe('koreanUtils Unit Tests', () => {
  it('correctly extracts choseong from Korean text', () => {
    expect(getChoseong('김서연')).toBe('ㄱㅅㅇ');
    expect(getChoseong('네이버')).toBe('ㄴㅇㅂ');
    expect(getChoseong('비바리퍼블리카 토스')).toBe('ㅂㅂㄹㅍㅂㄹㅋ ㅌㅅ');
    expect(getChoseong('AI 펠로우')).toBe('AI ㅍㄹㅇ');
  });

  it('identifies pure choseong strings accurately', () => {
    expect(isPureChoseong('ㄱㅅㅇ')).toBe(true);
    expect(isPureChoseong('ㄴㅇㅂ')).toBe(true);
    expect(isPureChoseong('김서연')).toBe(false);
    expect(isPureChoseong('AI')).toBe(false);
    expect(isPureChoseong('')).toBe(false);
  });

  it('matches target text with choseong queries correctly', () => {
    expect(matchChoseong('김서연', 'ㄱㅅㅇ')).toBe(true);
    expect(matchChoseong('김서연 VP', 'ㄱㅅㅇ')).toBe(true);
    expect(matchChoseong('한동훈 CTO', 'ㅎㄷㅎ')).toBe(true);
    expect(matchChoseong('네이버 Clova', 'ㄴㅇㅂ')).toBe(true);
    expect(matchChoseong('김서연', 'ㅎㄷㅎ')).toBe(false);
  });

  it('calculates Levenshtein distance correctly', () => {
    expect(getLevenshteinDistance('네이버', '네이버')).toBe(0);
    expect(getLevenshteinDistance('네이버', '네이벼')).toBe(1);
    expect(getLevenshteinDistance('카카오', '카카')).toBe(1);
    expect(getLevenshteinDistance('삼성전자', '삼선전자')).toBe(1);
  });

  it('finds closest matching candidates for typos', () => {
    const candidates = ['네이버', '삼성전자', '카카오', '비바리퍼블리카', '토스'];
    expect(findClosestMatch('네이벼', candidates, 2)).toBe('네이버');
    expect(findClosestMatch('카카5', candidates, 2)).toBe('카카오');
    // 완전 일치 시에는 null 반환
    expect(findClosestMatch('네이버', candidates, 2)).toBeNull();
  });
});
