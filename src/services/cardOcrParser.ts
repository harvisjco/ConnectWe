import { Person, DataSourceType } from '../types/network';
import { crossCheckPersonWithDart } from './dartFactEngine';

export interface ExtractedCardData {
  name: string;
  englishName?: string;
  currentCompany: string;
  currentTitle: string;
  currentDepartment?: string;
  mobile: string;
  tel?: string;
  fax?: string;
  email: string;
  address?: string;
  primaryDomain: string;
  rawText: string;
  dartMatch?: {
    isMatched: boolean;
    stockName: string;
    registeredRole: string;
  };
}

/**
 * 정규식 및 휴리스틱 기반 명함 텍스트 지능형 파서 (리멤버 표준 및 국내외 5대 명함 양식 지원)
 */
export function parseBusinessCardText(text: string): ExtractedCardData {
  const lines = text
    .split(/[\r\n]+/)
    .map(l => l.trim())
    .filter(Boolean);

  let name = '';
  let englishName = '';
  let company = '';
  let title = '';
  let department = '';
  let mobile = '';
  let tel = '';
  let fax = '';
  let email = '';
  let address = '';
  let domain = '경영/전략';

  const fullText = lines.join('\n');

  // 1. 라벨형 (Key: Value) 명함 패턴 우선 확인 (Name:, Company:, Dept:, Title:, Tel:, M:, E: 등)
  for (const line of lines) {
    const nameLabel = line.match(/^(?:이름|성명|Name)\s*[:：]\s*(.+)$/i);
    if (nameLabel && !name) {
      const rawName = nameLabel[1].trim();
      const engSplit = rawName.match(/^([가-힣]{2,4})\s*(?:\/|\(|\b)?([A-Za-z\s]+)(?:\)|\b)?$/);
      if (engSplit) {
        name = engSplit[1].trim();
        englishName = engSplit[2].trim();
      } else {
        name = rawName;
      }
    }

    const compLabel = line.match(/^(?:회사|회사명|상호|Company|Org)\s*[:：]\s*(.+)$/i);
    if (compLabel && !company) {
      company = compLabel[1].replace(/주식회사|\(주\)|㈜/g, '').trim();
    }

    const deptLabel = line.match(/^(?:부서|소속|본부|팀|Dept|Department|Team)\s*[:：]\s*(.+)$/i);
    if (deptLabel && !department) {
      department = deptLabel[1].trim();
    }

    const titleLabel = line.match(/^(?:직책|직함|직급|Title|Position)\s*[:：]\s*(.+)$/i);
    if (titleLabel && !title) {
      title = titleLabel[1].trim();
    }
  }

  // 2. 이메일 추출
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const emailMatch = fullText.match(emailRegex);
  if (emailMatch) {
    email = emailMatch[0].toLowerCase();
  }

  // 3. 전화번호 (Mobile, Tel, Fax) 라인별 정밀 분석
  const phoneExtractRegex = /(?:(\+82[- ]?)?(\d{2,3})[- ]?(\d{3,4})[- ]?(\d{4}))/;

  for (const line of lines) {
    // 팩스 탐색
    if (/\b(?:fax|facsimile|f)\b/i.test(line)) {
      const match = line.match(phoneExtractRegex);
      if (match && !fax) {
        fax = normalizePhoneNumber(match[0]);
      }
      continue;
    }

    // 휴대전화 탐색 (M, Mobile, C.P., H.P., Cell, 010 등)
    if (/\b(?:mobile|m|c\.p\.|h\.p\.|cell)\b/i.test(line) || /01[016789]/.test(line)) {
      const match = line.match(phoneExtractRegex);
      if (match && !mobile) {
        mobile = normalizePhoneNumber(match[0]);
        continue;
      }
    }

    // 일반 유선전화 탐색 (Tel, T, Office, Direct, 02, 031, 051 등)
    if (/\b(?:tel|t|phone|office|direct)\b/i.test(line) || /(?:02|03[1-3]|04[1-4]|05[1-5]|06[1-4])[- ]\d{3,4}/.test(line)) {
      const match = line.match(phoneExtractRegex);
      if (match && !tel) {
        tel = normalizePhoneNumber(match[0]);
        continue;
      }
    }
  }

  // 폴백: 전체 텍스트에서 휴대전화 번호 탐색
  if (!mobile) {
    const mobileFallback = fullText.match(/(?:01[016789]|(?:\+82[- ]?1[016789]))[- ]?(\d{3,4})[- ]?(\d{4})/);
    if (mobileFallback) {
      mobile = normalizePhoneNumber(mobileFallback[0]);
    }
  }

  // 4. 주소 추출 (서울시, 경기도, 테헤란로, 빌딩, 층 등)
  for (const line of lines) {
    if (/(?:서울|경기|인천|부산|대전|대구|광주|울산|세종|강원|충북|충남|전북|전남|경북|경남|제주).+(?:로|길|대로|빌딩|타워|층|호)/.test(line)) {
      address = line.trim();
      break;
    }
  }

  // 5. 회사명 파싱 (주식회사, (주), 법무법인, 회계법인 등 법인 접두사 정제)
  const companyKeywords = [
    '주식회사', '(주)', '㈜', '유한회사', '(유)', 'Corp', 'Inc', 'LLC', 'Group', 'Partners',
    '법무법인', '회계법인', '특허법인', '투자', '인베스트먼트', '파트너스', '벤처스', '캐피탈',
    '전자', '통신', '소프트', '테크', '홀딩스', '네트웍스', '랩스', '바이오', '시스템'
  ];

  if (!company) {
    for (const line of lines) {
      if (line === address || phoneExtractRegex.test(line) || emailRegex.test(line)) continue;
      if (companyKeywords.some(k => line.includes(k))) {
        company = line.replace(/법무법인(?:\([가-힣]+\))?|회계법인|특허법인|주식회사|\(주\)|㈜|유한회사|\(유\)/g, '').trim();
        break;
      }
    }
  }

  // 6. 이름 및 영문명 파싱
  const titleKeywords = [
    // 글로벌/스타트업 직함
    'Head of AI', 'Head of Engineering', 'Managing Director', 'Vice President', 'Executive Director',
    'Co-founder', 'Founding Partner', 'Managing Partner', 'Partner', 'Director', 'Team Lead', 'Lead',
    // C-Level & 임원
    '대표이사', '최고기술책임자', '최고경영자', '최고재무책임자', '최고운영책임자', 'CEO', 'CTO', 'CFO', 'COO', 'CIO', 'CPO',
    '부사장', '전무이사', '전무', '상무이사', '상무', '이사', '이사대우',
    // 전문직/투자사/연구직
    '파트너 변호사', '변호사', '공인회계사', '변리사', '수석심사역', '책임심사역', '심사역',
    '수석연구위원', '연구위원', '수석연구원', '책임연구원', '선임연구원', '연구총괄',
    // 일반 관리직/리더
    '본부장', '그룹장', '센터장', '실장', '팀장', '수석', '책임', '선임', '매니저', '디렉터', '총괄'
  ];

  const departmentKeywords = ['본부', '사업부', '센터', '그룹', '연구소', 'Lab', '랩', '팀', '실', '부문'];

  if (!name) {
    for (const line of lines) {
      if (line === address || phoneExtractRegex.test(line) || emailRegex.test(line)) continue;
      if (companyKeywords.some(k => line.includes(k))) continue;
      // 순수 부서명 단독 라인인 경우만 건너뜀 (직함 키워드가 없는 경우)
      if (departmentKeywords.some(dk => line.endsWith(dk)) && !titleKeywords.some(tk => line.includes(tk))) continue;

      // 1) "홍길동 / Michael Hong" 또는 "홍길동 Michael Hong" (한글 성명 + 영문 병기)
      const dualNameMatch = line.match(/^([가-힣]{2,4})\s*(?:\/|\(|\b)\s*([A-Za-z\s]+)(?:\)|\b)?$/);
      if (dualNameMatch) {
        name = dualNameMatch[1].trim();
        englishName = dualNameMatch[2].trim();
        break;
      }

      // 2) "김진우 수석심사역", "박서준 최고기술책임자 (CTO)", "최민호 파트너 변호사 / M&A팀"
      const nameWithTitleMatch = line.match(/^([가-힣]{2,4})\s+(.+)$/);
      if (nameWithTitleMatch) {
        const potentialName = nameWithTitleMatch[1];
        const rest = nameWithTitleMatch[2];
        if (titleKeywords.some(t => rest.includes(t))) {
          name = potentialName;
          // 뒤쪽 토큰에서 직함과 부서 분리
          const tokens = rest.split(/[/|,]|\s{2,}/).map(t => t.trim()).filter(Boolean);
          for (const token of tokens) {
            if (titleKeywords.some(tk => token.includes(tk))) {
              if (!title) title = token;
            } else if (departmentKeywords.some(dk => token.includes(dk))) {
              if (!department) department = token;
            }
          }
          if (!title) title = rest.trim();
          break;
        }
      }

      // 3) 한글 2~4글자 단독 이름
      const pureKoreanName = line.match(/^[가-힣]{2,4}$/);
      if (pureKoreanName) {
        name = pureKoreanName[0];
        break;
      }
    }
  }

  // 7. 부서 및 직함 파싱 (이름이나 회사명이 아닌 라인에서 탐색)
  for (const line of lines) {
    if (line === address || phoneExtractRegex.test(line) || emailRegex.test(line)) continue;
    if (name && line.includes(name)) continue;
    if (company && line.includes(company)) continue;

    // 부서 탐색
    if (!department) {
      if (departmentKeywords.some(dk => line.includes(dk))) {
        department = line.trim();
        continue;
      }
    }

    // 직함 탐색
    if (!title) {
      for (const kw of titleKeywords) {
        if (line.includes(kw)) {
          title = line.trim();
          break;
        }
      }
    }
  }

  // 폴백 기본값 보정
  if (!name) {
    const candidate = lines.find(l => 
      l !== address && 
      !companyKeywords.some(k => l.includes(k)) && 
      !phoneExtractRegex.test(l) && 
      !emailRegex.test(l)
    );
    if (candidate) {
      const match = candidate.match(/[가-힣]{2,4}/);
      if (match) name = match[0];
    }
  }

  if (!name) name = '신규 인맥';
  if (!company) {
    const firstLineCandidate = lines.find(l => !phoneExtractRegex.test(l) && !emailRegex.test(l) && l !== name);
    company = firstLineCandidate ? firstLineCandidate.slice(0, 20) : '소속 회사 미상';
  }
  if (!title) title = '대표 / 임원';
  if (!mobile && tel) mobile = tel; // 유선전화만 있는 경우 폴백
  if (!mobile) mobile = '010-0000-0000';
  if (!email) email = `${name.toLowerCase()}@${company.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company'}.com`;

  // 8. 전문 도메인 추정
  const upperCompany = company.toUpperCase();

  // \bAI\b 단어 경계로 체크하여 EMAIL, Training 등 일반 영단어 내 철자 오인식 방지
  if (
    upperCompany.includes('AI') || 
    /\b(AI|LLM|GPT)\b/i.test(fullText) || 
    fullText.includes('인공지능') || 
    fullText.includes('머신러닝')
  ) {
    domain = 'AI/LLM';
  } else if (
    upperCompany.includes('투자') || 
    upperCompany.includes('인베스트') || 
    upperCompany.includes('벤처') || 
    /\b(VC|INVEST|CAPITAL)\b/i.test(upperCompany) || 
    fullText.includes('심사역') || 
    /\bVC\b/i.test(fullText)
  ) {
    domain = '투자/VC';
  } else if (
    upperCompany.includes('태평양') || 
    upperCompany.includes('김앤장') || 
    upperCompany.includes('광장') || 
    upperCompany.includes('세종') || 
    fullText.includes('법무') || 
    fullText.includes('변호사') || 
    fullText.includes('로펌')
  ) {
    domain = '법률/컴플라이언스';
  } else if (upperCompany.includes('모빌리티') || fullText.includes('모빌리티') || fullText.includes('자율주행')) {
    domain = '모빌리티';
  } else if (upperCompany.includes('클라우드') || /\bCLOUD\b/i.test(fullText) || fullText.includes('인프라')) {
    domain = '클라우드/인프라';
  } else if (upperCompany.includes('바이오') || fullText.includes('신약') || fullText.includes('헬스케어')) {
    domain = '바이오/헬스케어';
  } else if (upperCompany.includes('금융') || upperCompany.includes('증권') || upperCompany.includes('자산운용')) {
    domain = '금융/핀테크';
  }

  // 9. DART 공시 실시간 교차검증
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
    memo: address ? `명함 OCR 스캔 입수 (소재지: ${address})` : '명함 OCR 스캔 입수',
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
    englishName: englishName || undefined,
    currentCompany: company,
    currentTitle: title,
    currentDepartment: department || undefined,
    mobile,
    tel: tel || undefined,
    fax: fax || undefined,
    email,
    address: address || undefined,
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
 * 전화번호 문자열을 한국 표준 체계로 정규화 (010-XXXX-XXXX, 02-XXX-XXXX 등)
 */
function normalizePhoneNumber(raw: string): string {
  let cleaned = raw.replace(/[^\d+]/g, '');
  if (cleaned.startsWith('+82')) {
    cleaned = '0' + cleaned.slice(3);
  } else if (cleaned.startsWith('82') && cleaned.length >= 10) {
    cleaned = '0' + cleaned.slice(2);
  }
  cleaned = cleaned.replace(/[^\d]/g, '');

  // 11자리 휴대전화 (010-XXXX-XXXX)
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  // 10자리 휴대전화 또는 031/051 등 지역번호 (01X-XXX-XXXX 또는 031-XXX-XXXX)
  if (cleaned.length === 10) {
    if (cleaned.startsWith('02')) {
      return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
    }
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  // 9자리 서울 유선전화 (02-XXX-XXXX)
  if (cleaned.length === 9 && cleaned.startsWith('02')) {
    return `${cleaned.slice(0, 2)}-${cleaned.slice(2, 5)}-${cleaned.slice(5)}`;
  }

  return raw.trim();
}

/**
 * 모의/온디바이스 이미지 전처리 및 텍스트 시뮬레이션 추출기 (Client-side Zero-Retention)
 * 다양한 5대 명함 양식(리멤버 벤치마크)에 대응하는 시뮬레이션 텍스트 생성
 */
export async function simulateExtractCardTextFromImage(
  file?: File
): Promise<string> {
  await new Promise(res => setTimeout(res, 300));

  const fileName = (file?.name || '').toLowerCase();

  // 유형 1: 리멤버 표준 세로형 명함
  if (fileName.includes('vertical') || fileName.includes('remember') || fileName.includes('kakaomobility')) {
    return `카카오모빌리티
기술기획팀
홍길동 Michael Hong
이사
M. 010-5541-9872
T. 02-6900-1234
E. michael.hong@kakaomobility.com
성남시 분당구 판교역로 152 알파돔타워 13층`;
  }

  // 유형 2: 글로벌 스타트업 영문 혼용 명함
  if (fileName.includes('startup') || fileName.includes('global') || fileName.includes('deepmind')) {
    return `DeepMind Labs Korea Inc.
이예진 Yejin Lee
Head of AI & Co-founder
Mobile +82 10 9876 5432
Email yejin.lee@deepmindlabs.ai
서울시 서초구 강남대로 311 드림플러스 7층`;
  }

  // 유형 3: 대기업/금융/지주사 3중 연락처 분리형 명함
  if (fileName.includes('enterprise') || fileName.includes('finance') || fileName.includes('mirae')) {
    return `미래에셋벤처투자 주식회사
글로벌투자본부
김진우 수석심사역
Tel: 02-3774-1000
Mobile: 010-7762-1190
Fax: 02-3774-1099
Email: jinwoo.kim@miraeasset.com
서울특별시 영등포구 국제금융로 56 미래에셋빌딩 12층`;
  }

  // 유형 4: 전문직/로펌 파트너 명함
  if (fileName.includes('law') || fileName.includes('partner') || fileName.includes('bkl')) {
    return `법무법인(유한) 태평양
최민호 파트너 변호사 / M&A팀
Direct: 02-3404-0610
Mobile: 010-2345-6789
E-mail: minho.choi@bkl.co.kr
서울특별시 종로구 우정국로 26 센트로폴리스 B동 20층`;
  }

  // 유형 5: 라벨형 (Key-Value) 명함
  if (fileName.includes('label') || fileName.includes('form')) {
    return `Name: 강태오
Company: 주식회사 엔비젼테크
Dept: 클라우드플랫폼사업부
Title: 상무이사
Mobile: 010-4432-8871
Tel: 02-555-8800
E-mail: teo.kang@envisiontech.io
Address: 서울시 강남구 테헤란로 218 8층`;
  }

  // 기본 가상 명함 (박서준 CTO)
  if (
    fileName.includes('nextvision') || 
    fileName.includes('business_card') || 
    fileName.includes('mockup') || 
    fileName.includes('seojun')
  ) {
    return `주식회사 넥스트비전 AI
박서준 최고기술책임자 (CTO) / 전무이사
인공지능 혁신 연구소
Mobile +82-10-3849-2910
Email seojun.park@nextvision.ai
서울특별시 강남구 테헤란로 427 위워크타워 14층`;
  }

  return `주식회사 하이퍼네트웍스
김도현 상무 / 연구총괄
AI Lab 대규모언어모델팀
M. 010-8923-4512
E. dohyun.kim@hypernetworks.ai
서울시 강남구 테헤란로 152 강남파이낸스센터 18층`;
}

