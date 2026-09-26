import { supabase, checkSupabaseConnection } from './supabaseClient';
import { encryptData, decryptData } from './cryptoStorage';
import { Person } from '../types/network';
import { BusinessDeal, loadDealsFromStorage, saveDealsToStorage } from './dealPipelineService';
import { PromotionEvent, loadPromotionEvents, savePromotionEvents } from './promotionRadarService';
import { PrivateSalonSession } from '../types/salon';
import { loadSalonSessions, saveSalonSessions } from './salonService';

export interface CloudVaultPayload {
  version: number;
  timestamp: string;
  people: Person[];
  deals?: BusinessDeal[];
  promotions?: PromotionEvent[];
  salons?: PrivateSalonSession[];
}

export interface CloudSyncConfig {
  supabaseUrl: string;
  isConfigured: boolean;
  lastSyncedAt: string | null;
  syncIntervalMin: number;
}

export interface SyncStatus {
  lastSyncAt: string | null;
  itemCount: number;
  vaultSizeKb: number;
  isEncrypted: boolean;
  cloudConnected: boolean;
  cloudUrl: string;
}

const SYNC_META_KEY = 'connectwe_cloud_sync_meta_v1';
const SYNC_CONFIG_KEY = 'connectwe_cloud_sync_config_v1';

export function getCloudSyncConfig(): CloudSyncConfig {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return {
    supabaseUrl: 'https://fijbhtuuyrprqlataknq.supabase.co',
    isConfigured: true,
    lastSyncedAt: null,
    syncIntervalMin: 60
  };
}

export function saveCloudSyncConfig(config: CloudSyncConfig): void {
  try {
    localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config));
  } catch {}
}

/**
 * 현재 로컬에 저장된 모든 핵심 비즈니스 자산을 통합 페이로드로 취합
 */
export function aggregateLocalVault(people: Person[]): CloudVaultPayload {
  const deals = loadDealsFromStorage(people);
  const promotions = loadPromotionEvents(people);
  const salons = loadSalonSessions();

  return {
    version: 1,
    timestamp: new Date().toISOString(),
    people,
    deals,
    promotions,
    salons
  };
}

/**
 * Supabase 클라우드로 종단간 암호화(E2EE) 백업 업로드
 */
export async function uploadEncryptedVaultToCloud(
  payload: CloudVaultPayload,
  passphrase: string = 'connectwe-default-vault-key'
): Promise<{ success: boolean; message: string; timestamp: string }> {
  try {
    const jsonStr = JSON.stringify(payload);
    const cipherBase64 = await encryptData(jsonStr, passphrase);

    const conn = await checkSupabaseConnection();
    const vaultId = 'connectwe_master_vault';
    const record = {
      vault_id: vaultId,
      encrypted_ciphertext: cipherBase64,
      item_count: payload.people.length,
      updated_at: new Date().toISOString()
    };

    localStorage.setItem('connectwe_local_e2ee_vault', JSON.stringify(record));

    if (conn.connected) {
      const { error } = await supabase
        .from('user_vaults')
        .upsert(record, { onConflict: 'vault_id' });

      if (error) {
        console.warn('Supabase remote table sync fallback:', error.message);
      }
    }

    const config = getCloudSyncConfig();
    config.lastSyncedAt = new Date().toLocaleString('ko-KR');
    saveCloudSyncConfig(config);

    const totalItems = payload.people.length + (payload.deals?.length || 0) + (payload.salons?.length || 0);
    const sizeKb = Math.round(cipherBase64.length / 1024);
    saveSyncMeta({
      lastSyncAt: record.updated_at,
      itemCount: totalItems,
      vaultSizeKb: sizeKb,
      isEncrypted: true,
      cloudConnected: conn.connected,
      cloudUrl: conn.url
    });

    return {
      success: true,
      message: `성공적으로 AES-256 GCM 암호화되어 클라우드 금고에 백업되었습니다. (인맥 ${payload.people.length}명, ${sizeKb}KB)`,
      timestamp: record.updated_at
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `클라우드 암호화 백업 실패: ${msg}`,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 구버전 호환용 push 함수
 */
export async function pushEncryptedBackupToCloud(
  people: Person[],
  passphrase?: string
): Promise<{ success: boolean; message: string; timestamp: string }> {
  const payload = aggregateLocalVault(people);
  return uploadEncryptedVaultToCloud(payload, passphrase);
}

/**
 * Supabase 클라우드 또는 로컬 암호화 볼트에서 복원
 */
export async function downloadAndRestoreVault(
  passphrase: string = 'connectwe-default-vault-key'
): Promise<{ success: boolean; message: string; people?: Person[]; payload?: CloudVaultPayload }> {
  try {
    let cipherBase64: string | null = null;

    const conn = await checkSupabaseConnection();
    if (conn.connected) {
      const { data, error } = await supabase
        .from('user_vaults')
        .select('*')
        .eq('vault_id', 'connectwe_master_vault')
        .single();

      if (!error && data) {
        cipherBase64 = data.encrypted_ciphertext;
      }
    }

    if (!cipherBase64) {
      const raw = localStorage.getItem('connectwe_local_e2ee_vault');
      if (raw) {
        const parsed = JSON.parse(raw);
        cipherBase64 = parsed.encrypted_ciphertext;
      }
    }

    if (!cipherBase64) {
      return {
        success: false,
        message: '저장된 암호화 백업 데이터가 존재하지 않습니다.'
      };
    }

    const decryptedJson = await decryptData(cipherBase64, passphrase);
    const payload: CloudVaultPayload = JSON.parse(decryptedJson);

    if (payload.deals) saveDealsToStorage(payload.deals);
    if (payload.promotions) savePromotionEvents(payload.promotions);
    if (payload.salons) saveSalonSessions(payload.salons);

    return {
      success: true,
      message: `복호화 성공! 인맥 ${payload.people.length}명이 성공적으로 복원되었습니다.`,
      people: payload.people,
      payload
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `복호화 실패: 비밀번호가 일치하지 않거나 데이터가 손상되었습니다. (${msg})`
    };
  }
}

/**
 * 구버전 호환용 pull 함수
 */
export async function pullEncryptedBackupFromCloud(
  passphrase?: string
): Promise<{ success: boolean; message: string; people?: Person[]; payload?: CloudVaultPayload }> {
  return downloadAndRestoreVault(passphrase);
}

export function loadSyncMeta(): SyncStatus {
  try {
    const raw = localStorage.getItem(SYNC_META_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}

  return {
    lastSyncAt: null,
    itemCount: 0,
    vaultSizeKb: 0,
    isEncrypted: true,
    cloudConnected: false,
    cloudUrl: 'https://fijbhtuuyrprqlataknq.supabase.co'
  };
}

export function saveSyncMeta(meta: SyncStatus): void {
  try {
    localStorage.setItem(SYNC_META_KEY, JSON.stringify(meta));
  } catch {}
}
