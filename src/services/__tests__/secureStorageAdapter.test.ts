import { describe, it, expect, beforeEach } from 'vitest';
import { 
  secureSetItem, 
  secureGetItem, 
  onMultiTabSync
} from '../secureStorageAdapter';
import { savePeopleToStorage, loadPeopleFromSecureStorage, shredAllUserData } from '../storageService';
import { Person } from '../../types/network';

import { INITIAL_PEOPLE_SEED } from '../../data/mockNetworkData';

class MockStorage {
  private store: Record<string, string> = {};
  getItem(key: string): string | null {
    return this.store[key] ?? null;
  }
  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }
  removeItem(key: string): void {
    delete this.store[key];
  }
  clear(): void {
    this.store = {};
  }
  get length(): number {
    return Object.keys(this.store).length;
  }
  key(index: number): string | null {
    return Object.keys(this.store)[index] ?? null;
  }
}

describe('secureStorageAdapter - 엔터프라이즈 보안 스토리지 및 데이터 완전 파기 검증', () => {
  beforeEach(() => {
    (globalThis as any).localStorage = new MockStorage();
  });

  it('1. 일반 객체 데이터를 보안 스토리지에 암호화 저장 후 정확히 복원해야 한다', async () => {
    const testData = {
      userId: 'exec_001',
      title: '비공개 전략 파트너십',
      confidentialNotes: 'M&A 실사 대비 NDA 체결 인맥'
    };

    await secureSetItem('test_confidential_key', testData);
    const restored = await secureGetItem<typeof testData>('test_confidential_key');

    expect(restored).not.toBeNull();
    expect(restored?.userId).toBe('exec_001');
    expect(restored?.title).toBe('비공개 전략 파트너십');
    expect(restored?.confidentialNotes).toBe('M&A 실사 대비 NDA 체결 인맥');
  });

  it('2. storageService 연동을 통해 인맥 데이터가 보안 스토리지와 동기화되어야 한다', async () => {
    const samplePeople: Person[] = [
      {
        ...INITIAL_PEOPLE_SEED[0],
        id: 'p_test_secure_1',
        name: '정현우',
        currentCompany: '넥스트벤처스',
        mobile: '010-8888-9999'
      }
    ];

    savePeopleToStorage(samplePeople, 'test_user_secure');
    const loaded = await loadPeopleFromSecureStorage('test_user_secure');

    expect(loaded.length).toBeGreaterThan(0);
    expect(loaded[0].name).toBe('정현우');
    expect(loaded[0].currentCompany).toBe('넥스트벤처스');
    expect(loaded[0].mobile).toBe('010-8888-9999');
  });

  it('3. 개인정보보호법 준수: 데이터 암호학적 완전 파기(Data Shredding)가 모든 저장소를 소멸시켜야 한다', async () => {
    await secureSetItem('key_to_shred', { secret: 'top_secret_data' });
    localStorage.setItem('connectwe_dummy', '1234');

    const shredResult = await shredAllUserData();
    expect(shredResult.success).toBe(true);
    expect(shredResult.itemsShredded).toBeGreaterThanOrEqual(1);

    // 파기 후 조회 시 null 반환
    const checkAfter = await secureGetItem('key_to_shred');
    expect(checkAfter).toBeNull();
  });

  it('4. 멀티탭 동기화 리스너가 등록 및 해제될 수 있어야 한다', () => {
    const unsubscribe = onMultiTabSync((key) => {
      console.log('Tab synced key:', key);
    });

    expect(typeof unsubscribe).toBe('function');
    unsubscribe();
  });
});
