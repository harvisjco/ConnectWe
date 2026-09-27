// ConnectWe 회원 등급 및 권한 관리 시스템 (Role-Based Access Control)

export type UserRole = 'general' | 'hidden' | 'master';

export interface RoleConfig {
  role: UserRole;
  label: string;
  badgeLabel: string;
  description: string;
  colorScheme: {
    bg: string;
    text: string;
    border: string;
    ring: string;
    iconColor: string;
  };
}

export const USER_ROLES: Record<UserRole, RoleConfig> = {
  general: {
    role: 'general',
    label: '일반 회원 (Standard)',
    badgeLabel: '일반 회원',
    description: '심플한 동문 주소록, 생일 챙기기, 소모임 커뮤니티',
    colorScheme: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      ring: 'ring-emerald-500/20',
      iconColor: 'text-emerald-600 dark:text-emerald-400'
    }
  },
  hidden: {
    role: 'hidden',
    label: 'Hidden 회원 (VIP Executive)',
    badgeLabel: 'Hidden 회원',
    description: '순화된 품격 있는 비즈니스 인맥 & 파트너십 협력',
    colorScheme: {
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      ring: 'ring-indigo-500/20',
      iconColor: 'text-indigo-600 dark:text-indigo-400'
    }
  },
  master: {
    role: 'master',
    label: '마스터 관리자 (Super Admin)',
    badgeLabel: '마스터',
    description: 'C-Level 관계 총괄 관제, DART 실공시 팩트, 기업 지배구조 및 전체 권한',
    colorScheme: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      ring: 'ring-amber-500/20',
      iconColor: 'text-amber-600 dark:text-amber-400'
    }
  }
};

const STORAGE_KEY = 'connectwe_user_role';

export function getStoredUserRole(): UserRole {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as UserRole | null;
    if (stored && (stored === 'general' || stored === 'hidden' || stored === 'master')) {
      return stored;
    }
  } catch (e) {
    console.error('Failed to read user role from storage:', e);
  }
  return 'general'; // 기본값은 심플한 일반 회원
}

export function saveUserRole(role: UserRole): void {
  try {
    localStorage.setItem(STORAGE_KEY, role);
  } catch (e) {
    console.error('Failed to save user role to storage:', e);
  }
}
