-- =============================================================================
-- DISTRICT DAK MONITORING SYSTEM — ONE-GO REPAIR & SCHEMA SYNC
-- Safe for already restored databases and fresh databases alike.
-- =============================================================================

-- 1. Ensure Core Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. DAK Remarks Column Synchronization
ALTER TABLE IF EXISTS public.dak_remarks ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.dak_remarks ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.dak_remarks ADD COLUMN IF NOT EXISTS remark text;
ALTER TABLE IF EXISTS public.dak_remarks ADD COLUMN IF NOT EXISTS body text;
ALTER TABLE IF EXISTS public.dak_remarks ADD COLUMN IF NOT EXISTS is_internal boolean DEFAULT false;

-- 3. DAK ATR Column Synchronization
ALTER TABLE IF EXISTS public.dak_atr ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'submitted';
ALTER TABLE IF EXISTS public.dak_atr ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.dak_atr ADD COLUMN IF NOT EXISTS submitted_by uuid REFERENCES public.users (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.dak_atr ADD COLUMN IF NOT EXISTS action_taken text DEFAULT '';
ALTER TABLE IF EXISTS public.dak_atr ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE IF EXISTS public.dak_atr ADD COLUMN IF NOT EXISTS attachment_path text;
ALTER TABLE IF EXISTS public.dak_atr ADD COLUMN IF NOT EXISTS attachment_name text;
ALTER TABLE IF EXISTS public.dak_atr ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false;
ALTER TABLE IF EXISTS public.dak_atr ADD COLUMN IF NOT EXISTS draft_saved_at timestamptz;
ALTER TABLE IF EXISTS public.dak_atr ADD COLUMN IF NOT EXISTS submitted_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS public.dak_atr ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE IF EXISTS public.dak_atr ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 4. DAK Entries Column Synchronization
ALTER TABLE IF EXISTS public.dak_entries ADD COLUMN IF NOT EXISTS applicant_mobile text;
ALTER TABLE IF EXISTS public.dak_entries ADD COLUMN IF NOT EXISTS applicant_reference text;
ALTER TABLE IF EXISTS public.dak_entries ADD COLUMN IF NOT EXISTS assignment_unit_id uuid REFERENCES public.assignment_units (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.dak_entries ADD COLUMN IF NOT EXISTS assignment_type text;
ALTER TABLE IF EXISTS public.dak_entries ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.dak_sources (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.dak_entries ADD COLUMN IF NOT EXISTS sla_due_date timestamptz;
ALTER TABLE IF EXISTS public.dak_entries ADD COLUMN IF NOT EXISTS escalation_level integer NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS public.dak_entries ADD COLUMN IF NOT EXISTS disposed_date timestamptz;
ALTER TABLE IF EXISTS public.dak_entries ADD COLUMN IF NOT EXISTS closed_date timestamptz;
ALTER TABLE IF EXISTS public.dak_entries ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE IF EXISTS public.dak_entries ADD COLUMN IF NOT EXISTS archived_at timestamptz;

-- 5. Users Column Synchronization
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS mobile_number text;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.assignment_units (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

-- 6. Attachments Column Synchronization
ALTER TABLE IF EXISTS public.attachments ADD COLUMN IF NOT EXISTS storage_path text;
ALTER TABLE IF EXISTS public.attachments ADD COLUMN IF NOT EXISTS bucket_name text DEFAULT 'dak-attachments';
ALTER TABLE IF EXISTS public.attachments ADD COLUMN IF NOT EXISTS uploaded_by uuid REFERENCES public.users (id) ON DELETE SET NULL;

-- 7. Timeline Column Synchronization
ALTER TABLE IF EXISTS public.dak_timeline ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES public.users (id) ON DELETE SET NULL;
ALTER TABLE IF EXISTS public.dak_timeline ADD COLUMN IF NOT EXISTS actor_name text;
ALTER TABLE IF EXISTS public.dak_timeline ADD COLUMN IF NOT EXISTS actor_role text;
ALTER TABLE IF EXISTS public.dak_timeline ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 8. Compliance Drafts Compatibility View
CREATE OR REPLACE VIEW public.compliance_drafts AS 
  SELECT * FROM public.dak_atr WHERE is_draft = true;

-- 9. Ensure Task & Multi-Assignment Tables Exist
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES public.users (id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments (id) ON DELETE SET NULL,
  section_id uuid REFERENCES public.assignment_units (id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'routine',
  status text NOT NULL DEFAULT 'pending',
  due_date date,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments (id) ON DELETE SET NULL,
  section_id uuid REFERENCES public.assignment_units (id) ON DELETE SET NULL,
  is_primary boolean NOT NULL DEFAULT false,
  assigned_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  notes text,
  actor_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  remarks text NOT NULL,
  submitted_by uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  attachment_path text,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 10. Ensure System Admin & SLA Tables Exist
CREATE TABLE IF NOT EXISTS public.system_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name text NOT NULL UNIQUE,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  checksum_sha256 text,
  status text NOT NULL DEFAULT 'created',
  verification_status text NOT NULL DEFAULT 'pending',
  verification_report jsonb NOT NULL DEFAULT '{}'::jsonb,
  manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  restored_at timestamptz,
  error_message text
);

CREATE TABLE IF NOT EXISTS public.system_admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  role text,
  action text NOT NULL,
  module text NOT NULL DEFAULT 'database_storage',
  affected_records integer NOT NULL DEFAULT 0,
  affected_files integer NOT NULL DEFAULT 0,
  result text NOT NULL DEFAULT 'success',
  ip_address text,
  duration_ms integer,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.orphan_cleanup_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL,
  orphan_db_count integer NOT NULL DEFAULT 0,
  orphan_file_count integer NOT NULL DEFAULT 0,
  recoverable_bytes bigint NOT NULL DEFAULT 0,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.master_data_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  performed_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.sla_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  priority text NOT NULL UNIQUE,
  max_days integer NOT NULL,
  warning_days integer NOT NULL,
  escalation_role text NOT NULL DEFAULT 'collector',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Seed Default SLA Rules if empty
INSERT INTO public.sla_rules (priority, max_days, warning_days, escalation_role, is_active)
VALUES
  ('immediate', 1, 0, 'collector', true),
  ('urgent', 3, 1, 'collector', true),
  ('important', 7, 2, 'collector', true),
  ('routine', 15, 3, 'collector', true)
ON CONFLICT (priority) DO NOTHING;

-- 11. RPC Functions
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
      WHERE table_schema = 'public' AND table_type IN ('BASE TABLE', 'VIEW')
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
    )
  ) INTO result;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.run_database_maintenance()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  VACUUM (ANALYZE);
  RETURN jsonb_build_object(
    'status', 'completed',
    'executed_at', now()
  );
END;
$$;
