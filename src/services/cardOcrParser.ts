import { Person, DataSourceType } from '../types/network';
import { crossCheckPersonWithDart } from './dartFactEngine';

export interface ExtractedCardData {
  name: string;
  currentCompany: string;
  currentTitle: string;
  currentDepartment?: string;
  mobile: string;
  email: string;
  primaryDomain: string;
  rawText: string;
  dartMatch?: {
    isMatched: boolean;
    stockName: string;
    registeredRole: string;
  };
}

/**
 * 정규식 및 휴리스틱 기반 명함 텍스트 지능형 파서
 */
export function parseBusinessCardText(text: string): ExtractedCardData {
  const lines = text
    .split(/[\r\n]+/)
    .map(l => l.trim())
    .filter(Boolean);

  let name = '';
  let company = '';
  let title = '대표이사 / 임원';
  let department = '';
  let mobile = '';
  let email = '';
  let domain = '경영/전략';

  // 1. 휴대전화 정규식 매칭 (010-XXXX-XXXX, 010 XXXX XXXX, +82 10 등)
  const mobileRegex = /(?:01[016789]|(?:\+82[- ]?1[016789]))[- ]?(\d{3,4})[- ]?(\d{4})/;
  // 2. 이메일 정규식 매칭
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;

  // 텍스트 전체에서 전화번호와 이메일 먼저 탐색
  const fullText = lines.join(' ');
  const mobileMatch = fullText.match(mobileRegex);
  if (mobileMatch) {
    const rawNumber = mobileMatch[0].replace(/[^\d]/g, '');
    if (rawNumber.length === 11) {
      mobile = `${rawNumber.slice(0, 3)}-${rawNumber.slice(3, 7)}-${rawNumber.slice(7)}`;
    } else if (rawNumber.length === 10) {
      mobile = `${rawNumber.slice(0, 3)}-${rawNumber.slice(3, 6)}-${rawNumber.slice(6)}`;
    } else {
      mobile = mobileMatch[0];
    }
  }

  const emailMatch = fullText.match(emailRegex);
  if (emailMatch) {
    email = emailMatch[0].toLowerCase();
  }

  // 3. 직함 키워드 매칭
  const titleKeywords = [
    '대표이사', 'CEO', '부사장', '전무', '상무', '이사', '이사대우', 
    '파트너', '본부장', '그룹장', '실장', '팀장', '수석연구원', 
    '수석', '책임', '선임', '매니저', '디렉터', '총괄'
  ];

  for (const line of lines) {
    for (const kw of titleKeywords) {
      if (line.includes(kw)) {
        title = kw;
        const parts = line.split(/\s+/);
        const kwIdx = parts.indexOf(kw);
        if (kwIdx > 0 && !department) {
          department = parts.slice(0, kwIdx).join(' ');
        }
        break;
      }
    }
    if (title !== '대표이사 / 임원') break;
  }

  // 4. 회사명 파싱 (주식회사, (주), Corp, Inc, Group, 랩, 테크, 인베스트먼트 등)
  const companyKeywords = ['주식회사', '(주)', '㈜', 'Corp', 'Inc', 'Group', '랩', '인베스트먼트', '파트너스', '전자', '통신', '소프트', '테크'];
  for (const line of lines) {
    if (companyKeywords.some(k => line.includes(k))) {
      company = line.replace(/주식회사|\(주\)|㈜/g, '').trim();
      break;
    }
  }

  // 5. 이름 파싱 (보통 2~4글자 한글 또는 직함과 함께 위치)
  for (const line of lines) {
    if (mobileRegex.test(line) || emailRegex.test(line)) continue;
    if (companyKeywords.some(k => line.includes(k))) continue;

    // 한글 2~4글자 이름 패턴
    const nameMatch = line.match(/^[가-힣]{2,4}$/);
    if (nameMatch) {
      name = nameMatch[0];
      break;
    }

    // "홍길동 대표" 형태
    const nameWithTitleMatch = line.match(/^([가-힣]{2,4})\s+(대표|이사|상무|전무|팀장|수석)/);
    if (nameWithTitleMatch) {
      name = nameWithTitleMatch[1];
      break;
    }
  }

  // 폴백 기본값
  if (!name && lines.length > 0) name = lines[0].replace(/[^가-힣a-zA-Z]/g, '').slice(0, 4) || '신규 인맥';
  if (!company && lines.length > 1) company = lines[1].slice(0, 15) || '미상 회사';
  if (!mobile) mobile = '010-0000-0000';
  if (!email) email = `${name.toLowerCase()}@${company.toLowerCase().replace(/[^a-z]/g, '') || 'company'}.com`;

  // 6. 전문 도메인 추정
  if (company.includes('AI') || fullText.includes('인공지능') || fullText.includes('LLM')) domain = 'AI/LLM';
  else if (company.includes('인베스트') || company.includes('투자') || fullText.includes('VC')) domain = '투자/VC';
  else if (company.includes('클라우드') || fullText.includes('Cloud') || fullText.includes('인프라')) domain = '클라우드/인프라';
  else if (company.includes('바이오') || fullText.includes('신약')) domain = '바이오/헬스케어';
  else if (company.includes('모빌리티') || fullText.includes('자율주행')) domain = '모빌리티';

  // 7. 금융감독원 DART 공시 실시간 교차검증
  const tempPerson: Person = {
    id: 'temp-scan',
    name,
    currentCompany: company,
    currentDepartment: department || '',
    currentTitle: title,
    mobile,
    email,
    primaryDomain: domain,
    sourceType: 'SOURCE_DATA' as DataSourceType,
    closeness: 3,
    isStale: false,
    memo: '명함 OCR 스캔 입수',
    skills: [domain],
    careers: [{
      id: 'c-temp',
      companyName: company,
      title,
      startYear: new Date().getFullYear(),
      isCurrent: true,
      source: 'SOURCE_DATA'
    }],
    academics: [],
    estimatedAgeGroup: '40s',
    isAgeEstimated: true,
    connectionChannel: 'business_card'
  };

  const dartVerified = crossCheckPersonWithDart(tempPerson);

  return {
    name,
    currentCompany: company,
    currentTitle: title,
    currentDepartment: department,
    mobile,
    email,
    primaryDomain: domain,
    rawText: text,
    dartMatch: dartVerified.dartInfo ? {
      isMatched: true,
      stockName: dartVerified.dartInfo.stockName,
      registeredRole: dartVerified.dartInfo.registeredRole
    } : undefined
  };
}

/**
 * 모의/온디바이스 이미지 전처리 및 텍스트 시뮬레이션 추출기 (Client-side Zero-Retention)
 */
export async function simulateExtractCardTextFromImage(
  _file: File
): Promise<string> {
  await new Promise(res => setTimeout(res, 800));

  return `주식회사 하이퍼네트웍스
김도현 상무 / 연구총괄
AI Lab 대규모언어모델팀
M. 010-8923-4512
E. dohyun.kim@hypernetworks.ai
서울시 강남구 테헤란로 152 강남파이낸스센터 18층`;
}
