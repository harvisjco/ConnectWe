-- ConnectWe Enterprise Security Hardening Migration
-- Supabase PostgreSQL RLS 강화 및 무단 덮어쓰기 방지 패치

-- 1. Vault 테이블에 보안 토큰 해시 및 소유자 필드 보강
ALTER TABLE public.connectwe_vaults 
ADD COLUMN IF NOT EXISTS vault_token_hash TEXT,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 2. 기존 전면 개방 정책 제거
DROP POLICY IF EXISTS "Allow public read-write for connectwe_vaults" ON public.connectwe_vaults;

-- 3. 강화된 보안 RLS 정책:
-- 인증된 사용자는 자신의 vault_id만 접근 가능
CREATE POLICY "Authenticated users can manage their own vault"
ON public.connectwe_vaults
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 익명 클라이언트의 경우, 토큰 해시가 일치하거나 신규 생성 시에만 안전하게 업서트 허용
CREATE POLICY "Anon users can access vault with matching token hash"
ON public.connectwe_vaults
FOR ALL
TO anon
USING (
    -- 기본 vault 또는 특정 vault에 대해 빈 상태이거나 기존 토큰과 일치할 때
    vault_token_hash IS NULL OR vault_token_hash = current_setting('request.headers', true)::json->>'x-vault-token'
)
WITH CHECK (
    vault_token_hash IS NULL OR vault_token_hash = current_setting('request.headers', true)::json->>'x-vault-token'
);

-- 4. Audit Log 테이블 생성 (보안 접근 및 딜 변동 이력 감시)
CREATE TABLE IF NOT EXISTS public.connectwe_security_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    actor_ip TEXT,
    resource_id TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.connectwe_security_audit_logs ENABLE ROW LEVEL SECURITY;
