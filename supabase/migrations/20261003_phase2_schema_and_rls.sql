-- ========================================================
-- ConnectWe Phase 2: PostgreSQL Schema & Row-Level Security (RLS)
-- Multi-Tenant Zero-Knowledge Data Vault Isolation
-- ========================================================

-- 1. 사용자 프로필 테이블 (Profiles)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  user_role TEXT DEFAULT 'general' CHECK (user_role IN ('general', 'hidden', 'master')),
  daily_scan_quota INTEGER DEFAULT 5,
  scan_quota_remaining INTEGER DEFAULT 5,
  paid_credits INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles RLS 활성화
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. 사용자 암호화 볼트 테이블 (User Vaults)
CREATE TABLE IF NOT EXISTS public.user_vaults (
  vault_id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  encrypted_ciphertext TEXT NOT NULL,
  item_count INTEGER DEFAULT 0,
  version INTEGER DEFAULT 1,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Vaults RLS 활성화
ALTER TABLE public.user_vaults ENABLE ROW LEVEL SECURITY;

-- 자신의 볼트만 읽고 쓸 수 있는 RLS 엄격 격리 정책
CREATE POLICY "Users can access own vault"
  ON public.user_vaults FOR ALL
  USING (
    auth.uid() = user_id OR
    vault_id = 'connectwe_vault_' || auth.uid()::text
  )
  WITH CHECK (
    auth.uid() = user_id OR
    vault_id = 'connectwe_vault_' || auth.uid()::text
  );

-- 3. 감사 로그 테이블 (Audit Logs - PIPA/개인정보보호법 컴플라이언스)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 인덱스 최적화
CREATE INDEX IF NOT EXISTS idx_user_vaults_user_id ON public.user_vaults(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
