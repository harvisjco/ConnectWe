import { Person } from '../types/network';
import { estimateAgeGroup, inferDomainFromDeptAndTitle } from './rememberParser';

/**
 * 텍스트 또는 OCR 결과로부터 명함 정보 구조화 추출
 */
export function parseRawBusinessCardText(rawText: string): Partial<Person> {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);

  let name = '';
  let company = '';
  let department = '';
  let title = '';
  let email = '';
  let mobile = '';
  let phone = '';
  let address = '';
  let website = '';

  // 1. 이메일 정규식 매칭
  const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (emailMatch) {
    email = emailMatch[0];
  }

  // 2. 전화번호 정규식 매칭 (010, 011, 02, 031 등)
  const phoneMatches = rawText.match(/(?:01[016789]|02|0[3-6][1-5])-?\d{3,4}-?\d{4}/g) || [];
  for (const p of phoneMatches) {
    const clean = p.replace(/\s+/g, '');
    if (clean.startsWith('010') || clean.startsWith('011') || clean.startsWith('016')) {
      if (!mobile) mobile = clean;
    } else {
      if (!phone) phone = clean;
    }
  }

  // 3. 웹사이트 매칭
  const webMatch = rawText.match(/(https?:\/\/[^\s]+|www\.[^\s]+|[a-zA-Z0-9.-]+\.(?:com|io|ai|co\.kr|kr|net))/i);
  if (webMatch) {
    website = webMatch[0];
  }

  // 4. 주소 탐색
  const addressLine = lines.find(l => 
    l.includes('시 ') || l.includes('구 ') || l.includes('로 ') || l.includes('길 ') || l.includes('빌딩') || l.includes('타워')
  );
  if (addressLine) {
    address = addressLine;
  }

  // 5. 회사명 탐색 (주식회사, (주), Inc., Corp., Partners, Labs 등 또는 첫번째/두번째 줄)
  const companyKeywords = ['(주)', '주식회사', 'inc', 'corp', 'labs', 'partners', '파트너스', '컴퍼니', 'ai', '기술', '전자'];
  const companyCandidate = lines.find(l => 
    companyKeywords.some(kw => l.toLowerCase().includes(kw)) && !l.includes('@') && !l.includes('010')
  );
  if (companyCandidate) {
    company = companyCandidate;
  }

  // 6. 직책 및 부서 키워드
  const titleKeywords = ['대표', 'ceo', 'cto', 'cfo', 'coo', 'cpo', '이사', '상무', '전무', '부사장', '사장', '팀장', '본부장', '수석', '책임', '리드', '심사역', '파트너', '매니저', '엔지니어'];
  
  for (const line of lines) {
    const lower = line.toLowerCase();
    const hasTitle = titleKeywords.some(kw => lower.includes(kw));
    if (hasTitle && !line.includes('@') && !line.includes('010')) {
      // "CTO 한동훈 기술이사" or "의료영상 AI R&D 서유진 수석연구원"
      title = line;
      break;
    }
  }

  // 7. 이름 추출
  // 한글 2~4글자 이름 패턴
  for (const line of lines) {
    if (line === company || line === title || line === address || line === email || line === mobile) continue;
    const nameMatch = line.match(/^[가-힣]{2,4}$/);
    if (nameMatch) {
      name = nameMatch[0];
      break;
    }
    // "홍길동 이사" 같은 경우
    const combinedMatch = line.match(/^([가-힣]{2,4})\s+(대표|이사|수석|팀장|본부장|매니저|리드|CTO|CEO)/);
    if (combinedMatch) {
      name = combinedMatch[1];
      if (!title) title = combinedMatch[2];
      break;
    }
  }

  // 이름이 아직 없으면 라인 중 적절한 토큰 추출
  if (!name && lines.length > 0) {
    const firstWord = lines[0].split(/\s+/)[0];
    if (firstWord && firstWord.length <= 4) name = firstWord;
  }

  const { ageGroup, isEstimated, birthYear } = estimateAgeGroup(title, 2);
  const domain = inferDomainFromDeptAndTitle(department, title, company);

  return {
    id: `scan_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    name: name || '성명 미상',
    currentCompany: company || '회사명 미확인',
    currentDepartment: department,
    currentTitle: title || '직함 미지정',
    mobile: mobile || '010-0000-0000',
    email: email || 'card@scan.local',
    directPhone: phone,
    birthYear,
    estimatedAgeGroup: ageGroup,
    isAgeEstimated: isEstimated,
    primaryDomain: domain,
    skills: [domain],
    careers: [
      {
        id: `cr_scan_1`,
        companyName: company || '회사',
        department,
        title: title || '직함',
        startYear: birthYear ? birthYear + 27 : 2021,
        isCurrent: true,
        source: 'SOURCE_DATA'
      }
    ],
    academics: [],
    sourceType: 'SOURCE_DATA',
    closeness: 3,
    connectionChannel: 'business_card',
    isStale: false,
    memo: `[실시간 명함 OCR 스캔]\n${rawText.slice(0, 150)}...`,
    address,
    website
  };
}
