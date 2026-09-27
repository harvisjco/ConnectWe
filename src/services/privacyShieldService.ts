/**
 * ConnectWe VIP 프라이버시 쉴드 & 대외비 화면 공유 모드 서비스
 * - 화면 공유(Zoom/Google Meet)나 대중교통 이동 중 타인의 시선(Shoulder Surfing)으로부터 VIP PII를 완벽 보호
 */
import { Person } from '../types/network';

export function maskName(name: string, isShieldActive: boolean): string {
  if (!isShieldActive || !name) return name;
  const trimmed = name.trim();
  if (trimmed.length <= 1) return trimmed;
  if (trimmed.length === 2) {
    return `${trimmed[0]}*`;
  }
  if (trimmed.length === 3) {
    return `${trimmed[0]}*${trimmed[2]}`;
  }
  // 4글자 이상 (외국인 성명 포함)
  const first = trimmed.slice(0, 1);
  const last = trimmed.slice(-1);
  const middleStars = '*'.repeat(trimmed.length - 2);
  return `${first}${middleStars}${last}`;
}

export function maskPhone(phone: string, isShieldActive: boolean): string {
  if (!isShieldActive || !phone) return phone;
  // 010-1234-5678 or 01012345678
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}-****-${clean.slice(7)}`;
  }
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-***-${clean.slice(6)}`;
  }
  return phone.replace(/\d(?=\d{4})/g, '*');
}

export function maskEmail(email: string, isShieldActive: boolean): string {
  if (!isShieldActive || !email) return email;
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***.***';
  const [local, domain] = parts;
  if (local.length <= 1) {
    return `*@${domain}`;
  }
  const maskedLocal = local[0] + '*'.repeat(Math.max(2, local.length - 1));
  return `${maskedLocal}@${domain}`;
}

export function maskCompany(company: string, isShieldActive: boolean): string {
  if (!isShieldActive || !company) return company;
  const trimmed = company.trim();
  if (trimmed.length <= 2) return trimmed;
  if (trimmed.length === 3) return `${trimmed[0]}*${trimmed[2]}`;
  if (trimmed.length === 4) return `${trimmed.slice(0, 2)}**`;
  return `${trimmed.slice(0, 2)}${'*'.repeat(trimmed.length - 3)}${trimmed.slice(-1)}`;
}

export function maskMemo(memo: string, isShieldActive: boolean): string {
  if (!isShieldActive || !memo) return memo;
  return '🔒 [대외비 엠바고 보호 중 · 프라이버시 쉴드 해제 시 열람 가능]';
}

/**
 * 인물 객체의 민감정보(PII)를 안전하게 마스킹한 복사본을 반환합니다.
 * ID는 고유성을 위해 보존됩니다.
 */
export function maskPerson(person: Person, isShieldActive: boolean): Person {
  if (!isShieldActive) return person;
  return {
    ...person,
    name: maskName(person.name, true),
    mobile: maskPhone(person.mobile, true),
    email: maskEmail(person.email, true),
    memo: maskMemo(person.memo || '', true),
  };
}
