import { Person, ActivityLog } from '../types/network';
import { INITIAL_PEOPLE_SEED } from '../data/mockNetworkData';

const PEOPLE_STORAGE_KEY = 'connectwe_people_v1';
const ACTIVITY_LOGS_KEY = 'connectwe_activity_logs_v1';

/**
 * 로컬 스토리지에서 인맥 데이터 로드 (없을 경우 초기 시드 반환)
 */
export function loadPeopleFromStorage(): Person[] {
  try {
    const raw = localStorage.getItem(PEOPLE_STORAGE_KEY);
    if (!raw) {
      savePeopleToStorage(INITIAL_PEOPLE_SEED);
      return INITIAL_PEOPLE_SEED;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
    return INITIAL_PEOPLE_SEED;
  } catch (err) {
    console.error('Failed to load people from localStorage:', err);
    return INITIAL_PEOPLE_SEED;
  }
}

/**
 * 인맥 데이터 로컬 스토리지 저장
 */
export function savePeopleToStorage(people: Person[]): void {
  try {
    localStorage.setItem(PEOPLE_STORAGE_KEY, JSON.stringify(people));
  } catch (err) {
    console.error('Failed to save people to localStorage:', err);
  }
}

/**
 * 소통 활동 로그 로드
 */
export function loadActivityLogs(): ActivityLog[] {
  try {
    const raw = localStorage.getItem(ACTIVITY_LOGS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load activity logs from localStorage:', err);
    return [];
  }
}

/**
 * 소통 활동 로그 저장
 */
export function saveActivityLogs(logs: ActivityLog[]): void {
  try {
    localStorage.setItem(ACTIVITY_LOGS_KEY, JSON.stringify(logs));
  } catch (err) {
    console.error('Failed to save activity logs to localStorage:', err);
  }
}

/**
 * 특정 인물에 대한 소통 로그를 추가하고 인맥의 stale 상태 해제
 */
export function recordCommunication(
  personId: string, 
  type: ActivityLog['type'], 
  title: string, 
  content?: string
): { updatedLogs: ActivityLog[]; updatedPeople: Person[] } {
  const currentLogs = loadActivityLogs();
  const currentPeople = loadPeopleFromStorage();
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = now.toTimeString().slice(0, 5);

  const newLog: ActivityLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    personId,
    type,
    title,
    content,
    loggedAt: `${dateStr} ${timeStr}`
  };

  const updatedLogs = [newLog, ...currentLogs];
  saveActivityLogs(updatedLogs);

  // 대상 인물의 lastContactDate 갱신 및 isStale false 처리
  const updatedPeople = currentPeople.map(p => {
    if (p.id === personId) {
      return {
        ...p,
        lastContactDate: dateStr,
        isStale: false
      };
    }
    return p;
  });

  savePeopleToStorage(updatedPeople);

  return { updatedLogs, updatedPeople };
}

/**
 * 전체 백업 JSON 생성 및 다운로드
 */
export function exportBackupJson(): void {
  const people = loadPeopleFromStorage();
  const logs = loadActivityLogs();
  const backupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    totalPeople: people.length,
    people,
    activityLogs: logs
  };

  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `ConnectWe_Backup_${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 백업 JSON 파일로부터 데이터 복원
 */
export function restoreBackupFromJson(jsonStr: string): { success: boolean; message: string; people: Person[] } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data.people || !Array.isArray(data.people)) {
      return { success: false, message: '올바른 ConnectWe 백업 형식이 아닙니다.', people: [] };
    }

    savePeopleToStorage(data.people);
    if (Array.isArray(data.activityLogs)) {
      saveActivityLogs(data.activityLogs);
    }

    return { 
      success: true, 
      message: `성공적으로 ${data.people.length}명의 인맥 데이터가 복원되었습니다.`, 
      people: data.people 
    };
  } catch (err) {
    return { success: false, message: 'JSON 파싱 오류가 발생했습니다.', people: [] };
  }
}

/**
 * 스토리지 초기 시드로 리셋
 */
export function resetStorage(): Person[] {
  savePeopleToStorage(INITIAL_PEOPLE_SEED);
  saveActivityLogs([]);
  return INITIAL_PEOPLE_SEED;
}
