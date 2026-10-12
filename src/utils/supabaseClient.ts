import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DataSource, Holding, ImportBatch } from '../types/investment';

// Read credentials from env (supports both client VITE_ prefix and standard runtime vars)
const supabaseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_URL) ||
  '';

const supabaseAnonKey =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) ||
  '';

export const isSupabaseConfigured: boolean = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl.trim() !== '' &&
  supabaseAnonKey.trim() !== '' &&
  !supabaseUrl.includes('YOUR_SUPABASE')
);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export interface StorageStatus {
  mode: 'supabase_cloud' | 'local_demo';
  badgeLabel: string;
  badgeColor: string;
  description: string;
  isCloudActive: boolean;
}

export function getStorageStatus(): StorageStatus {
  if (isSupabaseConfigured) {
    return {
      mode: 'supabase_cloud',
      badgeLabel: 'Supabase Cloud (PostgreSQL Active)',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      description: 'Connected to remote Supabase instance with Row-Level Security (RLS) enforcement.',
      isCloudActive: true,
    };
  }

  return {
    mode: 'local_demo',
    badgeLabel: 'Demo Mode (Local Persistence)',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    description:
      'Supabase credentials not configured in environment. Running in verified Demo Mode with secure browser session persistence.',
    isCloudActive: false,
  };
}

export const SUPABASE_MIGRATION_SQL = `-- Invest360 Supabase PostgreSQL Schema Migration
-- Unified Multi-Broker Investment Intelligence Platform
-- Enables Row-Level Security (RLS) for tenant data isolation

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
  ON public.profiles FOR ALL USING (auth.uid() = id);

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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.investment_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own investment sources"
  ON public.investment_sources FOR ALL USING (auth.uid() = user_id);

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
  ON public.import_batches FOR ALL USING (auth.uid() = user_id);

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
  ON public.holdings FOR ALL USING (auth.uid() = user_id);
`;
