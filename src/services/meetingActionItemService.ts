export interface MeetingActionItem {
  id: string;
  personId: string;
  content: string;
  isCompleted: boolean;
  detectedDate: string; // YYYY-MM-DD
  dueDateHint?: string;
  sourceMeetingId?: string;
}

const STORAGE_KEY = 'connectwe_meeting_action_items';

// 행동/약속 검출 키워드 정규식
const ACTION_PATTERNS = [
  /(?:하기로\s*함|송부|공유|전달|검토|요청|일정\s*조율|미팅|회신|확인|준비|보고)(?:\s*(?:예정|바람|요망|필요|완료|계획))?/i,
  /[~～]\s*까지/i,
  /D-?\d+/i
];

// 마감일/시기 힌트 정규식
const DUE_DATE_PATTERNS = /(?:내일|모레|다음\s*주|금주|이번\s*주|\d+월\s*\d+일|\d+일\s*(?:뒤|후|내))/;

/**
 * 미팅 메모 및 자유 텍스트에서 액션 아이템 자동 추출
 */
export function extractActionItemsFromText(
  text: string,
  personId: string,
  meetingId?: string
): MeetingActionItem[] {
  if (!text || !text.trim()) return [];

  const lines = text
    .split(/\r?\n|[.!?]\s+/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 4);

  const todayStr = new Date().toISOString().slice(0, 10);
  const items: MeetingActionItem[] = [];

  lines.forEach((line, index) => {
    const isAction = ACTION_PATTERNS.some((pattern) => pattern.test(line));
    if (isAction) {
      const dueMatch = line.match(DUE_DATE_PATTERNS);
      items.push({
        id: `act-${Date.now()}-${index}-${Math.random().toString(36).slice(2, 6)}`,
        personId,
        content: line,
        isCompleted: false,
        detectedDate: todayStr,
        dueDateHint: dueMatch ? dueMatch[0] : undefined,
        sourceMeetingId: meetingId
      });
    }
  });

  return items;
}

function getStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage;
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * 로컬 스토리지에서 전체 또는 특정 인물의 액션 아이템 목록 로드
 */
export function loadActionItems(personId?: string): MeetingActionItem[] {
  try {
    const storage = getStorage();
    if (!storage) return [];
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const allItems: MeetingActionItem[] = JSON.parse(raw);
    if (!Array.isArray(allItems)) return [];
    if (personId) {
      return allItems.filter((i) => i.personId === personId);
    }
    return allItems;
  } catch {
    return [];
  }
}

/**
 * 신규 액션 아이템 일괄 저장 (기존 중복 내용 배제)
 */
export function saveActionItems(newItems: MeetingActionItem[]): void {
  try {
    const current = loadActionItems();
    const existingContents = new Set(current.map((c) => `${c.personId}:::${c.content}`));
    const toAdd = newItems.filter((item) => !existingContents.has(`${item.personId}:::${item.content}`));
    const updated = [...toAdd, ...current];
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.warn('Failed to save action items to storage', err);
  }
}

/**
 * 특정 액션 아이템 완료 상태 토글
 */
export function toggleActionItem(id: string): MeetingActionItem[] {
  try {
    const current = loadActionItems();
    const updated = current.map((i) => (i.id === id ? { ...i, isCompleted: !i.isCompleted } : i));
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

/**
 * 특정 액션 아이템 삭제
 */
export function deleteActionItem(id: string): MeetingActionItem[] {
  try {
    const current = loadActionItems();
    const updated = current.filter((i) => i.id !== id);
    getStorage()?.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}
