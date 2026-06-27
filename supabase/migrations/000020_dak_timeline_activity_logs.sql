-- Stage 15: DAK Timeline & Activity Log

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dak_timeline_action') THEN
    CREATE TYPE public.dak_timeline_action AS ENUM (
      'dak_created',
      'dak_assigned',
      'dak_reassigned',
      'status_changed',
      'remark_added',
      'file_uploaded',
      'atr_submitted',
      'closed'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.dak_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries (id) ON DELETE CASCADE,
  action_type public.dak_timeline_action NOT NULL,
  action_title text NOT NULL,
  description text,
  performed_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dak_timeline_dak_id ON public.dak_timeline (dak_id);
CREATE INDEX IF NOT EXISTS idx_dak_timeline_created_at ON public.dak_timeline (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_dak_timeline_action_type ON public.dak_timeline (action_type);

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users (id) ON DELETE SET NULL,
  action text NOT NULL,
  module text NOT NULL,
  description text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON public.activity_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON public.activity_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_module ON public.activity_logs (module);

-- Backfill timeline from dak_history when present
INSERT INTO public.dak_timeline (
  dak_id,
  action_type,
  action_title,
  description,
  performed_by,
  metadata,
  created_at
)
SELECT
  dh.dak_id,
  CASE dh.event_type::text
    WHEN 'dak_registered' THEN 'dak_created'::public.dak_timeline_action
    WHEN 'assigned' THEN 'dak_assigned'::public.dak_timeline_action
    WHEN 'reassigned' THEN 'dak_reassigned'::public.dak_timeline_action
    WHEN 'section_transfer' THEN 'dak_reassigned'::public.dak_timeline_action
    WHEN 'remarks_added' THEN
      CASE
        WHEN dh.action_label ILIKE '%attachment%' OR dh.action_label ILIKE '%upload%' THEN
          'file_uploaded'::public.dak_timeline_action
        ELSE 'remark_added'::public.dak_timeline_action
      END
    WHEN 'atr_submitted' THEN 'atr_submitted'::public.dak_timeline_action
    WHEN 'closed' THEN 'closed'::public.dak_timeline_action
    ELSE 'status_changed'::public.dak_timeline_action
  END,
  dh.action_label,
  dh.remarks,
  dh.performed_by,
  jsonb_build_object(
    'from_status', dh.from_status,
    'to_status', dh.to_status
  ) || COALESCE(dh.metadata, '{}'::jsonb),
  dh.created_at
FROM public.dak_history dh
WHERE NOT EXISTS (
  SELECT 1 FROM public.dak_timeline dt
  WHERE dt.dak_id = dh.dak_id
    AND dt.action_title = dh.action_label
    AND dt.created_at = dh.created_at
);

NOTIFY pgrst, 'reload schema';
