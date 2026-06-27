-- DAK timeline and audit history (Stage 12)

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dak_history_event') THEN
    CREATE TYPE public.dak_history_event AS ENUM (
      'dak_registered',
      'assigned',
      'reassigned',
      'status_changed',
      'section_transfer',
      'remarks_added',
      'completed',
      'closed'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.dak_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries (id) ON DELETE CASCADE,
  event_type public.dak_history_event NOT NULL,
  action_label text NOT NULL,
  remarks text,
  from_status text,
  to_status text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  performed_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dak_history_dak_id
  ON public.dak_history (dak_id);

CREATE INDEX IF NOT EXISTS idx_dak_history_created_at
  ON public.dak_history (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_dak_history_event_type
  ON public.dak_history (event_type);

CREATE INDEX IF NOT EXISTS idx_dak_history_performed_by
  ON public.dak_history (performed_by);

-- Backfill from legacy workflow_logs when present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'workflow_logs'
  ) THEN
    INSERT INTO public.dak_history (
      dak_id,
      event_type,
      action_label,
      remarks,
      from_status,
      to_status,
      performed_by,
      created_at
    )
    SELECT
      wl.dak_id,
      CASE
        WHEN wl.action ILIKE '%created%' OR wl.action ILIKE '%registered%' THEN
          'dak_registered'::public.dak_history_event
        WHEN wl.action ILIKE '%reassign%' THEN
          'reassigned'::public.dak_history_event
        WHEN wl.action ILIKE '%section%' OR wl.action ILIKE '%internal%' THEN
          'section_transfer'::public.dak_history_event
        WHEN wl.action ILIKE '%assign%' THEN
          'assigned'::public.dak_history_event
        WHEN wl.to_status IN ('closed') OR wl.action ILIKE '%closed%' THEN
          'closed'::public.dak_history_event
        WHEN wl.to_status IN ('completed', 'disposed')
          OR wl.action ILIKE '%completed%' THEN
          'completed'::public.dak_history_event
        WHEN wl.remarks IS NOT NULL AND wl.from_status IS NULL AND wl.to_status IS NULL THEN
          'remarks_added'::public.dak_history_event
        ELSE
          'status_changed'::public.dak_history_event
      END,
      wl.action,
      wl.remarks,
      wl.from_status,
      wl.to_status,
      wl.created_by,
      wl.created_at
    FROM public.workflow_logs wl
    WHERE NOT EXISTS (
      SELECT 1
      FROM public.dak_history dh
      WHERE dh.dak_id = wl.dak_id
        AND dh.action_label = wl.action
        AND dh.created_at = wl.created_at
    );
  END IF;
END $$;

-- Refresh PostgREST schema cache so the API sees dak_history immediately
NOTIFY pgrst, 'reload schema';
