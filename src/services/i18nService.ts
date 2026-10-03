export type SupportedLocale = 'ko' | 'en' | 'ja';

export interface I18nDictionary {
  nav: {
    command: string;
    company: string;
    orgchart: string;
    deals: string;
    proximity: string;
    promotion: string;
    team: string;
    alumni: string;
    canvas: string;
    galaxy3d: string;
  };
  kpi: {
    totalPipeline: string;
    weightedValue: string;
    avgHealth: string;
    keymanCoverage: string;
    inProgressDeals: string;
    successWeighted: string;
  };
  offline: {
    offlineMode: string;
    pendingCount: string;
    synced: string;
    syncing: string;
  };
  auth: {
    biometricQuickLogin: string;
    loginWithPassword: string;
    touchIdFaceId: string;
    authenticating: string;
    success: string;
  };
  common: {
    confirm: string;
    cancel: string;
    close: string;
    copy: string;
    copied: string;
    save: string;
    delete: string;
  };
}

export const DICTIONARIES: Record<SupportedLocale, I18nDictionary> = {
  ko: {
    nav: {
      command: '관계 총괄',
      company: '실공시 팩트',
      orgchart: '기업 조직도',
      deals: '비즈니스 파트너십',
      proximity: '티타임 레이더',
      promotion: '인사·영전 소식',
      team: '팀 협업',
      alumni: '동문 주소록',
      canvas: '2D 관계망',
      galaxy3d: '3D 우주망'
    },
    kpi: {
      totalPipeline: '총 파이프라인 규모',
      weightedValue: '건전도 가중 실질 가치',
      avgHealth: '평균 인맥 연결 건전도',
      keymanCoverage: '의사결정권자/챔피언 확보율',
      inProgressDeals: '건 진행 중',
      successWeighted: '성사 가중치'
    },
    offline: {
      offlineMode: '오프라인 모드 가동 중',
      pendingCount: '건 대기 중',
      synced: '온라인 자동 동기화 완료',
      syncing: '클라우드 볼트 동기화 중...'
    },
    auth: {
      biometricQuickLogin: 'Touch ID / Face ID 1초 퀵 로그인',
      loginWithPassword: '비밀번호로 로그인',
      touchIdFaceId: '생체인증',
      authenticating: '생체 센서 인증 대기 중...',
      success: '생체인증 성공! 안전하게 로그인되었습니다.'
    },
    common: {
      confirm: '확인',
      cancel: '취소',
      close: '닫기',
      copy: '복사',
      copied: '복사 완료',
      save: '저장',
      delete: '삭제'
    }
  },
  en: {
    nav: {
      command: 'Overview',
      company: 'Corporate Facts',
      orgchart: 'Org Chart',
      deals: 'Partnerships',
      proximity: 'Tea Time Radar',
      promotion: 'Appointments',
      team: 'Team Network',
      alumni: 'Alumni Directory',
      canvas: '2D Canvas',
      galaxy3d: '3D Galaxy'
    },
    kpi: {
      totalPipeline: 'Total Pipeline Volume',
      weightedValue: 'Weighted Real Value',
      avgHealth: 'Avg Connection Health',
      keymanCoverage: 'Key Decision-Maker Coverage',
      inProgressDeals: 'in progress',
      successWeighted: 'Weighted'
    },
    offline: {
      offlineMode: 'Offline Mode Active',
      pendingCount: 'actions pending',
      synced: 'Online Auto-Synced',
      syncing: 'Syncing with cloud vault...'
    },
    auth: {
      biometricQuickLogin: 'Touch ID / Face ID Quick Login',
      loginWithPassword: 'Login with Password',
      touchIdFaceId: 'Biometrics',
      authenticating: 'Waiting for biometric sensor...',
      success: 'Biometric verification successful!'
    },
    common: {
      confirm: 'Confirm',
      cancel: 'Cancel',
      close: 'Close',
      copy: 'Copy',
      copied: 'Copied',
      save: 'Save',
      delete: 'Delete'
    }
  },
  ja: {
    nav: {
      command: '人脈統括',
      company: '適時開示事実',
      orgchart: '企業組織図',
      deals: 'パートナーシップ',
      proximity: 'ティータイム',
      promotion: '役員昇進·就任',
      team: 'チーム協業',
      alumni: '同窓アドレス帳',
      canvas: '2D相関図',
      galaxy3d: '3D銀河網'
    },
    kpi: {
      totalPipeline: '総案件パイプライン',
      weightedValue: '加重実質価値',
      avgHealth: '平均コネクション健全度',
      keymanCoverage: '意思決定層カバー率',
      inProgressDeals: '件 進行中',
      successWeighted: '確度加重'
    },
    offline: {
      offlineMode: 'オフライン稼働中',
      pendingCount: '件保留中',
      synced: 'オンライン同期完了',
      syncing: 'クラウド金庫と同期中...'
    },
    auth: {
      biometricQuickLogin: '生体認証(Touch ID/Face ID)で1秒ログイン',
      loginWithPassword: 'パスワードでログイン',
      touchIdFaceId: '生体認証',
      authenticating: '生体認証センサー待機中...',
      success: '生体認証に成功しました。'
    },
    common: {
      confirm: '確認',
      cancel: 'キャンセル',
      close: '閉じる',
      copy: 'コピー',
      copied: 'コピー完了',
      save: '保存',
      delete: '削除'
    }
  }
};

const STORAGE_LOCALE_KEY = 'connectwe_locale';
const LOCALE_CHANGE_EVENT = 'connectwe_locale_changed';

class I18nService {
  private currentLocale: SupportedLocale = 'ko';
  private listeners: Set<(locale: SupportedLocale) => void> = new Set();

  constructor() {
    this.initLocale();
  }

  private initLocale() {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_LOCALE_KEY) as SupportedLocale;
      if (saved && (saved === 'ko' || saved === 'en' || saved === 'ja')) {
        this.currentLocale = saved;
      }
    }
  }

  public getLocale(): SupportedLocale {
    return this.currentLocale;
  }

  public setLocale(locale: SupportedLocale) {
    if (this.currentLocale === locale) return;
    this.currentLocale = locale;
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_LOCALE_KEY, locale);
    }
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(LOCALE_CHANGE_EVENT, { detail: locale }));
    }
    this.listeners.forEach(fn => fn(locale));
  }

  public subscribe(listener: (locale: SupportedLocale) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 번역 텍스트 조회 (도트 표기법 지원: 'nav.deals', 'kpi.totalPipeline')
   */
  public t(key: string, params?: Record<string, string | number>): string {
    const dict = DICTIONARIES[this.currentLocale] || DICTIONARIES.ko;
    const parts = key.split('.');
    
    let current: unknown = dict;
    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        // Fallback to Korean
        let fallbackCurrent: unknown = DICTIONARIES.ko;
        for (const fbPart of parts) {
          if (fallbackCurrent && typeof fallbackCurrent === 'object' && fbPart in fallbackCurrent) {
            fallbackCurrent = (fallbackCurrent as Record<string, unknown>)[fbPart];
          } else {
            return key;
          }
        }
        current = fallbackCurrent;
        break;
      }
    }

    if (typeof current !== 'string') {
      return key;
    }

    let text = current;
    if (params) {
      Object.entries(params).forEach(([pKey, pVal]) => {
        text = text.replace(new RegExp(`{${pKey}}`, 'g'), String(pVal));
      });
    }

    return text;
  }
}

export const i18n = new I18nService();
export const t = (key: string, params?: Record<string, string | number>) => i18n.t(key, params);
