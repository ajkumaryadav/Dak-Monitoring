-- Department & Section Master Management enhancements
-- Additive only — preserves existing IDs and FK relationships

ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS short_name text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

ALTER TABLE public.assignment_units
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_departments_sort_order
  ON public.departments (sort_order, name);

CREATE INDEX IF NOT EXISTS idx_departments_is_active
  ON public.departments (is_active);

CREATE INDEX IF NOT EXISTS idx_assignment_units_department_id
  ON public.assignment_units (department_id);

CREATE INDEX IF NOT EXISTS idx_assignment_units_sort_order
  ON public.assignment_units (sort_order, unit_name);

CREATE INDEX IF NOT EXISTS idx_assignment_units_is_active
  ON public.assignment_units (is_active);

-- Unique department names (case-insensitive) when no duplicate names exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.departments
    GROUP BY lower(name)
    HAVING count(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_departments_name_lower
      ON public.departments (lower(name));
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.master_data_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL
    CHECK (entity_type IN ('department', 'section')),
  entity_id uuid,
  action text NOT NULL
    CHECK (action IN ('create', 'update', 'activate', 'deactivate', 'delete', 'reorder')),
  actor_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  actor_role text,
  previous_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  new_value jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_master_data_audit_logs_entity
  ON public.master_data_audit_logs (entity_type, entity_id, created_at DESC);

ALTER TABLE public.master_data_audit_logs ENABLE ROW LEVEL SECURITY;
