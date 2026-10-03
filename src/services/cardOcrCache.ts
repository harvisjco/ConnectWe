import { GeminiScanResult } from './geminiVisionOcrService';

const CACHE_STORAGE_KEY = 'connectwe_card_ocr_cache_v1';
const MAX_CACHE_ENTRIES = 100;

interface CachedEntry {
  fingerprint: string;
  result: GeminiScanResult;
  timestamp: number;
}

/**
 * 이미지 파일이나 Base64 문자열로부터 SHA-256 기반의 고유 지문(Fingerprint)을 비동기 계산
 */
export async function computeCardFingerprint(input: File | Blob | string): Promise<string> {
  try {
    let arrayBuffer: ArrayBuffer;

    if (typeof input === 'string') {
      const encoder = new TextEncoder();
      arrayBuffer = encoder.encode(input).buffer;
    } else {
      // File / Blob인 경우: 앞 64KB 및 크기 메타데이터 결합
      const slice = input.slice(0, 65536);
      arrayBuffer = await slice.arrayBuffer();
    }

    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      const sizeTag = typeof input === 'string' ? input.length : input.size;
      return `card_${hashHex.slice(0, 24)}_${sizeTag}`;
    }
  } catch (err) {
    console.warn('SubtleCrypto unavailable, falling back to fast hash:', err);
  }

  // 폴백: FNV-1a 32비트 고속 해시
  let str = '';
  if (typeof input === 'string') {
    str = input.slice(0, 2048);
  } else {
    const inputName = typeof File !== 'undefined' && input instanceof File ? input.name : 'card';
    str = `${inputName}_${input.size}_${input.type}`;
  }

  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `card_fnv_${(hash >>> 0).toString(16)}`;
}

/**
 * 로컬 캐시 스토리지에서 모든 캐시 항목 로드
 */
function loadCacheMap(): Map<string, CachedEntry> {
  const map = new Map<string, CachedEntry>();
  if (typeof localStorage === 'undefined') return map;
  try {
    const raw = localStorage.getItem(CACHE_STORAGE_KEY);
    if (raw) {
      const list: CachedEntry[] = JSON.parse(raw);
      list.forEach(item => map.set(item.fingerprint, item));
    }
  } catch {}
  return map;
}

/**
 * 캐시 맵을 로컬 스토리지에 저장 (최대 100건 LRU 관리)
 */
function saveCacheMap(map: Map<string, CachedEntry>): void {
  if (typeof localStorage === 'undefined') return;
  try {
    const entries = Array.from(map.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, MAX_CACHE_ENTRIES);
    localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to save OCR cache:', err);
  }
}

/**
 * 캐시된 OCR 결과 조회 (조회 성공 시 토큰 소비 0회)
 */
export function getCachedOcrResult(fingerprint: string): GeminiScanResult | null {
  const map = loadCacheMap();
  const entry = map.get(fingerprint);
  if (!entry) return null;

  // 히트 시 타임스탬프 갱신
  entry.timestamp = Date.now();
  map.set(fingerprint, entry);
  saveCacheMap(map);

  return {
    ...entry.result,
    quotaMessage: '⚡ 로컬 고속 캐시에서 즉시 복원되었습니다. (Gemini 토큰 소모: 0개)',
  };
}

/**
 * 새로운 OCR 결과를 지문과 함께 캐시에 영속화
 */
export function cacheOcrResult(fingerprint: string, result: GeminiScanResult): void {
  const map = loadCacheMap();
  map.set(fingerprint, {
    fingerprint,
    result,
    timestamp: Date.now()
  });
  saveCacheMap(map);
}

/**
 * OCR 캐시 전체 삭제
 */
export function clearOcrCache(): void {
  try {
    localStorage.removeItem(CACHE_STORAGE_KEY);
  } catch {}
}

/**
 * 캐시 통계 반환
 */
export function getOcrCacheStats(): { count: number; estimatedSavedTokens: number } {
  const map = loadCacheMap();
  const count = map.size;
  // Gemini 1.5 Flash 기준 명함 1장 스캔당 약 800~1,200 토큰 절약
  return {
    count,
    estimatedSavedTokens: count * 1000
  };
}
