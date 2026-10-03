import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  signInWithDemoAccount, 
  signOut, 
  getCurrentUser, 
  getActiveUserId
} from '../authService';
import { 
  getPeopleStorageKey, 
  loadPeopleFromStorage, 
  savePeopleToStorage, 
  migrateGuestPeopleToUser,
  GUEST_PEOPLE_STORAGE_KEY 
} from '../storageService';
import { Person } from '../../types/network';

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
}

const mockStorage = new MockStorage();
vi.stubGlobal('localStorage', mockStorage);
vi.stubGlobal('window', { localStorage: mockStorage });

describe('authService & Multi-Tenant Data Isolation (개인별 인맥 격리 시스템)', () => {
  beforeEach(() => {
    mockStorage.clear();
    vi.clearAllMocks();
  });

  it('1. 사용자 ID에 따라 완벽히 분리된 로컬 스토리지 키(Namespace)를 생성해야 한다', () => {
    expect(getPeopleStorageKey()).toBe(GUEST_PEOPLE_STORAGE_KEY);
    expect(getPeopleStorageKey('guest')).toBe(GUEST_PEOPLE_STORAGE_KEY);
    expect(getPeopleStorageKey('user_123')).toBe('connectwe_people_usr_user_123');
    expect(getPeopleStorageKey('user_abc')).toBe('connectwe_people_usr_user_abc');
  });

  it('2. 데모 계정 로그인 시 사용자 프로필이 로드되고 활성 사용자 ID가 갱신되어야 한다', async () => {
    const demoUser = signInWithDemoAccount('partner@connectwe.corp');
    expect(demoUser.email).toBe('partner@connectwe.corp');
    expect(demoUser.id).toBe('usr_demo_c_level_77');
    expect(getActiveUserId()).toBe('usr_demo_c_level_77');

    const currentUser = await getCurrentUser();
    expect(currentUser?.email).toBe('partner@connectwe.corp');

    await signOut();
    expect(getActiveUserId()).toBeNull();
    const afterLogoutUser = await getCurrentUser();
    expect(afterLogoutUser).toBeNull();
  });

  it('3. User A와 User B의 인맥 데이터는 완벽히 상호 격리(Multi-Tenant Isolation)되어야 한다', () => {
    const alicePerson: Person = {
      id: 'p-alice-1',
      name: '앨리스 파트너',
      currentCompany: 'VC Partners',
      currentDepartment: '투자본부',
      currentTitle: '대표 파트너',
      mobile: '010-1111-2222',
      email: 'alice@vc.com',
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: 'VC 투자',
      skills: ['Series B'],
      careers: [],
      academics: [],
      sourceType: 'SOURCE_DATA',
      closeness: 1,
      connectionChannel: 'business_card',
      isStale: false
    };

    const bobPerson: Person = {
      id: 'p-bob-1',
      name: '밥 테크리드',
      currentCompany: 'AI Labs',
      currentDepartment: 'LLM팀',
      currentTitle: '수석 연구원',
      mobile: '010-3333-4444',
      email: 'bob@ailabs.com',
      estimatedAgeGroup: '30s',
      isAgeEstimated: false,
      primaryDomain: 'AI/LLM',
      skills: ['Transformer'],
      careers: [],
      academics: [],
      sourceType: 'SOURCE_DATA',
      closeness: 2,
      connectionChannel: 'business_card',
      isStale: false
    };

    // Alice 저장소에 저장
    savePeopleToStorage([alicePerson], 'usr_alice');

    // Bob 저장소에 저장
    savePeopleToStorage([bobPerson], 'usr_bob');

    // Alice로 로드 시 Alice 인맥만 조회됨
    const aliceData = loadPeopleFromStorage('usr_alice');
    expect(aliceData).toHaveLength(1);
    expect(aliceData[0].name).toBe('앨리스 파트너');

    // Bob으로 로드 시 Bob 인맥만 조회됨 (Alice 데이터 유출 0%)
    const bobData = loadPeopleFromStorage('usr_bob');
    expect(bobData).toHaveLength(1);
    expect(bobData[0].name).toBe('밥 테크리드');

    // 제3의 신규 사용자 Charlie로 로드 시 빈 배열 반환
    const charlieData = loadPeopleFromStorage('usr_charlie');
    expect(charlieData).toEqual([]);
  });

  it('4. 게스트 모드에서 등록한 인맥을 신규 계정으로 안전하게 마이그레이션할 수 있어야 한다', () => {
    const guestPerson: Person = {
      id: 'p-guest-card-1',
      name: '게스트 명함 인맥',
      currentCompany: '넥스트비전',
      currentDepartment: '기술본부',
      currentTitle: 'CTO',
      mobile: '010-9999-8888',
      email: 'cto@nextvision.com',
      estimatedAgeGroup: '40s',
      isAgeEstimated: false,
      primaryDomain: 'AI',
      skills: [],
      careers: [],
      academics: [],
      sourceType: 'SOURCE_DATA',
      closeness: 2,
      connectionChannel: 'business_card',
      isStale: false
    };

    // 게스트 모드 저장
    savePeopleToStorage([guestPerson], 'guest');

    // 신규 사용자 David 계정으로 마이그레이션 수행
    const result = migrateGuestPeopleToUser('usr_david');
    expect(result.migratedCount).toBe(1);
    expect(result.people).toHaveLength(1);
    expect(result.people[0].name).toBe('게스트 명함 인맥');

    // David 계정 저장소 확인
    const davidData = loadPeopleFromStorage('usr_david');
    expect(davidData).toHaveLength(1);
    expect(davidData[0].name).toBe('게스트 명함 인맥');
  });
});
