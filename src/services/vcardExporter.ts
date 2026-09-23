import { Person } from '../types/network';

/**
 * 인물 객체를 표준 vCard 3.0 텍스트 포맷으로 변환
 */
export function personToVCardString(p: Person): string {
  const lines: string[] = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${p.name}`,
    `N:${p.name};;;;`,
    `ORG:${p.currentCompany}${p.currentDepartment ? ';' + p.currentDepartment : ''}`,
    `TITLE:${p.currentTitle}`,
    `TEL;TYPE=CELL:${p.mobile}`,
  ];

  if (p.directPhone) {
    lines.push(`TEL;TYPE=WORK:${p.directPhone}`);
  }

  if (p.email) {
    lines.push(`EMAIL;TYPE=INTERNET:${p.email}`);
  }

  if (p.birthYear) {
    lines.push(`BDAY:${p.birthYear}-01-01`);
  }

  // 알럼나이 및 메모를 NOTE 필드에 통합
  const notes: string[] = [];
  if (p.memo) notes.push(p.memo);
  const pastCareers = p.careers.filter(c => !c.isCurrent);
  if (pastCareers.length > 0) {
    notes.push(`[알럼나이 이력] ${pastCareers.map(c => `${c.companyName} ${c.title}`).join(', ')}`);
  }
  if (p.dartInfo) {
    notes.push(`[🏛️ DART FACT] ${p.dartInfo.stockName} ${p.dartInfo.registeredRole}`);
  }

  if (notes.length > 0) {
    // 줄바꿈 이스케이프 (\n)
    const escapedNote = notes.join('\n').replace(/\n/g, '\\n');
    lines.push(`NOTE:${escapedNote}`);
  }

  lines.push(`CATEGORIES:ConnectWe,${p.primaryDomain}`);
  lines.push('END:VCARD');

  return lines.join('\r\n');
}

/**
 * 인맥 리스트를 vCard(.vcf) 파일로 생성하여 브라우저 다운로드 실행
 */
export function exportPeopleToVcf(people: Person[], filename?: string): void {
  const vcfContent = people.map(personToVCardString).join('\r\n');
  const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `ConnectWe_Contacts_${new Date().toISOString().slice(0, 10)}.vcf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
