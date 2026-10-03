import { Person } from '../types/network';
import { encryptObject, decryptObject } from './cryptoStorage';

/**
 * ConnectWe 엔터프라이즈 데이터 볼트 & Excel 완벽 호환 백업 서비스
 * - 헌장 준수: Windows Excel 한글 깨짐 완벽 방지를 위해 UTF-8 BOM(\uFEFF)을 첫 바이트에 필수 삽입
 */

/**
 * 인맥 데이터를 Windows Excel 완벽 호환 UTF-8 BOM CSV 문자열로 변환
 */
export function generateCsvWithBom(people: Person[]): string {
  // UTF-8 with BOM 필수 원칙 (Global Charter Rule 1)
  const BOM = '\uFEFF';

  const headers = [
    '성명',
    '현재직장',
    '직책',
    '부서',
    '휴대전화',
    '이메일',
    'DART공시임원여부',
    'DART등기직책',
    'DART확인일자',
    '친밀도',
    '최근소통일',
    '전문분야',
    '출신학교',
    '이전재직이력',
    '메모'
  ];

  const escapeCsv = (str: string = ''): string => {
    const s = String(str || '');
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const rows = people.map(p => {
    const isDart = p.sourceType === 'DART_FACT' || !!p.dartInfo?.isPublicDirector;
    const dartRole = p.dartInfo?.registeredRole || '';
    const dartDate = p.dartInfo?.verifiedAt || '';
    const schools = (p.academics || []).map(a => a.schoolName).join('; ');
    const careers = (p.careers || []).map(c => `${c.companyName}(${c.title})`).join('; ');

    return [
      escapeCsv(p.name),
      escapeCsv(p.currentCompany),
      escapeCsv(p.currentTitle),
      escapeCsv(p.currentDepartment),
      escapeCsv(p.mobile),
      escapeCsv(p.email),
      isDart ? '공시임원' : '일반',
      escapeCsv(dartRole),
      escapeCsv(dartDate),
      `${p.closeness}촌`,
      p.lastContactDate || '',
      escapeCsv(p.primaryDomain),
      escapeCsv(schools),
      escapeCsv(careers),
      escapeCsv(p.memo)
    ].join(',');
  });

  return BOM + headers.join(',') + '\n' + rows.join('\n');
}

/**
 * 브라우저 파일 다운로드 트리거
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Excel 완벽 호환 UTF-8 BOM CSV 파일 다운로드
 */
export function downloadCsvWithBom(people: Person[]): void {
  const csv = generateCsvWithBom(people);
  const today = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `ConnectWe_Network_${today}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * AES-GCM 256비트 암호화 볼트 아카이브(.cwvault) 생성 및 다운로드
 */
export async function downloadEncryptedVault(people: Person[], password: string): Promise<void> {
  const payload = await encryptObject({
    version: '1.0',
    exportedAt: new Date().toISOString(),
    networkCount: people.length,
    people
  }, password);

  const today = new Date().toISOString().slice(0, 10);
  downloadFile(payload, `ConnectWe_Vault_${today}.cwvault`, 'application/json');
}

/**
 * 암호화 볼트 아카이브(.cwvault) 복호화 및 인맥 데이터 복원
 */
export async function restoreFromEncryptedVault(vaultContent: string, password: string): Promise<Person[]> {
  const decrypted = await decryptObject<{
    version: string;
    exportedAt: string;
    networkCount: number;
    people: Person[];
  }>(vaultContent, password);

  if (!decrypted || !Array.isArray(decrypted.people)) {
    throw new Error('유효한 ConnectWe 볼트 아카이브 형식이 아닙니다.');
  }

  return decrypted.people;
}

/**
 * RFC 4180 호환 CSV 행 및 토큰 파서 (따옴표 내 쉼표/개행 완벽 처리)
 */
function tokenizeCsv(csvText: string): string[][] {
  const cleanText = csvText.replace(/^\uFEFF/, '').trim();
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          currentField += '"';
          i++; // 이스케이프된 따옴표 건너뛰기
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        rows.push(currentRow);
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    rows.push(currentRow);
  }

  return rows;
}

/**
 * Excel 호환 UTF-8 BOM CSV 문자열로부터 인맥 목록 양방향 복원
 */
export function parseCsvWithBom(csvContent: string): Person[] {
  const rows = tokenizeCsv(csvContent);
  if (rows.length < 2) return [];

  const headers = rows[0].map(h => h.toLowerCase().replace(/[\s_\-()]/g, ''));

  // 헤더 인덱스 매핑
  const findHeaderIdx = (aliases: string[]): number => {
    return headers.findIndex(h => aliases.some(alias => h.includes(alias)));
  };

  const nameIdx = findHeaderIdx(['성명', '이름', 'name', '인명']);
  const companyIdx = findHeaderIdx(['현재직장', '회사', '소속', 'company', '직장']);
  const titleIdx = findHeaderIdx(['직책', '직함', 'title', '직위']);
  const deptIdx = findHeaderIdx(['부서', 'dept', 'department', '팀']);
  const mobileIdx = findHeaderIdx(['휴대전화', '휴대폰', 'mobile', '핸드폰', '연락처']);
  const emailIdx = findHeaderIdx(['이메일', 'email', '전자우편']);
  const dartIdx = findHeaderIdx(['dart공시임원여부', '공시임원', 'dart임원']);
  const dartRoleIdx = findHeaderIdx(['dart등기직책', '등기직책']);
  const closenessIdx = findHeaderIdx(['친밀도', '촌', 'closeness']);
  const contactDateIdx = findHeaderIdx(['최근소통일', '소통일', 'lastcontact']);
  const domainIdx = findHeaderIdx(['전문분야', '도메인', 'primarydomain']);
  const memoIdx = findHeaderIdx(['메모', 'memo', '비고']);

  if (nameIdx === -1) {
    throw new Error('CSV 파일에 [성명] 또는 [이름] 칼럼이 존재하지 않습니다.');
  }

  const people: Person[] = [];

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length === 0 || (row.length === 1 && !row[0])) continue;

    const name = row[nameIdx]?.trim();
    if (!name) continue;

    const company = (companyIdx !== -1 ? row[companyIdx] : '') || '소속 미지정';
    const title = (titleIdx !== -1 ? row[titleIdx] : '') || '직함 미정';
    const department = (deptIdx !== -1 ? row[deptIdx] : '') || '';
    const mobile = (mobileIdx !== -1 ? row[mobileIdx] : '') || '010-0000-0000';
    const email = (emailIdx !== -1 ? row[emailIdx] : '') || `${name.toLowerCase()}@example.com`;
    const isDart = dartIdx !== -1 && (row[dartIdx]?.includes('공시') || row[dartIdx]?.includes('true') || row[dartIdx]?.includes('예'));
    const dartRole = (dartRoleIdx !== -1 ? row[dartRoleIdx] : '') || '';
    const rawCloseness = closenessIdx !== -1 ? parseInt(row[closenessIdx]?.replace(/[^0-9]/g, '') || '3', 10) : 3;
    const closeness = rawCloseness === 1 || rawCloseness === 2 || rawCloseness === 3 ? rawCloseness : 3;
    const lastContactDate = (contactDateIdx !== -1 ? row[contactDateIdx] : '') || undefined;
    const primaryDomain = (domainIdx !== -1 ? row[domainIdx] : '') || '경영/전략';
    const memo = (memoIdx !== -1 ? row[memoIdx] : '') || 'CSV에서 복원된 인맥';

    const person: Person = {
      id: `p_csv_${Date.now()}_${r}`,
      name,
      currentCompany: company,
      currentDepartment: department,
      currentTitle: title,
      mobile,
      email,
      primaryDomain,
      sourceType: isDart ? 'DART_FACT' : 'SOURCE_DATA',
      closeness,
      lastContactDate,
      isStale: false,
      skills: [primaryDomain],
      careers: [{
        id: `c_csv_${r}`,
        companyName: company,
        title,
        startYear: new Date().getFullYear(),
        isCurrent: true,
        source: 'SOURCE_DATA'
      }],
      academics: [],
      estimatedAgeGroup: '40s',
      isAgeEstimated: true,
      connectionChannel: 'business_card',
      memo,
      dartInfo: isDart ? {
        corpCode: '00000000',
        stockName: company,
        registeredRole: dartRole || title,
        isPublicDirector: true,
        verifiedAt: new Date().toISOString().slice(0, 10)
      } : undefined
    };

    people.push(person);
  }

  return people;
}
