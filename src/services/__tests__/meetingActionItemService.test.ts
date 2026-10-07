import { describe, it, expect, beforeEach } from 'vitest';
import {
  extractActionItemsFromText,
  loadActionItems,
  saveActionItems,
  toggleActionItem,
  deleteActionItem,
  MeetingActionItem
} from '../meetingActionItemService';

// Vitest/Node 환경용 in-memory localStorage Mock
const storageMap = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => storageMap.get(key) ?? null,
  setItem: (key: string, value: string) => storageMap.set(key, value),
  removeItem: (key: string) => storageMap.delete(key),
  clear: () => storageMap.clear(),
  get length() {
    return storageMap.size;
  },
  key: (index: number) => Array.from(storageMap.keys())[index] ?? null
};

(globalThis as any).localStorage = localStorageMock;

describe('MeetingActionItemService Unit Tests', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('extracts action items from text containing promise and request keywords', () => {
    const meetingNotes = `
오늘 이사님과 판교에서 만나 즐거운 티타임을 가졌습니다.
다음 주 금요일까지 투자 IR 자료를 이메일로 송부하기로 함.
신규 아키텍처 도입과 관련하여 기술 백서 검토 요청.
점심 식사 메뉴가 아주 정갈했습니다.
`;

    const items = extractActionItemsFromText(meetingNotes, 'person-123', 'meeting-456');

    expect(items.length).toBeGreaterThanOrEqual(2);
    expect(items.some((i) => i.content.includes('IR 자료를 이메일로 송부하기로 함'))).toBe(true);
    expect(items.some((i) => i.content.includes('기술 백서 검토 요청'))).toBe(true);
    expect(items.every((i) => i.personId === 'person-123')).toBe(true);
  });

  it('detects due date hints correctly', () => {
    const text = '다음 주까지 계약서 초안을 확인 및 전달 예정.';
    const items = extractActionItemsFromText(text, 'person-123');

    expect(items).toHaveLength(1);
    expect(items[0].dueDateHint).toBe('다음 주');
  });

  it('saves and loads action items from local storage', () => {
    const item1: MeetingActionItem = {
      id: 'act-1',
      personId: 'person-A',
      content: '추가 미팅 일정 조율',
      isCompleted: false,
      detectedDate: '2026-10-08'
    };

    saveActionItems([item1]);
    const loaded = loadActionItems('person-A');
    expect(loaded).toHaveLength(1);
    expect(loaded[0].content).toBe('추가 미팅 일정 조율');
    expect(loaded[0].isCompleted).toBe(false);
  });

  it('toggles completion status of an action item', () => {
    const item: MeetingActionItem = {
      id: 'act-toggle',
      personId: 'person-B',
      content: '비즈니스 파트너십 제안서 송부',
      isCompleted: false,
      detectedDate: '2026-10-08'
    };

    saveActionItems([item]);
    const afterToggle = toggleActionItem('act-toggle');
    const target = afterToggle.find((i) => i.id === 'act-toggle');
    expect(target?.isCompleted).toBe(true);
  });

  it('deletes an action item correctly', () => {
    const item: MeetingActionItem = {
      id: 'act-del',
      personId: 'person-C',
      content: '삭제할 테스트 할 일',
      isCompleted: false,
      detectedDate: '2026-10-08'
    };

    saveActionItems([item]);
    expect(loadActionItems('person-C')).toHaveLength(1);

    deleteActionItem('act-del');
    expect(loadActionItems('person-C')).toHaveLength(0);
  });
});

