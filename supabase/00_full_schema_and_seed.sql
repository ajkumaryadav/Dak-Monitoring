-- =============================================================================
-- DISTRICT DAK & ADMINISTRATIVE MONITORING SYSTEM (DDMS)
-- Complete Consolidated Database Schema & Seed Data
-- =============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. DEPARTMENTS MASTER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  code text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_departments_name ON public.departments (name);
CREATE INDEX IF NOT EXISTS idx_departments_is_active ON public.departments (is_active);

-- -----------------------------------------------------------------------------
-- 2. ASSIGNMENT UNITS MASTER (Internal Collectorate Sections)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignment_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_name text NOT NULL,
  unit_type text NOT NULL CHECK (unit_type IN ('department', 'section')),
  code text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT uq_assignment_units_name_type UNIQUE (unit_name, unit_type)
);

CREATE INDEX IF NOT EXISTS idx_assignment_units_type ON public.assignment_units (unit_type);
CREATE INDEX IF NOT EXISTS idx_assignment_units_is_active ON public.assignment_units (is_active);

-- -----------------------------------------------------------------------------
-- 3. DAK SOURCES MASTER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dak_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL UNIQUE,
  source_category text NOT NULL DEFAULT 'Government',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dak_sources_name ON public.dak_sources (source_name);

-- -----------------------------------------------------------------------------
-- 4. ROLES MASTER
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_roles_slug ON public.roles (slug);

-- -----------------------------------------------------------------------------
-- 5. USERS & PROFILES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL UNIQUE,
  name text NOT NULL,
  designation text,
  mobile text,
  employee_code text,
  role_id uuid REFERENCES public.roles (id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments (id) ON DELETE SET NULL,
  section_id uuid REFERENCES public.assignment_units (id) ON DELETE SET NULL,
  is_active boolean NOT NULL DEFAULT true,
  last_login timestamptz,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users (role_id);
CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users (department_id);
CREATE INDEX IF NOT EXISTS idx_users_section_id ON public.users (section_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users (is_active);

-- -----------------------------------------------------------------------------
-- 6. DAK ENTRIES (Main Registry Table)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dak_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_number text NOT NULL UNIQUE,
  diary_number text,
  diary_date date,
  letter_number text,
  letter_date date,
  sender text NOT NULL,
  sender_designation text,
  sender_address text,
  sender_district text,
  applicant_mobile text,
  applicant_reference text,
  subject text NOT NULL,
  description text,
  category text,
  priority text NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'important', 'urgent', 'immediate')),
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'assigned', 'under_process', 'in_progress', 'pending', 'atr_submitted', 'pending_approval', 'completed', 'disposed', 'escalated', 'closed')),
  source_id uuid REFERENCES public.dak_sources (id) ON DELETE SET NULL,
  assignment_type text CHECK (assignment_type IN ('department', 'section')),
  department_id uuid REFERENCES public.departments (id) ON DELETE SET NULL,
  assignment_unit_id uuid REFERENCES public.assignment_units (id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.users (id) ON DELETE SET NULL,
  assigned_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  assigned_at timestamptz,
  received_date date NOT NULL DEFAULT CURRENT_DATE,
  received_at timestamptz DEFAULT now(),
  due_date date,
  sla_due_date date,
  escalation_level integer NOT NULL DEFAULT 0,
  is_escalated boolean NOT NULL DEFAULT false,
  intake_type text DEFAULT 'physical',
  disposal_date timestamptz,
  disposal_remarks text,
  disposal_authority text,
  final_decision text,
  is_archived boolean NOT NULL DEFAULT false,
  archived_at timestamptz,
  archived_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  archive_period_years integer,
  is_deleted boolean NOT NULL DEFAULT false,
  deleted_at timestamptz,
  deleted_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dak_entries_dak_number ON public.dak_entries (dak_number);
CREATE INDEX IF NOT EXISTS idx_dak_entries_status ON public.dak_entries (status);
CREATE INDEX IF NOT EXISTS idx_dak_entries_priority ON public.dak_entries (priority);
CREATE INDEX IF NOT EXISTS idx_dak_entries_department_id ON public.dak_entries (department_id);
CREATE INDEX IF NOT EXISTS idx_dak_entries_assignment_unit_id ON public.dak_entries (assignment_unit_id);
CREATE INDEX IF NOT EXISTS idx_dak_entries_source_id ON public.dak_entries (source_id);
CREATE INDEX IF NOT EXISTS idx_dak_entries_assigned_to ON public.dak_entries (assigned_to);
CREATE INDEX IF NOT EXISTS idx_dak_entries_assigned_by ON public.dak_entries (assigned_by);
CREATE INDEX IF NOT EXISTS idx_dak_entries_created_by ON public.dak_entries (created_by);
CREATE INDEX IF NOT EXISTS idx_dak_entries_received_date ON public.dak_entries (received_date DESC);
CREATE INDEX IF NOT EXISTS idx_dak_entries_due_date ON public.dak_entries (due_date);
CREATE INDEX IF NOT EXISTS idx_dak_entries_sla_due_date ON public.dak_entries (sla_due_date);
CREATE INDEX IF NOT EXISTS idx_dak_entries_escalation_level ON public.dak_entries (escalation_level);
CREATE INDEX IF NOT EXISTS idx_dak_entries_applicant_mobile ON public.dak_entries (applicant_mobile);
CREATE INDEX IF NOT EXISTS idx_dak_entries_deleted_at ON public.dak_entries (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dak_entries_archived_at ON public.dak_entries (archived_at) WHERE archived_at IS NOT NULL;

-- -----------------------------------------------------------------------------
-- 7. ATTACHMENTS (Scanned Documents & Compliance Files)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries (id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  mime_type text,
  file_type text,
  storage_path text,
  bucket_name text DEFAULT 'dak-attachments',
  uploaded_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_attachments_dak_id ON public.attachments (dak_id);
CREATE INDEX IF NOT EXISTS idx_attachments_uploaded_by ON public.attachments (uploaded_by);

-- -----------------------------------------------------------------------------
-- 8. DAK REMARKS & INTERNAL NOTES
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dak_remarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  remark text NOT NULL,
  remark_type text NOT NULL DEFAULT 'officer' CHECK (remark_type IN ('officer', 'department', 'system')),
  is_internal boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dak_remarks_dak_id ON public.dak_remarks (dak_id);
CREATE INDEX IF NOT EXISTS idx_dak_remarks_user_id ON public.dak_remarks (user_id);
CREATE INDEX IF NOT EXISTS idx_dak_remarks_created_at ON public.dak_remarks (created_at DESC);

-- -----------------------------------------------------------------------------
-- 9. DAK ATR (Action Taken Reports)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dak_atr (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries (id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  action_taken text NOT NULL,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'returned', 'rejected', 'closed', 'draft')),
  notes text,
  attachment_path text,
  attachment_name text,
  is_draft boolean NOT NULL DEFAULT false,
  draft_saved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dak_atr_dak_id ON public.dak_atr (dak_id);
CREATE INDEX IF NOT EXISTS idx_dak_atr_submitted_by ON public.dak_atr (submitted_by);
CREATE INDEX IF NOT EXISTS idx_dak_atr_status ON public.dak_atr (status);

-- -----------------------------------------------------------------------------
-- 10. DAK TIMELINE
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dak_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  action_title text NOT NULL,
  description text,
  actor_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  actor_name text,
  actor_role text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dak_timeline_dak_id ON public.dak_timeline (dak_id);
CREATE INDEX IF NOT EXISTS idx_dak_timeline_created_at ON public.dak_timeline (created_at DESC);

-- -----------------------------------------------------------------------------
-- 11. AUDIT & ACTIVITY LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  action text NOT NULL,
  module text NOT NULL DEFAULT 'dak',
  entity_type text,
  entity_id uuid,
  description text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON public.activity_logs (module);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs (created_at DESC);

-- -----------------------------------------------------------------------------
-- 12. NOTIFICATIONS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  message text,
  type text NOT NULL DEFAULT 'info',
  link text,
  dak_id uuid REFERENCES public.dak_entries (id) ON DELETE SET NULL,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);

-- -----------------------------------------------------------------------------
-- 13. DAK TRANSFERS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dak_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries (id) ON DELETE CASCADE,
  from_department_id uuid REFERENCES public.departments (id) ON DELETE SET NULL,
  to_department_id uuid NOT NULL REFERENCES public.departments (id) ON DELETE CASCADE,
  transferred_by uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dak_transfers_dak_id ON public.dak_transfers (dak_id);

-- -----------------------------------------------------------------------------
-- 14. DAK REQUESTS (Clarifications, Extension, Return Requests)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dak_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries (id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (request_type IN ('clarification', 'extension', 'transfer', 'return')),
  requester_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  reason text NOT NULL,
  requested_due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'resolved')),
  reviewed_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  review_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dak_requests_dak_id ON public.dak_requests (dak_id);
CREATE INDEX IF NOT EXISTS idx_dak_requests_status ON public.dak_requests (status);

-- -----------------------------------------------------------------------------
-- 15. DAK HISTORY (Audit Log of Changes)
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dak_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries (id) ON DELETE CASCADE,
  action text NOT NULL,
  changed_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dak_history_dak_id ON public.dak_history (dak_id);

-- -----------------------------------------------------------------------------
-- 16. TASKS & MULTI-ASSIGNMENT WORKFLOW
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries (id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  assigned_to uuid REFERENCES public.users (id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments (id) ON DELETE SET NULL,
  section_id uuid REFERENCES public.assignment_units (id) ON DELETE SET NULL,
  priority text NOT NULL DEFAULT 'routine' CHECK (priority IN ('routine', 'important', 'urgent', 'immediate')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  due_date date,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_dak_id ON public.tasks (dak_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks (assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_department_id ON public.tasks (department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks (status);

CREATE TABLE IF NOT EXISTS public.task_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  department_id uuid REFERENCES public.departments (id) ON DELETE SET NULL,
  section_id uuid REFERENCES public.assignment_units (id) ON DELETE SET NULL,
  is_primary boolean NOT NULL DEFAULT false,
  assigned_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_assignees_task_id ON public.task_assignees (task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user_id ON public.task_assignees (user_id);

CREATE TABLE IF NOT EXISTS public.task_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  event_type text NOT NULL,
  notes text,
  actor_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_timeline_task_id ON public.task_timeline (task_id);

CREATE TABLE IF NOT EXISTS public.task_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks (id) ON DELETE CASCADE,
  remarks text NOT NULL,
  submitted_by uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  attachment_path text,
  status text NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'approved', 'returned', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_task_compliance_task_id ON public.task_compliance (task_id);

-- -----------------------------------------------------------------------------
-- 17. SLA RULES & ESCALATION
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.sla_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  priority text NOT NULL UNIQUE CHECK (priority IN ('routine', 'important', 'urgent', 'immediate')),
  max_days integer NOT NULL,
  warning_days integer NOT NULL,
  escalation_role text NOT NULL DEFAULT 'collector',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 18. SYSTEM BACKUPS & RECOVERY LOGS
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_backups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  backup_name text NOT NULL UNIQUE,
  file_path text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  checksum_sha256 text,
  status text NOT NULL DEFAULT 'created' CHECK (status IN ('creating', 'created', 'verified', 'failed', 'restored')),
  verification_status text NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'passed', 'failed')),
  verification_report jsonb NOT NULL DEFAULT '{}'::jsonb,
  manifest jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  verified_at timestamptz,
  restored_at timestamptz,
  error_message text
);

CREATE INDEX IF NOT EXISTS idx_system_backups_created_at ON public.system_backups (created_at DESC);

CREATE TABLE IF NOT EXISTS public.system_admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  role text,
  action text NOT NULL,
  module text NOT NULL DEFAULT 'database_storage',
  affected_records integer NOT NULL DEFAULT 0,
  affected_files integer NOT NULL DEFAULT 0,
  result text NOT NULL DEFAULT 'success' CHECK (result IN ('success', 'failure', 'partial')),
  ip_address text,
  duration_ms integer,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_system_admin_logs_created_at ON public.system_admin_logs (created_at DESC);

CREATE TABLE IF NOT EXISTS public.orphan_cleanup_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL CHECK (report_type IN ('preview', 'clean')),
  orphan_db_count integer NOT NULL DEFAULT 0,
  orphan_file_count integer NOT NULL DEFAULT 0,
  recoverable_bytes bigint NOT NULL DEFAULT 0,
  report jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.master_data_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL CHECK (entity_type IN ('department', 'assignment_unit')),
  entity_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'status_toggled')),
  old_data jsonb,
  new_data jsonb,
  performed_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_master_data_audit_logs_created_at ON public.master_data_audit_logs (created_at DESC);

-- -----------------------------------------------------------------------------
-- 19. RPC FUNCTIONS FOR ADMIN STATS & MAINTENANCE
-- -----------------------------------------------------------------------------
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
    EXECUTE 'VACUUM (ANALYZE)';
  ELSIF op = 'reindex' THEN
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

-- -----------------------------------------------------------------------------
-- 20. SEED DATA (Idempotent INSERTs with ON CONFLICT)
-- -----------------------------------------------------------------------------

-- Roles
INSERT INTO public.roles (slug, name, description) VALUES
  ('collector', 'Collector', 'District Collector & District Magistrate (Chief Administrator)'),
  ('acp', 'ACP', 'Analyst cum Programmer / Super User (System Administrator)'),
  ('adm', 'ADM', 'Additional District Magistrate (Supervisory Officer)'),
  ('dak_operator', 'DAK Operator', 'Receipt & Dispatch / Registry Clerk'),
  ('department_user', 'Department User', 'District Level Officer / Departmental Incharge'),
  ('section_user', 'Section User', 'Internal Collectorate Section Officer')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description;

-- Legacy Aliases
INSERT INTO public.roles (slug, name) VALUES
  ('district_officer', 'District Officer (Legacy)'),
  ('block_officer', 'Block Officer (Legacy)'),
  ('clerk', 'Clerk (Legacy)'),
  ('data_entry_operator', 'Data Entry Operator (Legacy)')
ON CONFLICT (slug) DO NOTHING;

-- Departments
INSERT INTO public.departments (name, is_active) VALUES
  ('Agriculture', true),
  ('BIDA', true),
  ('Collectorate', true),
  ('Devsthan', true),
  ('DOIT&C', true),
  ('Education', true),
  ('Food & Supply', true),
  ('General Administration', true),
  ('Health', true),
  ('Home', true),
  ('Irrigation', true),
  ('JVVNL', true),
  ('LSG', true),
  ('Medical & Health', true),
  ('Minority', true),
  ('Panchayat Raj', true),
  ('PHED', true),
  ('Police', true),
  ('Pollution Control', true),
  ('PWD', true),
  ('Revenue', true),
  ('Rural Development', true),
  ('SJE', true),
  ('Social Welfare', true),
  ('Statistics', true),
  ('Transport', true),
  ('Treasury', true),
  ('Watershed', true)
ON CONFLICT (name) DO NOTHING;

-- Internal Sections (Assignment Units)
INSERT INTO public.assignment_units (unit_name, unit_type, is_active) VALUES
  ('ACEM', 'section', true),
  ('Accounts', 'section', true),
  ('ADM', 'section', true),
  ('Court', 'section', true),
  ('Development', 'section', true),
  ('General', 'section', true),
  ('Legal', 'section', true),
  ('LR', 'section', true),
  ('PA Cell', 'section', true),
  ('Panchayati Raj', 'section', true),
  ('Receipt & Dispatch', 'section', true),
  ('RTI', 'section', true),
  ('Store', 'section', true)
ON CONFLICT (unit_name, unit_type) DO NOTHING;

-- DAK Sources
INSERT INTO public.dak_sources (source_name, source_category, is_active) VALUES
  ('Chief Minister Office', 'Executive', true),
  ('Chief Secretary', 'State Administration', true),
  ('Secretariat', 'State Administration', true),
  ('Minister', 'Executive', true),
  ('MP', 'Public Representative', true),
  ('MLA', 'Public Representative', true),
  ('Jan Sunwai', 'Grievance', true),
  ('Ratri Chaupal', 'Grievance', true),
  ('CM Helpline', 'Grievance', true),
  ('Public Grievance', 'Grievance', true),
  ('Court', 'Judicial', true),
  ('Department', 'Inter-departmental', true),
  ('Public', 'Citizen', true),
  ('Email', 'Digital', true),
  ('Other', 'General', true)
ON CONFLICT (source_name) DO NOTHING;

-- SLA Rules
INSERT INTO public.sla_rules (priority, max_days, warning_days, escalation_role, is_active) VALUES
  ('immediate', 1, 1, 'collector', true),
  ('urgent', 3, 2, 'adm', true),
  ('important', 7, 5, 'adm', true),
  ('routine', 15, 10, 'adm', true)
ON CONFLICT (priority) DO UPDATE SET max_days = EXCLUDED.max_days, warning_days = EXCLUDED.warning_days;

-- -----------------------------------------------------------------------------
-- Schema reload notification for PostgREST
-- -----------------------------------------------------------------------------
DO $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;
