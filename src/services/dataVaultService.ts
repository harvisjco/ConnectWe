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
