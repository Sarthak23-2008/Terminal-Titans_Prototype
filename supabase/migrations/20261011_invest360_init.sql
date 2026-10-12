-- Invest360 Supabase PostgreSQL Schema Migration
-- Unified Multi-Broker Investment Intelligence Platform
-- Enables Row-Level Security (RLS) for tenant data isolation

-- 1. User Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  full_name TEXT,
  base_currency TEXT DEFAULT 'USD',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view and edit own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id);

-- 2. Investment Sources (Brokers, Depositories, Manual accounts)
CREATE TABLE IF NOT EXISTS public.investment_sources (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('Broker', 'Depository', 'Manual')),
  provider TEXT NOT NULL,
  account_number_masked TEXT,
  last_synced TIMESTAMPTZ,
  status TEXT DEFAULT 'connected' CHECK (status IN ('connected', 'syncing', 'error', 'disconnected')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.investment_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own investment sources"
  ON public.investment_sources FOR ALL
  USING (auth.uid() = user_id);

-- 3. Import Batches (Ingestion audit trail)
CREATE TABLE IF NOT EXISTS public.import_batches (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  source_id TEXT REFERENCES public.investment_sources(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0,
  accepted_rows INTEGER NOT NULL DEFAULT 0,
  rejected_rows INTEGER NOT NULL DEFAULT 0,
  duplicate_rows INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'failed')),
  warnings JSONB DEFAULT '[]'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.import_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own import batches"
  ON public.import_batches FOR ALL
  USING (auth.uid() = user_id);

-- 4. Holdings (Individual lot positions)
CREATE TABLE IF NOT EXISTS public.holdings (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  import_batch_id TEXT REFERENCES public.import_batches(id) ON DELETE SET NULL,
  source_id TEXT NOT NULL REFERENCES public.investment_sources(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  security_name TEXT NOT NULL,
  isin TEXT,
  quantity NUMERIC(18, 6) NOT NULL CHECK (quantity >= 0),
  average_cost NUMERIC(18, 6) NOT NULL CHECK (average_cost >= 0),
  current_price NUMERIC(18, 6) NOT NULL CHECK (current_price >= 0),
  asset_class TEXT NOT NULL CHECK (asset_class IN ('Equity', 'Bond', 'REIT', 'InvIT', 'Cash')),
  sector TEXT,
  exchange TEXT,
  annual_dividend_yield NUMERIC(8, 4),
  coupon_rate NUMERIC(8, 4),
  maturity_date DATE,
  data_quality JSONB DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.holdings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own holdings"
  ON public.holdings FOR ALL
  USING (auth.uid() = user_id);

-- 5. Audit Logs (Compliance & modification records)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);
