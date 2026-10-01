import { Person, DataSourceType, AgeGroup } from '../types/network';
import { parseBusinessCardText, ExtractedCardData } from './cardOcrParser';
import { crossCheckPersonWithDart } from './dartFactEngine';

export interface BatchScanItem {
  id: string;
  fileName: string;
  fileSize?: number;
  previewUrl?: string;
  status: 'PENDING' | 'SCANNING' | 'SUCCESS' | 'ERROR';
  extractedData?: ExtractedCardData;
  person?: Person;
  isDartMatched: boolean;
  errorMessage?: string;
}

function inferAgeGroup(title: string): AgeGroup {
  const t = (title || '').toLowerCase();
  if (t.includes('고문') || t.includes('회장') || t.includes('부회장') || t.includes('사장') || t.includes('부사장') || t.includes('전무') || t.includes('상무')) {
    return '50s_plus';
  }
  if (t.includes('이사') || t.includes('본부장') || t.includes('실장') || t.includes('팀장') || t.includes('파트너') || t.includes('수석') || t.includes('디렉터') || t.includes('cto') || t.includes('cfo')) {
    return '40s';
  }
  return '30s';
}

/**
 * 추출된 명함 데이터를 완전한 Person 객체로 변환하고 DART 상장사 공시 DB와 자동 결합
 */
export function convertCardDataToPersonWithDart(
  card: ExtractedCardData,
  fileName: string
): { person: Person; isDartMatched: boolean } {
  const basePerson: Person = {
    id: `batch-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    name: card.name || '미확인 인재',
    currentCompany: card.currentCompany || '소속 미지정',
    currentDepartment: card.currentDepartment || '',
    currentTitle: card.currentTitle || '직함 미지정',
    mobile: card.mobile || '',
    email: card.email || '',
    directPhone: card.tel,
    estimatedAgeGroup: inferAgeGroup(card.currentTitle),
    isAgeEstimated: true,
    primaryDomain: card.primaryDomain || '비즈니스 파트너십',
    skills: [],
    careers: [
      {
        id: `c-${Date.now()}`,
        companyName: card.currentCompany || '소속사',
        department: card.currentDepartment,
        title: card.currentTitle || '임원/팀원',
        startYear: new Date().getFullYear(),
        isCurrent: true,
        source: 'SOURCE_DATA'
      }
    ],
    academics: [],
    sourceType: 'SOURCE_DATA' as DataSourceType,
    closeness: 3,
    connectionChannel: 'business_card',
    lastContactDate: new Date().toISOString().slice(0, 10),
    isStale: false,
    memo: `[명함 일괄 스캔 등록: ${fileName}]`
  };

  // DART 8,500사 상장사 DB 자동 교차 대조
  const dartCheck = crossCheckPersonWithDart(basePerson);
  const isDartMatched = dartCheck.matched;

  const finalPerson: Person = isDartMatched ? {
    ...basePerson,
    sourceType: 'DART_FACT',
    dartInfo: dartCheck.dartInfo,
    memo: `${basePerson.memo}\n✓ DART 금융감독원 전자공시 상장사 임원 자동 인증됨 (${dartCheck.dartInfo?.stockName} ${dartCheck.dartInfo?.registeredRole})`
  } : basePerson;

  return {
    person: finalPerson,
    isDartMatched
  };
}

/**
 * 텍스트 목록 또는 가상 OCR 결과를 바탕으로 일괄 배치 스캔 및 DART 결합 수행
 */
export function processBatchOcrResults(
  inputs: Array<{ id: string; fileName: string; rawText: string; previewUrl?: string }>
): BatchScanItem[] {
  return inputs.map(input => {
    try {
      const extracted = parseBusinessCardText(input.rawText);
      const { person, isDartMatched } = convertCardDataToPersonWithDart(extracted, input.fileName);

      return {
        id: input.id,
        fileName: input.fileName,
        previewUrl: input.previewUrl,
        status: 'SUCCESS' as const,
        extractedData: extracted,
        person,
        isDartMatched
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '명함 파싱 중 오류 발생';
      return {
        id: input.id,
        fileName: input.fileName,
        previewUrl: input.previewUrl,
        status: 'ERROR' as const,
        isDartMatched: false,
        errorMessage: msg
      };
    }
  });
}
