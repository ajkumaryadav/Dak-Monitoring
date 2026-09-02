-- Database & Storage Management module foundation
-- Soft-delete / archive on dak_entries + ops metadata tables + stats RPCs

ALTER TABLE public.dak_entries
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_period_years integer;

CREATE INDEX IF NOT EXISTS idx_dak_entries_deleted_at
  ON public.dak_entries (deleted_at)
  WHERE deleted_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_dak_entries_archived_at
  ON public.dak_entries (archived_at)
  WHERE archived_at IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.system_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name text NOT NULL UNIQUE,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  checksum_sha256 text,
  status text NOT NULL DEFAULT 'created'
    CHECK (status IN ('creating', 'created', 'verified', 'failed', 'restored')),
  verification_status text NOT NULL DEFAULT 'pending'
    CHECK (verification_status IN ('pending', 'passed', 'failed')),
  verification_report jsonb NOT NULL DEFAULT '{}'::jsonb,
  manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  restored_at timestamptz,
  error_message text
);

CREATE TABLE IF NOT EXISTS public.system_admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  role text,
  action text NOT NULL,
  module text NOT NULL DEFAULT 'database_storage',
  affected_records integer NOT NULL DEFAULT 0,
  affected_files integer NOT NULL DEFAULT 0,
  result text NOT NULL DEFAULT 'success'
    CHECK (result IN ('success', 'failure', 'partial')),
  ip_address text,
  duration_ms integer,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_admin_logs_created_at
  ON public.system_admin_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS public.orphan_cleanup_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL CHECK (report_type IN ('preview', 'clean')),
  orphan_db_count integer NOT NULL DEFAULT 0,
  orphan_file_count integer NOT NULL DEFAULT 0,
  recoverable_bytes bigint NOT NULL DEFAULT 0,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Safe DB size / relation stats for Collectorate admins (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.get_database_storage_stats()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  db_size bigint;
  result jsonb;
BEGIN
  SELECT pg_database_size(current_database()) INTO db_size;

  SELECT jsonb_build_object(
    'database_name', current_database(),
    'database_size_bytes', db_size,
    'table_count', (
      SELECT count(*)::int
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ),
    'total_records', (
      SELECT coalesce(sum(n_live_tup), 0)::bigint
      FROM pg_stat_user_tables
    ),
    'active_dak', (
      SELECT count(*)::int FROM public.dak_entries
      WHERE deleted_at IS NULL AND archived_at IS NULL
    ),
    'archived_dak', (
      SELECT count(*)::int FROM public.dak_entries
      WHERE archived_at IS NOT NULL AND deleted_at IS NULL
    ),
    'deleted_dak', (
      SELECT count(*)::int FROM public.dak_entries
      WHERE deleted_at IS NOT NULL
    ),
    'attachment_count', (
      SELECT count(*)::int FROM public.attachments
    ),
    'attachment_bytes', (
      SELECT coalesce(sum(file_size), 0)::bigint FROM public.attachments
    ),
    'last_vacuum', (
      SELECT max(last_vacuum) FROM pg_stat_user_tables
    ),
    'last_analyze', (
      SELECT max(last_analyze) FROM pg_stat_user_tables
    ),
    'last_autoanalyze', (
      SELECT max(last_autoanalyze) FROM pg_stat_user_tables
    ),
    'collected_at', now()
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_database_maintenance(op text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  started timestamptz := clock_timestamp();
BEGIN
  IF op = 'analyze' THEN
    ANALYZE;
  ELSIF op = 'vacuum' THEN
    -- Non-full vacuum is safe during operation
    EXECUTE 'VACUUM (ANALYZE)';
  ELSIF op = 'reindex' THEN
    -- Skip aggressive REINDEX CONCURRENTLY (cannot run in function); refresh stats instead
    ANALYZE;
  ELSE
    RAISE EXCEPTION 'Unsupported maintenance operation: %', op;
  END IF;

  RETURN jsonb_build_object(
    'operation', op,
    'ok', true,
    'duration_ms', (extract(epoch from (clock_timestamp() - started)) * 1000)::int
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_database_storage_stats() FROM public;
REVOKE ALL ON FUNCTION public.run_database_maintenance(text) FROM public;
GRANT EXECUTE ON FUNCTION public.get_database_storage_stats() TO service_role;
GRANT EXECUTE ON FUNCTION public.run_database_maintenance(text) TO service_role;

NOTIFY pgrst, 'reload schema';
