-- Phase 7: Parallel task assignment module
-- Uses text + CHECK (not enum) — avoids "ADD VALUE in transaction" errors in Supabase SQL editor.

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  department_id uuid REFERENCES public.departments(id),
  assigned_to uuid REFERENCES public.users(id),
  assigned_by uuid REFERENCES public.users(id),
  priority public.dak_priority NOT NULL DEFAULT 'routine',
  due_date date,
  status text NOT NULL DEFAULT 'assigned'
    CONSTRAINT tasks_status_check CHECK (
      status IN (
        'draft',
        'assigned',
        'accepted',
        'in_progress',
        'compliance_submitted',
        'approved',
        'closed'
      )
    ),
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  closed_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.task_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id),
  action text NOT NULL,
  remarks text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.task_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES public.users(id),
  compliance_text text NOT NULL,
  attachment_path text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tasks_department ON public.tasks(department_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON public.tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_compliance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tasks_select ON public.tasks;
DROP POLICY IF EXISTS tasks_all_district ON public.tasks;
DROP POLICY IF EXISTS task_timeline_select ON public.task_timeline;
DROP POLICY IF EXISTS task_compliance_select ON public.task_compliance;

-- Assignee or same department can read tasks
CREATE POLICY tasks_select ON public.tasks
  FOR SELECT TO authenticated
  USING (
    assigned_to = auth.uid()
    OR department_id IN (
      SELECT department_id FROM public.users WHERE id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
        AND r.slug IN ('collector', 'acp', 'adm')
    )
  );

CREATE POLICY tasks_all_district ON public.tasks
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
        AND r.slug IN ('collector', 'acp', 'adm')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
        AND r.slug IN ('collector', 'acp', 'adm')
    )
  );

CREATE POLICY task_timeline_select ON public.task_timeline
  FOR SELECT TO authenticated USING (true);

CREATE POLICY task_compliance_select ON public.task_compliance
  FOR SELECT TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
