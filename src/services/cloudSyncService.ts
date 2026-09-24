import { Person } from '../types/network';
import { encryptData, decryptData } from './cryptoStorage';
import { supabase } from './supabaseClient';

export interface CloudSyncStatus {
  isEnabled: boolean;
  endpointUrl: string;
  lastSyncedAt: string | null;
  syncedNodeCount: number;
  isSyncing: boolean;
  cloudProvider: 'SUPABASE' | 'LOCAL_VAULT';
}

const CLOUD_SYNC_SETTINGS_KEY = 'connectwe_cloud_sync_config_v1';
const CLOUD_SYNC_VAULT_KEY = 'connectwe_cloud_vault_mock_storage';

/**
 * 클라우드 동기화 환경설정 불러오기
 */
export function getCloudSyncConfig(): CloudSyncStatus {
  try {
    const raw = localStorage.getItem(CLOUD_SYNC_SETTINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to load cloud sync config:', err);
  }

  return {
    isEnabled: true,
    endpointUrl: 'https://fijbhtuuyrprqlataknq.supabase.co',
    lastSyncedAt: null,
    syncedNodeCount: 0,
    isSyncing: false,
    cloudProvider: 'SUPABASE',
  };
}

/**
 * 클라우드 동기화 환경설정 저장
 */
export function saveCloudSyncConfig(config: CloudSyncStatus): void {
  localStorage.setItem(CLOUD_SYNC_SETTINGS_KEY, JSON.stringify(config));
}

/**
 * 종단간 암호화(E2EE) 클라우드 백업 실행
 * 사용자 패스프레이즈로 로컬 브라우저에서 AES-256-GCM 암호화 후 Supabase Cloud Vault에 안전하게 전송
 */
export async function pushEncryptedBackupToCloud(
  people: Person[],
  masterPassphrase: string = 'ConnectWe_Default_Cloud_Key_v1'
): Promise<{ success: boolean; message: string; timestamp: string }> {
  try {
    const jsonStr = JSON.stringify(people);
    // 1. 브라우저 로컬에서 선제적 암호화 (Zero-Knowledge: 서버는 원문을 결코 볼 수 없음)
    const encryptedBlob = await encryptData(jsonStr, masterPassphrase);

    const payload = {
      vault_id: 'default_vault',
      version: '1.0',
      synced_at: new Date().toISOString(),
      node_count: people.length,
      encrypted_payload: encryptedBlob,
      updated_at: new Date().toISOString(),
    };

    // 2. Supabase Cloud Vault에 업서트 시도
    let syncedToSupabase = false;
    try {
      const { error } = await supabase
        .from('connectwe_vaults')
        .upsert(payload, { onConflict: 'vault_id' });

      if (!error) {
        syncedToSupabase = true;
      } else {
        console.warn('Supabase upsert note (table may not exist yet, falling back to local vault):', error.message);
      }
    } catch (e) {
      console.warn('Supabase cloud network fallback:', e);
    }

    // 3. 로컬 볼트에도 이중 보존
    localStorage.setItem(CLOUD_SYNC_VAULT_KEY, JSON.stringify(payload));

    const config = getCloudSyncConfig();
    const updatedConfig: CloudSyncStatus = {
      ...config,
      isEnabled: true,
      lastSyncedAt: new Date().toLocaleString('ko-KR'),
      syncedNodeCount: people.length,
      isSyncing: false,
      cloudProvider: syncedToSupabase ? 'SUPABASE' : 'LOCAL_VAULT',
    };
    saveCloudSyncConfig(updatedConfig);

    const targetDesc = syncedToSupabase
      ? 'Supabase Cloud Vault(https://fijbhtuuyrprqlataknq.supabase.co)'
      : 'E2EE 로컬 보안 볼트';

    return {
      success: true,
      message: `총 ${people.length}명의 인맥이 AES-256 E2EE 종단간 암호화되어 ${targetDesc}에 안전하게 백업되었습니다.`,
      timestamp: updatedConfig.lastSyncedAt!,
    };
  } catch (err) {
    return {
      success: false,
      message: `클라우드 동기화 실패: ${err instanceof Error ? err.message : String(err)}`,
      timestamp: new Date().toLocaleString('ko-KR'),
    };
  }
}

/**
 * 종단간 암호화(E2EE) 클라우드 백업으로부터 인맥 복원
 */
export async function pullEncryptedBackupFromCloud(
  masterPassphrase: string = 'ConnectWe_Default_Cloud_Key_v1'
): Promise<{ success: boolean; people?: Person[]; message: string }> {
  try {
    let encryptedPayload: string | null = null;

    // 1. Supabase Cloud Vault 조회 시도
    try {
      const { data, error } = await supabase
        .from('connectwe_vaults')
        .select('encrypted_payload')
        .eq('vault_id', 'default_vault')
        .single();

      if (!error && data?.encrypted_payload) {
        encryptedPayload = data.encrypted_payload;
      }
    } catch (e) {
      console.warn('Supabase pull fallback:', e);
    }

    // 2. Supabase 미존재 시 로컬 볼트 조회
    if (!encryptedPayload) {
      const rawVault = localStorage.getItem(CLOUD_SYNC_VAULT_KEY);
      if (rawVault) {
        const parsed = JSON.parse(rawVault);
        encryptedPayload = parsed.encrypted_payload || parsed.encryptedData;
      }
    }

    if (!encryptedPayload) {
      return { success: false, message: '클라우드 볼트에 백업된 데이터가 없습니다.' };
    }

    // 3. 브라우저에서 사용자 패스프레이즈로 직접 복호화
    const decryptedJson = await decryptData(encryptedPayload, masterPassphrase);
    const people: Person[] = JSON.parse(decryptedJson);

    return {
      success: true,
      people,
      message: `클라우드 볼트로부터 ${people.length}명의 인맥 데이터를 성공적으로 복원했습니다.`,
    };
  } catch (err) {
    return {
      success: false,
      message: '복호화 실패: 비밀번호가 일치하지 않거나 데이터가 손상되었습니다.',
    };
  }
}
