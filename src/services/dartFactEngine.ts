import LIVE_DART_EXECUTIVES_RAW from '../data/liveDartExecutives.json';
import { Person, DartFactInfo } from '../types/network';

export interface RawDartExecutive {
  id?: string;
  corpCode: string;
  corpName: string;
  stockCode?: string;
  name: string;
  position?: string;
  isRegistered?: boolean;
  registrationType?: string;
  chargeJob?: string;
  mainCareer?: string;
  termEndDate?: string;
  disclosureDate?: string;
  rceptNo?: string;
  reportBasisDate?: string;
  reportLabel?: string;
  remuneration?: string;
  remunerationAmount?: number;
  birthYearMonth?: string;
  serviceYears?: string;
  industry?: string;
  marketType?: string;
}

const DART_EXECUTIVES = LIVE_DART_EXECUTIVES_RAW as RawDartExecutive[];

/**
 * 회사명 정규화 (주식회사, (주), 공백 제거)
 */
function cleanCompanyName(name: string): string {
  return (name || '').replace(/[\(주\)|주식회사|\s|corp|inc]/gi, '').toLowerCase();
}

/**
 * 특정 인물에 대해 DART 상장사 공시 임원 데이터베이스와 교차 검증 실행
 */
export function crossCheckPersonWithDart(person: Person): {
  matched: boolean;
  dartExecutive?: RawDartExecutive;
  dartInfo?: DartFactInfo;
  updatedPerson?: Person;
} {
  const cleanTargetComp = cleanCompanyName(person.currentCompany);
  const targetName = person.name.trim();

  // 1. 현재 회사명 및 이름으로 매칭 시도
  const matchedExec = DART_EXECUTIVES.find(exec => {
    if (exec.name.trim() !== targetName) return false;
    const cleanExecComp = cleanCompanyName(exec.corpName);
    return cleanExecComp.includes(cleanTargetComp) || cleanTargetComp.includes(cleanExecComp);
  });

  if (!matchedExec) {
    return { matched: false };
  }

  // 매칭 성공 시 DART 팩트 정보 생성
  const stockDisplay = matchedExec.stockCode 
    ? `${matchedExec.corpName} (${matchedExec.stockCode})` 
    : matchedExec.corpName;

  const dartInfo: DartFactInfo = {
    corpCode: matchedExec.corpCode,
    stockName: stockDisplay,
    isPublicDirector: !!matchedExec.isRegistered,
    registeredRole: `${matchedExec.position || '임원'} (${matchedExec.chargeJob || matchedExec.registrationType || '담당업무'})`,
    registeredTerm: matchedExec.termEndDate ? `임기만료일: ${matchedExec.termEndDate}` : undefined,
    verifiedAt: matchedExec.disclosureDate || matchedExec.reportBasisDate || new Date().toISOString().slice(0, 10),
    ownershipShares: undefined,
    rceptNo: matchedExec.rceptNo,
    remuneration: matchedExec.remuneration,
    reportLabel: matchedExec.reportLabel
  };

  // 생년 정보 보완 (YYYY년 MM월)
  let birthYear = person.birthYear;
  if (!birthYear && matchedExec.birthYearMonth) {
    const yr = parseInt(matchedExec.birthYearMonth.substring(0, 4), 10);
    if (!isNaN(yr)) birthYear = yr;
  }

  const updatedPerson: Person = {
    ...person,
    sourceType: 'DART_FACT',
    birthYear: birthYear || person.birthYear,
    isAgeEstimated: birthYear ? false : person.isAgeEstimated,
    dartInfo,
    memo: person.memo 
      ? `${person.memo}\n[🏛️ DART 교차검증 완료] ${matchedExec.reportLabel || '정기공시'} 기준 임원 팩트 일치` 
      : `[🏛️ DART 교차검증 완료] ${matchedExec.reportLabel || '정기공시'} 기준 임원 팩트 일치`
  };

  return {
    matched: true,
    dartExecutive: matchedExec,
    dartInfo,
    updatedPerson
  };
}

/**
 * DART 전자공시 원문 보고서 URL 생성 (14자리 rceptNo 직접 연결 또는 기업검색)
 */
export function getDartReportUrl(corpName: string, rceptNo?: string): string {
  if (rceptNo && /^\d{14}$/.test(rceptNo)) {
    return `https://dart.fss.or.kr/dsaf001/main.do?rcpNo=${rceptNo}`;
  }
  return `https://dart.fss.or.kr/dsab001/main.do?textCrpNm=${encodeURIComponent(corpName)}`;
}

/**
 * 전체 인맥 리스트를 일괄 DART 교차 검증하여 공시 임원 자동 식별
 */
export function batchCrossCheckWithDart(people: Person[]): { updatedPeople: Person[]; newlyVerifiedCount: number } {
  let count = 0;
  const updatedPeople = people.map(p => {
    // 이미 DART_FACT면 스킵
    if (p.sourceType === 'DART_FACT' && p.dartInfo) return p;

    const res = crossCheckPersonWithDart(p);
    if (res.matched && res.updatedPerson) {
      count++;
      return res.updatedPerson;
    }
    return p;
  });

  return { updatedPeople, newlyVerifiedCount: count };
}
