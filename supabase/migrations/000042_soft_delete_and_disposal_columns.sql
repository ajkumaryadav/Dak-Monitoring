-- Ensure all soft-delete, archive, and disposal columns exist on dak_entries
ALTER TABLE public.dak_entries
  ADD COLUMN IF NOT EXISTS is_deleted boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS deleted_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at timestamptz,
  ADD COLUMN IF NOT EXISTS archived_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS archive_period_years integer,
  ADD COLUMN IF NOT EXISTS disposal_date timestamptz,
  ADD COLUMN IF NOT EXISTS disposal_remarks text,
  ADD COLUMN IF NOT EXISTS disposal_authority text,
  ADD COLUMN IF NOT EXISTS final_decision text,
  ADD COLUMN IF NOT EXISTS applicant_mobile text,
  ADD COLUMN IF NOT EXISTS applicant_reference text,
  ADD COLUMN IF NOT EXISTS is_escalated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS intake_type text DEFAULT 'physical';

CREATE INDEX IF NOT EXISTS idx_dak_entries_is_deleted ON public.dak_entries (is_deleted);
CREATE INDEX IF NOT EXISTS idx_dak_entries_deleted_at ON public.dak_entries (deleted_at) WHERE deleted_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dak_entries_is_archived ON public.dak_entries (is_archived);
CREATE INDEX IF NOT EXISTS idx_dak_entries_archived_at ON public.dak_entries (archived_at) WHERE archived_at IS NOT NULL;
