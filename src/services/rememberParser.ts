import { Person, AgeGroup } from '../types/network';

export interface RememberCsvRow {
  name: string;
  company: string;
  department: string;
  title: string;
  email: string;
  mobile: string;
  phone?: string;
  address?: string;
  memo?: string;
  registeredDate?: string;
}

/**
 * 직함 및 경력 연차 기반 추정 나이대 산출 유틸리티
 */
export function estimateAgeGroup(title: string, careersCount: number = 1): { ageGroup: AgeGroup; isEstimated: boolean; birthYear?: number } {
  const currentYear = new Date().getFullYear();
  const lowerTitle = (title || '').toLowerCase();

  if (lowerTitle.includes('인턴') || lowerTitle.includes('사원') || lowerTitle.includes('주니어') || lowerTitle.includes('매니저') && careersCount <= 1) {
    const estAge = 28;
    return { ageGroup: '20s', isEstimated: true, birthYear: currentYear - estAge };
  } else if (lowerTitle.includes('선임') || lowerTitle.includes('책임') || lowerTitle.includes('팀장') || lowerTitle.includes('리드') || lowerTitle.includes('vp')) {
    const estAge = 36;
    return { ageGroup: '30s', isEstimated: true, birthYear: currentYear - estAge };
  } else if (lowerTitle.includes('수석') || lowerTitle.includes('부장') || lowerTitle.includes('본부장') || lowerTitle.includes('이사') || lowerTitle.includes('상무')) {
    const estAge = 45;
    return { ageGroup: '40s', isEstimated: true, birthYear: currentYear - estAge };
  } else if (lowerTitle.includes('전무') || lowerTitle.includes('부사장') || lowerTitle.includes('사장') || lowerTitle.includes('대표') || lowerTitle.includes('고문') || lowerTitle.includes('의장')) {
    const estAge = 54;
    return { ageGroup: '50s_plus', isEstimated: true, birthYear: currentYear - estAge };
  }

  // 기본값 30대
  return { ageGroup: '30s', isEstimated: true, birthYear: currentYear - 35 };
}

/**
 * 직무 및 도메인 자동 유추
 */
export function inferDomainFromDeptAndTitle(dept: string, title: string, company: string): string {
  const text = `${dept} ${title} ${company}`.toLowerCase();
  if (text.includes('ai') || text.includes('인공지능') || text.includes('머신러닝') || text.includes('llm') || text.includes('데이터')) {
    return 'AI/LLM & Data';
  }
  if (text.includes('인프라') || text.includes('클라우드') || text.includes('devops') || text.includes('sre') || text.includes('백엔드') || text.includes('cto')) {
    return '클라우드 & 인프라';
  }
  if (text.includes('투자') || text.includes('vc') || text.includes('심사') || text.includes('pe') || text.includes('파트너') || text.includes('펀드')) {
    return 'VC/PE 투자';
  }
  if (text.includes('반도체') || text.includes('hw') || text.includes('설계') || text.includes('파운드리')) {
    return '반도체/HW';
  }
  if (text.includes('재무') || text.includes('회계') || text.includes('cfo') || text.includes('m&a') || text.includes('ir')) {
    return '재무 & 전략/M&A';
  }
  if (text.includes('인사') || text.includes('피플') || text.includes('채용') || text.includes('hr') || text.includes('조직')) {
    return '피플 & HR';
  }
  return '비즈니스 & 프로덕트';
}

/**
 * 리멤버 CSV 텍스트 파싱
 */
export function parseRememberCsv(csvContent: string): Person[] {
  // UTF-8 BOM 제거 (\uFEFF)
  const cleanContent = csvContent.replace(/^\uFEFF/, '');
  const lines = cleanContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length <= 1) return [];

  // 헤더 탐지 (리멤버 한글 헤더 매핑)
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));

  const findIdx = (keywords: string[]) => {
    return headers.findIndex(h => keywords.some(k => h.includes(k)));
  };

  const nameIdx = findIdx(['이름', '성명', 'Name']);
  const companyIdx = findIdx(['회사', '직장', '소속', 'Company']);
  const deptIdx = findIdx(['부서', '팀', '소속부서', 'Department']);
  const titleIdx = findIdx(['직책', '직급', '직함', 'Title', 'Position']);
  const emailIdx = findIdx(['이메일', 'Email', 'E-mail']);
  const mobileIdx = findIdx(['휴대폰', '휴대전화', '핸드폰', 'Mobile', 'Cell']);
  const phoneIdx = findIdx(['유선전화', '직통전화', '전화번호', 'Phone', 'Tel']);
  const memoIdx = findIdx(['메모', '비고', 'Memo', 'Notes']);
  const addressIdx = findIdx(['주소', '회사주소', 'Address']);

  const people: Person[] = [];

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // 간단 CSV 쉼표 분리 (따옴표 내 쉼표 처리 정규식)
    const tokens = rawLine.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || rawLine.split(',');
    const getVal = (idx: number) => {
      if (idx < 0 || idx >= tokens.length) return '';
      return (tokens[idx] || '').trim().replace(/^["']|["']$/g, '');
    };

    const name = getVal(nameIdx);
    if (!name) continue;

    const company = getVal(companyIdx) || '미지정 회사';
    const dept = getVal(deptIdx) || '';
    const title = getVal(titleIdx) || '구성원';
    const email = getVal(emailIdx) || '';
    const mobile = getVal(mobileIdx) || '';
    const phone = getVal(phoneIdx) || '';
    const memo = getVal(memoIdx) || '';
    const address = getVal(addressIdx) || '';

    const { ageGroup, isEstimated, birthYear } = estimateAgeGroup(title, 2);
    const domain = inferDomainFromDeptAndTitle(dept, title, company);

    people.push({
      id: `rem_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      currentCompany: company,
      currentDepartment: dept,
      currentTitle: title,
      mobile: mobile || '010-0000-0000',
      email: email || `${name.toLowerCase()}@example.com`,
      directPhone: phone,
      birthYear,
      estimatedAgeGroup: ageGroup,
      isAgeEstimated: isEstimated,
      primaryDomain: domain,
      skills: [domain, title],
      careers: [
        {
          id: `cr_${i}_1`,
          companyName: company,
          department: dept,
          title,
          startYear: birthYear ? birthYear + 27 : 2020,
          isCurrent: true,
          source: 'SOURCE_DATA'
        }
      ],
      academics: [],
      sourceType: 'SOURCE_DATA',
      closeness: 3,
      connectionChannel: 'remember',
      isStale: false,
      memo: memo ? `[리멤버 메모] ${memo}` : '리멤버 명함 연동',
      address
    });
  }

  return people;
}
