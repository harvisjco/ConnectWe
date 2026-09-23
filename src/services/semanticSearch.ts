import { Person } from '../types/network';

/**
 * 텍스트를 정규화된 바이그램(Bi-gram) 및 단어 빈도 벡터(TF-IDF 스타일)로 변환
 */
function createTextVector(text: string): Map<string, number> {
  const clean = text.toLowerCase().replace(/[^a-zA-Z0-9가-힣\s]/g, ' ');
  const tokens = clean.split(/\s+/).filter(t => t.length >= 2);
  const vec = new Map<string, number>();

  // 1. 단어 토큰 빈도
  tokens.forEach(token => {
    vec.set(token, (vec.get(token) || 0) + 1.5);
  });

  // 2. 문자 단위 바이그램(한국어 조사/어미 대응)
  for (let i = 0; i < clean.length - 1; i++) {
    const bigram = clean.substring(i, i + 2).trim();
    if (bigram.length === 2) {
      vec.set(bigram, (vec.get(bigram) || 0) + 0.5);
    }
  }

  // 벡터 정규화 (L2 Norm)
  let norm = 0;
  vec.forEach(val => {
    norm += val * val;
  });
  norm = Math.sqrt(norm);

  if (norm > 0) {
    vec.forEach((val, key) => {
      vec.set(key, val / norm);
    });
  }

  return vec;
}

/**
 * 두 벡터 간의 코사인 유사도(Cosine Similarity) 계산 (0.0 ~ 1.0)
 */
function cosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
  let dotProduct = 0;
  vecA.forEach((valA, key) => {
    const valB = vecB.get(key);
    if (valB !== undefined) {
      dotProduct += valA * valB;
    }
  });
  return dotProduct;
}

/**
 * 인물 객체의 전체 텍스트 코퍼스 생성
 */
function getPersonCorpus(person: Person): string {
  const careerText = person.careers.map(c => `${c.companyName} ${c.title} ${c.department || ''}`).join(' ');
  const academicText = person.academics.map(a => `${a.schoolName} ${a.major || ''} ${a.degree || ''}`).join(' ');
  const dartText = person.dartInfo ? `${person.dartInfo.stockName} ${person.dartInfo.registeredRole}` : '';
  return `${person.name} ${person.currentCompany} ${person.currentTitle} ${person.currentDepartment} ${person.primaryDomain} ${person.skills.join(' ')} ${careerText} ${academicText} ${dartText} ${person.memo || ''}`;
}

/**
 * 자연어 쿼리와 인맥 간의 의미론적 벡터 유사도 매칭 실행
 */
export function calculateSemanticMatches(
  query: string, 
  people: Person[], 
  threshold: number = 0.12
): { person: Person; score: number }[] {
  const queryVec = createTextVector(query);
  if (queryVec.size === 0) return [];

  const results: { person: Person; score: number }[] = [];

  people.forEach(person => {
    const corpus = getPersonCorpus(person);
    const personVec = createTextVector(corpus);
    const sim = cosineSimilarity(queryVec, personVec);

    if (sim >= threshold) {
      results.push({ person, score: sim });
    }
  });

  return results.sort((a, b) => b.score - a.score);
}
