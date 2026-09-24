-- ConnectWe Enterprise Relationship Intelligence OS
-- Supabase PostgreSQL Production Schema & DDL
-- Project Ref: fijbhtuuyrprqlataknq

-- 1. E2EE 암호화 클라우드 볼트 테이블 (Zero-Knowledge AES-256 Storage)
CREATE TABLE IF NOT EXISTS public.connectwe_vaults (
    vault_id TEXT PRIMARY KEY DEFAULT 'default_vault',
    version TEXT NOT NULL DEFAULT '1.0',
    synced_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    node_count INTEGER NOT NULL DEFAULT 0,
    encrypted_payload TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- RLS 활성화
ALTER TABLE public.connectwe_vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read-write for connectwe_vaults"
ON public.connectwe_vaults
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 2. 인맥 마스터 테이블 (Person Intelligence)
CREATE TABLE IF NOT EXISTS public.connectwe_people (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    current_company TEXT NOT NULL,
    current_department TEXT,
    current_title TEXT NOT NULL,
    mobile TEXT,
    email TEXT,
    closeness SMALLINT NOT NULL DEFAULT 3,
    primary_domain TEXT,
    skills TEXT[] DEFAULT '{}',
    source_type TEXT NOT NULL DEFAULT 'SOURCE_DATA',
    dart_info JSONB,
    careers JSONB DEFAULT '[]',
    academics JSONB DEFAULT '[]',
    memo TEXT,
    is_stale BOOLEAN NOT NULL DEFAULT false,
    last_contact_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_people_company ON public.connectwe_people(current_company);
CREATE INDEX IF NOT EXISTS idx_people_domain ON public.connectwe_people(primary_domain);
CREATE INDEX IF NOT EXISTS idx_people_closeness ON public.connectwe_people(closeness);

ALTER TABLE public.connectwe_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read-write for connectwe_people"
ON public.connectwe_people
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 3. 전략 비즈니스 딜 파이프라인 테이블 (Deal Pipeline War Room)
CREATE TABLE IF NOT EXISTS public.connectwe_deals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    target_company TEXT NOT NULL,
    target_industry TEXT,
    deal_size TEXT,
    stage TEXT NOT NULL DEFAULT 'PROSPECT',
    expected_close_date DATE,
    stakeholders JSONB DEFAULT '[]',
    health_score SMALLINT NOT NULL DEFAULT 15,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.connectwe_deals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read-write for connectwe_deals"
ON public.connectwe_deals
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- 4. 활동 로그 테이블 (Meeting Debriefs & Notes)
CREATE TABLE IF NOT EXISTS public.connectwe_activity_logs (
    id TEXT PRIMARY KEY,
    person_id TEXT REFERENCES public.connectwe_people(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    logged_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS idx_activity_person ON public.connectwe_activity_logs(person_id);

ALTER TABLE public.connectwe_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anon read-write for connectwe_activity_logs"
ON public.connectwe_activity_logs
FOR ALL
TO anon, authenticated
USING (true)
WITH CHECK (true);
