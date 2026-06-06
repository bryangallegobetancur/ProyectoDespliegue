-- Run this in Supabase SQL Editor after creating your project

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, SPLIT_PART(NEW.email, '@', 1));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Quality rules
CREATE TYPE rule_type AS ENUM (
  'NOT_NULL',
  'UNIQUE',
  'RANGE',
  'VALUE_IN_SET',
  'REGEX_MATCH',
  'STRING_LENGTH',
  'CUSTOM_QUERY'
);

CREATE TYPE severity_level AS ENUM ('critical', 'high', 'medium', 'low');

CREATE TABLE IF NOT EXISTS public.quality_rules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  rule_type rule_type NOT NULL,
  severity severity_level NOT NULL DEFAULT 'medium',
  table_name TEXT NOT NULL,
  column_name TEXT,
  params JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.quality_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own rules"
  ON public.quality_rules FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Rule check runs
CREATE TYPE check_status AS ENUM ('running', 'passed', 'failed', 'error');

CREATE TABLE IF NOT EXISTS public.rule_checks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  rule_id UUID REFERENCES public.quality_rules(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status check_status NOT NULL DEFAULT 'running',
  rows_checked INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB DEFAULT '[]'::jsonb,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  finished_at TIMESTAMPTZ
);

ALTER TABLE public.rule_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rule checks"
  ON public.rule_checks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rule checks"
  ON public.rule_checks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. exec_sql RPC for CUSTOM_QUERY rule type (PoC only! Restrict in production)
-- This allows running arbitrary SELECT queries. Enable only if you need CUSTOM_QUERY rules.
CREATE OR REPLACE FUNCTION public.exec_sql(query TEXT)
RETURNS SETOF JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN QUERY EXECUTE query;
END;
$$;

REVOKE ALL ON FUNCTION public.exec_sql(TEXT) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.exec_sql(TEXT) TO authenticated;
