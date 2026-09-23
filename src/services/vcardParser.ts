import { Person, AgeGroup } from '../types/network';
import { estimateAgeGroup, inferDomainFromDeptAndTitle } from './rememberParser';

/**
 * 스마트폰 주소록 .vcf (vCard 2.1 / 3.0 / 4.0) 파서
 */
export function parseVCard(vcfContent: string): Person[] {
  const cards = vcfContent.split(/BEGIN:VCARD/i).filter(b => b.trim().length > 0);
  const people: Person[] = [];

  cards.forEach((block, idx) => {
    const lines = block.split(/\r?\n/);
    let name = '';
    let org = '';
    let title = '';
    let mobile = '';
    let email = '';
    let note = '';
    let birthYear: number | undefined;

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      // FN (Full Name)
      if (line.match(/^FN(\;.*)?:/i)) {
        name = line.replace(/^FN(\;.*)?:/i, '').trim();
      }
      // N (Family;Given;...)
      else if (!name && line.match(/^N(\;.*)?:/i)) {
        const parts = line.replace(/^N(\;.*)?:/i, '').split(';');
        name = `${parts[0] || ''}${parts[1] || ''}`.trim();
      }
      // ORG (Company;Department)
      else if (line.match(/^ORG(\;.*)?:/i)) {
        const orgParts = line.replace(/^ORG(\;.*)?:/i, '').split(';');
        org = orgParts[0]?.trim() || '';
      }
      // TITLE
      else if (line.match(/^TITLE(\;.*)?:/i)) {
        title = line.replace(/^TITLE(\;.*)?:/i, '').trim();
      }
      // TEL (Mobile, Work, etc)
      else if (line.match(/^TEL(\;.*)?:/i)) {
        const phoneVal = line.replace(/^TEL(\;.*)?:/i, '').trim();
        if (!mobile || line.toLowerCase().includes('cell')) {
          mobile = phoneVal;
        }
      }
      // EMAIL
      else if (line.match(/^EMAIL(\;.*)?:/i)) {
        const emailVal = line.replace(/^EMAIL(\;.*)?:/i, '').trim();
        if (!email) {
          email = emailVal;
        }
      }
      // BDAY (YYYY-MM-DD or YYYYMMDD)
      else if (line.match(/^BDAY(\;.*)?:/i)) {
        const bdayStr = line.replace(/^BDAY(\;.*)?:/i, '').replace(/-/g, '').trim();
        const year = parseInt(bdayStr.substring(0, 4), 10);
        if (!isNaN(year) && year > 1940 && year < 2015) {
          birthYear = year;
        }
      }
      // NOTE
      else if (line.match(/^NOTE(\;.*)?:/i)) {
        note = line.replace(/^NOTE(\;.*)?:/i, '').trim();
      }
    }

    if (!name) return;

    let ageGroup: AgeGroup = '30s';
    let isEstimatedAge = true;

    if (birthYear) {
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      isEstimatedAge = false;
      if (age < 30) ageGroup = '20s';
      else if (age < 40) ageGroup = '30s';
      else if (age < 50) ageGroup = '40s';
      else ageGroup = '50s_plus';
    } else {
      const est = estimateAgeGroup(title, 2);
      ageGroup = est.ageGroup;
      isEstimatedAge = est.isEstimated;
      birthYear = est.birthYear;
    }

    const domain = inferDomainFromDeptAndTitle('', title, org);

    people.push({
      id: `vcf_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
      name,
      currentCompany: org || '개인/프리랜서',
      currentDepartment: '',
      currentTitle: title || '대표/전문가',
      mobile: mobile || '010-0000-0000',
      email: email || `${name.toLowerCase()}@addressbook.net`,
      birthYear,
      estimatedAgeGroup: ageGroup,
      isAgeEstimated: isEstimatedAge,
      primaryDomain: domain,
      skills: [domain],
      careers: [
        {
          id: `cr_vcf_${idx}`,
          companyName: org || '개인',
          title: title || '전문가',
          startYear: birthYear ? birthYear + 26 : 2021,
          isCurrent: true,
          source: 'SOURCE_DATA'
        }
      ],
      academics: [],
      sourceType: 'SOURCE_DATA',
      closeness: 2, // 스마트폰 주소록 연락처는 친밀도 높음
      connectionChannel: 'vcard',
      isStale: false,
      memo: note ? `[주소록 메모] ${note}` : '스마트폰 연락처 동기화'
    });
  });

  return people;
}
