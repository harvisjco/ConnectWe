// 한글 초성 19자 유니코드 맵
const CHOSEONG_LIST = [
  'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ',
  'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
];

const HANGUL_BASE = 0xac00; // '가'
const HANGUL_END = 0xd7a3;  // '힣'
const CHOSEONG_INTERVAL = 588; // 21 * 28

/**
 * 한글 문자열에서 초성만 추출
 * 예: '김서연' -> 'ㄱㅅㅇ', '네이버' -> 'ㄴㅇㅂ'
 */
export function getChoseong(text: string): string {
  if (!text) return '';
  let result = '';

  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code >= HANGUL_BASE && code <= HANGUL_END) {
      const choseongIndex = Math.floor((code - HANGUL_BASE) / CHOSEONG_INTERVAL);
      result += CHOSEONG_LIST[choseongIndex];
    } else {
      // 영문, 숫자, 기호, 이미 초성인 경우 그대로 유지
      result += text[i];
    }
  }

  return result;
}

/**
 * 쿼리가 순수 초성으로만 구성되어 있는지 여부
 * 예: 'ㄱㅅㅇ' -> true, '김서연' -> false, 'ㄱ' -> true
 */
export function isPureChoseong(query: string): boolean {
  if (!query || !query.trim()) return false;
  const clean = query.replace(/\s+/g, '');
  return clean.split('').every(ch => CHOSEONG_LIST.includes(ch));
}

/**
 * 타겟 문자열에 초성 쿼리가 매칭되는지 검사
 * 예: matchChoseong('김서연', 'ㄱㅅㅇ') -> true
 *     matchChoseong('비바리퍼블리카 토스', 'ㅂㅂㄹ') -> true
 */
export function matchChoseong(target: string, query: string): boolean {
  if (!target || !query) return false;
  const cleanQuery = query.replace(/\s+/g, '');
  if (!cleanQuery) return false;

  const targetChoseong = getChoseong(target).replace(/\s+/g, '');
  return targetChoseong.includes(cleanQuery);
}

/**
 * 두 문자열 간의 레벤슈타인 편집 거리(Levenshtein Distance) 계산
 */
export function getLevenshteinDistance(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix: number[][] = [];
  for (let i = 0; i <= al; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= bl; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // 삭제
        matrix[i][j - 1] + 1,      // 삽입
        matrix[i - 1][j - 1] + cost // 대체
      );
    }
  }

  return matrix[al][bl];
}

/**
 * 후보 단어 목록 중 가장 편집 거리가 가까운 유사 추천 단어 탐색
 * 예: '네이벼' -> '네이버'
 */
export function findClosestMatch(
  word: string,
  candidates: string[],
  maxDistance: number = 2
): string | null {
  if (!word || candidates.length === 0) return null;
  const cleanWord = word.trim().toLowerCase();

  let closest: string | null = null;
  let minDistance = maxDistance + 1;

  for (const candidate of candidates) {
    const cleanCand = candidate.trim().toLowerCase();
    // 완전 일치 시에는 추천할 필요 없음
    if (cleanWord === cleanCand) return null;

    const dist = getLevenshteinDistance(cleanWord, cleanCand);
    if (dist <= maxDistance && dist < minDistance) {
      minDistance = dist;
      closest = candidate;
    }
  }

  return closest;
}
