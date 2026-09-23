import { Person, DataSourceType } from '../types/network';

/**
 * 전화번호 포맷 정규화 (하이픈 제거 및 통일)
 */
export function normalizePhoneNumber(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 11 && digits.startsWith('010')) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10 && (digits.startsWith('011') || digits.startsWith('016') || digits.startsWith('017') || digits.startsWith('018') || digits.startsWith('019'))) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return phone.trim();
}

/**
 * 2명의 Person 객체가 동일인인지 판별하는 휴리스틱
 */
export function isSamePerson(p1: Person, p2: Person): boolean {
  // 1. 휴대폰 번호 일치
  const phone1 = normalizePhoneNumber(p1.mobile);
  const phone2 = normalizePhoneNumber(p2.mobile);
  if (phone1 && phone2 && phone1 !== '010-0000-0000' && phone1 === phone2) {
    return true;
  }

  // 2. 이메일 일치 (테스트용/기본 도메인 제외)
  const isGenericEmail = (e: string) => e.includes('example.com') || e.includes('scan.local') || e.includes('addressbook.net');
  if (p1.email && p2.email && !isGenericEmail(p1.email) && !isGenericEmail(p2.email)) {
    if (p1.email.toLowerCase() === p2.email.toLowerCase()) {
      return true;
    }
  }

  // 3. 이름 + 현재 회사명이 완전 일치하는 경우
  if (p1.name && p2.name && p1.name === p2.name) {
    const cleanComp1 = p1.currentCompany.replace(/[\(주\)|주식회사|\s]/g, '').toLowerCase();
    const cleanComp2 = p2.currentCompany.replace(/[\(주\)|주식회사|\s]/g, '').toLowerCase();
    if (cleanComp1 && cleanComp2 && (cleanComp1 === cleanComp2 || cleanComp1.includes(cleanComp2) || cleanComp2.includes(cleanComp1))) {
      return true;
    }
  }

  return false;
}

/**
 * 두 Person 노드를 병합 (Fact 우선)
 */
export function mergePersons(target: Person, source: Person): Person {
  // 우선순위 결정: DART_FACT > SOURCE_DATA > ESTIMATED
  const getHigherPrioritySource = (s1: DataSourceType, s2: DataSourceType): DataSourceType => {
    if (s1 === 'DART_FACT' || s2 === 'DART_FACT') return 'DART_FACT';
    if (s1 === 'SOURCE_DATA' || s2 === 'SOURCE_DATA') return 'SOURCE_DATA';
    return 'ESTIMATED';
  };

  // 커리어 이력 병합 (중복 회사 제거)
  const combinedCareers = [...target.careers];
  for (const c of source.careers) {
    const exists = combinedCareers.some(existing => 
      existing.companyName.toLowerCase() === c.companyName.toLowerCase() && existing.title === c.title
    );
    if (!exists) {
      combinedCareers.push(c);
    }
  }

  // 학력 병합
  const combinedAcademics = [...target.academics];
  for (const a of source.academics) {
    const exists = combinedAcademics.some(existing => 
      existing.schoolName.toLowerCase() === a.schoolName.toLowerCase()
    );
    if (!exists) {
      combinedAcademics.push(a);
    }
  }

  // 스킬 병합
  const uniqueSkills = Array.from(new Set([...target.skills, ...source.skills]));

  return {
    ...target,
    currentCompany: target.sourceType === 'DART_FACT' ? target.currentCompany : (source.currentCompany || target.currentCompany),
    currentDepartment: target.currentDepartment || source.currentDepartment,
    currentTitle: target.sourceType === 'DART_FACT' ? target.currentTitle : (source.currentTitle || target.currentTitle),
    mobile: normalizePhoneNumber(target.mobile) || normalizePhoneNumber(source.mobile),
    email: target.email || source.email,
    birthYear: target.birthYear || source.birthYear,
    isAgeEstimated: target.birthYear ? target.isAgeEstimated : source.isAgeEstimated,
    estimatedAgeGroup: target.birthYear ? target.estimatedAgeGroup : source.estimatedAgeGroup,
    primaryDomain: target.primaryDomain || source.primaryDomain,
    skills: uniqueSkills,
    careers: combinedCareers,
    academics: combinedAcademics,
    sourceType: getHigherPrioritySource(target.sourceType, source.sourceType),
    dartInfo: target.dartInfo || source.dartInfo,
    closeness: Math.min(target.closeness, source.closeness) as 1 | 2 | 3 | 4 | 5,
    memo: [target.memo, source.memo].filter(Boolean).join('\n---\n')
  };
}

/**
 * 신규 인물 목록을 기존 인물 데이터베이스에 해소(Resolution) 및 병합
 */
export function resolveAndMergePeople(existing: Person[], incoming: Person[]): Person[] {
  const result = [...existing];

  for (const item of incoming) {
    const matchIdx = result.findIndex(p => isSamePerson(p, item));
    if (matchIdx >= 0) {
      result[matchIdx] = mergePersons(result[matchIdx], item);
    } else {
      result.push(item);
    }
  }

  return result;
}
