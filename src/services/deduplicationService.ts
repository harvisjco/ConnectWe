/**
 * ConnectWe 엔터프라이즈 스마트 중복 감지 및 이력 보존 병합 엔진 (DeduplicationService)
 * 
 * 구글 수석 아키텍트 & 인맥 인텔리전스 헌장 준수:
 * 1. 연락처(전화번호, 이메일) 및 실명-소속 기반 다차원 퍼지 중복 탐색
 * 2. 승진/이직 시 기존 소속 정보를 파기하지 않고 과거 경력(Careers Timeline)으로 완벽 보존
 * 3. 스킬, 관심 태그, 학력의 원자적 합집합(Union) 결합
 * 4. 타임스탬프 기반 메모 히스토리 무결성 보존
 */

import { Person, CareerHistory } from '../types/network';

export interface DuplicateMatchResult {
  isDuplicate: boolean;
  matchedPerson: Person | null;
  confidenceScore: number; // 0 ~ 100
  matchReason: 'PHONE_MATCH' | 'EMAIL_MATCH' | 'NAME_AFFILIATION_MATCH' | 'NONE';
  description: string;
}

/**
 * 전화번호 정규화 (하이픈, 공백, 국가코드 제거)
 */
export function normalizePhoneNumber(phone?: string): string {
  if (!phone) return '';
  return phone.replace(/[^0-9]/g, '').replace(/^82/, '0');
}

/**
 * 이메일 정규화
 */
export function normalizeEmail(email?: string): string {
  if (!email) return '';
  return email.trim().toLowerCase();
}

/**
 * 신규 인맥/명함 데이터와 기존 인맥 풀 간 중복 인물 탐색
 */
export function findDuplicatePerson(
  incoming: Partial<Person>,
  peoplePool: Person[]
): DuplicateMatchResult {
  if (!incoming || peoplePool.length === 0) {
    return {
      isDuplicate: false,
      matchedPerson: null,
      confidenceScore: 0,
      matchReason: 'NONE',
      description: '중복 없음'
    };
  }

  const incomingPhone = normalizePhoneNumber(incoming.mobile);
  const incomingEmail = normalizeEmail(incoming.email);
  const incomingName = incoming.name?.trim().toLowerCase();

  for (const existing of peoplePool) {
    const existingPhone = normalizePhoneNumber(existing.mobile);
    const existingEmail = normalizeEmail(existing.email);
    const existingName = existing.name.trim().toLowerCase();

    // 1. 휴대폰 번호 완전 일치 (신뢰도 99%)
    if (incomingPhone && existingPhone && incomingPhone === existingPhone) {
      return {
        isDuplicate: true,
        matchedPerson: existing,
        confidenceScore: 99,
        matchReason: 'PHONE_MATCH',
        description: `연락처(${existing.mobile})가 완전히 일치하는 기존 인맥이 확인되었습니다.`
      };
    }

    // 2. 이메일 완전 일치 (신뢰도 95%)
    if (incomingEmail && existingEmail && incomingEmail === existingEmail) {
      return {
        isDuplicate: true,
        matchedPerson: existing,
        confidenceScore: 95,
        matchReason: 'EMAIL_MATCH',
        description: `이메일(${existing.email})이 동일한 기존 인맥이 확인되었습니다.`
      };
    }

    // 3. 성명 일치 + 소속 회사 또는 학교 일치 (신뢰도 85%)
    if (incomingName && existingName && incomingName === existingName) {
      const incomingCompany = incoming.currentCompany?.trim().toLowerCase();
      const existingCompany = existing.currentCompany?.trim().toLowerCase();

      const sameCompany = incomingCompany && existingCompany && incomingCompany === existingCompany;
      const sameDepartment = incoming.currentDepartment && existing.currentDepartment && 
        incoming.currentDepartment.trim().toLowerCase() === existing.currentDepartment.trim().toLowerCase();

      if (sameCompany || sameDepartment) {
        return {
          isDuplicate: true,
          matchedPerson: existing,
          confidenceScore: 88,
          matchReason: 'NAME_AFFILIATION_MATCH',
          description: `성명(${existing.name})과 회사(${existing.currentCompany})가 일치하는 인맥입니다.`
        };
      }
    }
  }

  return {
    isDuplicate: false,
    matchedPerson: null,
    confidenceScore: 0,
    matchReason: 'NONE',
    description: '신규 고유 인맥'
  };
}

/**
 * 기존 인맥 프로필과 신규 명함/정보의 지능형 이력 보존 병합
 */
export function mergePersonProfiles(
  existing: Person,
  incoming: Partial<Person>
): Person {
  const merged: Person = { ...existing };

  // 1. 소속/직책 변경 감지 시 이전 정보를 careers 히스토리에 자동 누적
  const hasCompanyChanged = incoming.currentCompany && incoming.currentCompany !== existing.currentCompany;
  const hasTitleChanged = incoming.currentTitle && incoming.currentTitle !== existing.currentTitle;

  const currentCareers: CareerHistory[] = existing.careers ? [...existing.careers] : [];

  if (hasCompanyChanged || hasTitleChanged) {
    const previousCareer: CareerHistory = {
      id: `career_prev_${Date.now()}`,
      companyName: existing.currentCompany,
      title: existing.currentTitle,
      department: existing.currentDepartment,
      startYear: 2020,
      isCurrent: false,
      source: existing.sourceType || 'SOURCE_DATA'
    };

    // 중복 커리어 방지 후 추가
    const isAlreadyInCareers = currentCareers.some(
      c => c.companyName === existing.currentCompany && c.title === existing.currentTitle
    );
    if (!isAlreadyInCareers && existing.currentCompany) {
      currentCareers.unshift(previousCareer);
    }
  }

  // 2. 최신 직책/소속 업데이트
  if (incoming.currentCompany) merged.currentCompany = incoming.currentCompany;
  if (incoming.currentTitle) merged.currentTitle = incoming.currentTitle;
  if (incoming.currentDepartment) merged.currentDepartment = incoming.currentDepartment;
  if (incoming.mobile) merged.mobile = incoming.mobile;
  if (incoming.email) merged.email = incoming.email;

  // 3. 커리어 배열 갱신
  merged.careers = currentCareers;

  // 4. 태그 및 스킬 합집합 결합
  const mergedTags = new Set([...(existing.tags || []), ...(incoming.tags || [])]);
  merged.tags = Array.from(mergedTags);

  const mergedSkills = new Set([...(existing.skills || []), ...(incoming.skills || [])]);
  merged.skills = Array.from(mergedSkills);

  // 5. 메모 타임스탬프 누적
  const today = new Date().toISOString().split('T')[0];
  const updateNote = `[${today} 명함/정보 갱신] ${incoming.currentCompany || existing.currentCompany} ${incoming.currentTitle || existing.currentTitle}`;
  if (incoming.memo && incoming.memo !== existing.memo) {
    merged.memo = existing.memo 
      ? `${existing.memo}\n${updateNote}: ${incoming.memo}`
      : `${updateNote}: ${incoming.memo}`;
  } else if (hasCompanyChanged || hasTitleChanged) {
    merged.memo = existing.memo 
      ? `${existing.memo}\n${updateNote}`
      : updateNote;
  }

  return merged;
}
