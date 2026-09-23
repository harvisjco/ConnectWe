import { Person } from '../types/network';
import { estimateAgeGroup, inferDomainFromDeptAndTitle } from './rememberParser';

export interface NavigatorContacts {
  select: (
    properties: ('name' | 'email' | 'tel' | 'address' | 'icon')[],
    options?: { multiple?: boolean }
  ) => Promise<any[]>;
  getProperties: () => Promise<string[]>;
}

/**
 * 브라우저의 Contact Picker API 지원 여부 확인
 */
export function isContactPickerSupported(): boolean {
  return typeof navigator !== 'undefined' && 'contacts' in navigator && 'ContactsManager' in window;
}

/**
 * 모바일 단말기 주소록 선택기를 열어 인맥 직접 가져오기
 */
export async function pickContactsFromDevice(): Promise<{
  supported: boolean;
  people: Person[];
  errorMessage?: string;
}> {
  if (!isContactPickerSupported()) {
    return {
      supported: false,
      people: [],
      errorMessage: '현재 사용 중인 브라우저는 모바일 주소록 직접 연동(Contact Picker API)을 지원하지 않습니다. 리멤버 CSV 또는 vCard(.vcf) 파일 가져오기를 이용해 주세요.'
    };
  }

  try {
    const nav = navigator as any;
    const props = ['name', 'tel', 'email'];
    const results = await nav.contacts.select(props, { multiple: true });

    if (!results || results.length === 0) {
      return { supported: true, people: [] };
    }

    const people: Person[] = results.map((item: any, idx: number) => {
      const name = Array.isArray(item.name) ? item.name[0] : (item.name || '성명 미상');
      const mobile = Array.isArray(item.tel) ? item.tel[0] : (item.tel || '010-0000-0000');
      const email = Array.isArray(item.email) ? item.email[0] : (item.email || `${name.toLowerCase()}@addressbook.net`);

      const { ageGroup, isEstimated, birthYear } = estimateAgeGroup('파트너', 2);
      const domain = inferDomainFromDeptAndTitle('', '전문가', '');

      return {
        id: `phone_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
        name,
        currentCompany: '스마트폰 주소록 인맥',
        currentDepartment: '',
        currentTitle: '전문가',
        mobile,
        email,
        birthYear,
        estimatedAgeGroup: ageGroup,
        isAgeEstimated: isEstimated,
        primaryDomain: domain,
        skills: [domain],
        careers: [
          {
            id: `cr_phone_${idx}`,
            companyName: '개인/전문가',
            title: '소속원',
            startYear: birthYear ? birthYear + 27 : 2022,
            isCurrent: true,
            source: 'SOURCE_DATA'
          }
        ],
        academics: [],
        sourceType: 'SOURCE_DATA',
        closeness: 2,
        connectionChannel: 'vcard',
        isStale: false,
        memo: '스마트폰 단말 주소록(Contact Picker) 직접 동기화'
      };
    });

    return { supported: true, people };
  } catch (err: any) {
    return {
      supported: true,
      people: [],
      errorMessage: err.message || '주소록 선택이 취소되었거나 권한이 거부되었습니다.'
    };
  }
}
