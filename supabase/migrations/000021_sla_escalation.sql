-- Stage 16: SLA & Escalation System

CREATE TABLE IF NOT EXISTS public.sla_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id uuid REFERENCES public.departments (id) ON DELETE CASCADE,
  priority text NOT NULL,
  days_allowed integer NOT NULL CHECK (days_allowed > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_sla_rules_global_priority
  ON public.sla_rules (priority)
  WHERE department_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sla_rules_dept_priority
  ON public.sla_rules (department_id, priority)
  WHERE department_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_sla_rules_department_id ON public.sla_rules (department_id);
CREATE INDEX IF NOT EXISTS idx_sla_rules_priority ON public.sla_rules (priority);

ALTER TABLE public.dak_entries
  ADD COLUMN IF NOT EXISTS sla_due_date date,
  ADD COLUMN IF NOT EXISTS escalation_level smallint NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_dak_entries_sla_due_date ON public.dak_entries (sla_due_date);
CREATE INDEX IF NOT EXISTS idx_dak_entries_escalation_level ON public.dak_entries (escalation_level);

-- Default district SLA rules (Immediate=1, Urgent=3, Important/Normal=7, Routine/Low=15)
INSERT INTO public.sla_rules (department_id, priority, days_allowed)
SELECT NULL, v.priority, v.days_allowed
FROM (
  VALUES
    ('immediate', 1),
    ('urgent', 3),
    ('important', 7),
    ('routine', 15)
) AS v (priority, days_allowed)
WHERE NOT EXISTS (
  SELECT 1 FROM public.sla_rules sr
  WHERE sr.department_id IS NULL AND sr.priority = v.priority
);

-- Backfill SLA due dates from received_date + priority defaults
UPDATE public.dak_entries de
SET sla_due_date = (de.received_date::date + sr.days_allowed)
FROM public.sla_rules sr
WHERE de.sla_due_date IS NULL
  AND de.received_date IS NOT NULL
  AND sr.department_id IS NULL
  AND sr.priority = de.priority::text
  AND sr.is_active = true;

UPDATE public.dak_entries
SET escalation_level = 0
WHERE escalation_level IS NULL;

-- Extend dak_timeline action enum for SLA events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'dak_timeline_action' AND e.enumlabel = 'sla_assigned'
  ) THEN
    ALTER TYPE public.dak_timeline_action ADD VALUE 'sla_assigned';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'dak_timeline_action' AND e.enumlabel = 'sla_expired'
  ) THEN
    ALTER TYPE public.dak_timeline_action ADD VALUE 'sla_expired';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON e.enumtypid = t.oid
    WHERE t.typname = 'dak_timeline_action' AND e.enumlabel = 'escalated'
  ) THEN
    ALTER TYPE public.dak_timeline_action ADD VALUE 'escalated';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
