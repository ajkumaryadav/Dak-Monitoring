-- Stage 14: DAK remarks, internal notes, and Action Taken Report (ATR)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dak_remark_type') THEN
    CREATE TYPE public.dak_remark_type AS ENUM (
      'remark',
      'internal_note',
      'collector_note',
      'department_remark'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.dak_remarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries (id) ON DELETE CASCADE,
  remark_type public.dak_remark_type NOT NULL,
  body text NOT NULL,
  created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dak_remarks_dak_id ON public.dak_remarks (dak_id);
CREATE INDEX IF NOT EXISTS idx_dak_remarks_created_at ON public.dak_remarks (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dak_remarks_type ON public.dak_remarks (remark_type);

CREATE TABLE IF NOT EXISTS public.dak_atr (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries (id) ON DELETE CASCADE,
  action_taken text NOT NULL,
  submitted_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  attachment_file_name text,
  attachment_file_path text,
  attachment_storage_bucket text DEFAULT 'dak-attachments',
  attachment_mime_type text,
  attachment_file_size bigint
);

CREATE INDEX IF NOT EXISTS idx_dak_atr_dak_id ON public.dak_atr (dak_id);
CREATE INDEX IF NOT EXISTS idx_dak_atr_submitted_at ON public.dak_atr (submitted_at DESC);

NOTIFY pgrst, 'reload schema';
