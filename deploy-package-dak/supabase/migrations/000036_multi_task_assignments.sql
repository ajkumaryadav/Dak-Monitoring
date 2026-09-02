-- Multi-department / multi-officer task assignments
-- Master task + independent assignee instances with parallel, sequential, and hybrid modes.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'general'
    CONSTRAINT tasks_category_check CHECK (
      category IN (
        'meeting',
        'inspection',
        'election',
        'disaster',
        'campaign',
        'law_order',
        'general'
      )
    ),
  ADD COLUMN IF NOT EXISTS assignment_mode text NOT NULL DEFAULT 'parallel'
    CONSTRAINT tasks_assignment_mode_check CHECK (
      assignment_mode IN ('parallel', 'sequential', 'hybrid')
    ),
  ADD COLUMN IF NOT EXISTS lead_department_id uuid REFERENCES public.departments(id),
  ADD COLUMN IF NOT EXISTS consolidated_report_text text,
  ADD COLUMN IF NOT EXISTS consolidated_report_path text,
  ADD COLUMN IF NOT EXISTS consolidated_report_by uuid REFERENCES public.users(id),
  ADD COLUMN IF NOT EXISTS consolidated_report_at timestamptz;

-- Master task status: assigned (active) | awaiting_consolidation | closed
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_status_check CHECK (
    status IN (
      'draft',
      'assigned',
      'awaiting_consolidation',
      'closed',
      'accepted',
      'in_progress',
      'compliance_submitted',
      'approved'
    )
  );

CREATE TABLE IF NOT EXISTS public.task_assignees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  department_id uuid REFERENCES public.departments(id),
  assigned_to uuid NOT NULL REFERENCES public.users(id),
  is_lead boolean NOT NULL DEFAULT false,
  sequence_order int NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'assigned'
    CONSTRAINT task_assignees_status_check CHECK (
      status IN (
        'pending',
        'assigned',
        'accepted',
        'in_progress',
        'completed'
      )
    ),
  action_summary text,
  completed_at timestamptz,
  activated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (task_id, assigned_to)
);

CREATE INDEX IF NOT EXISTS idx_task_assignees_task ON public.task_assignees(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON public.task_assignees(assigned_to);
CREATE INDEX IF NOT EXISTS idx_task_assignees_department ON public.task_assignees(department_id);
CREATE INDEX IF NOT EXISTS idx_task_assignees_status ON public.task_assignees(status);

ALTER TABLE public.task_timeline
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES public.task_assignees(id) ON DELETE SET NULL;

ALTER TABLE public.task_compliance
  ADD COLUMN IF NOT EXISTS assignee_id uuid REFERENCES public.task_assignees(id) ON DELETE SET NULL;

ALTER TABLE public.task_assignees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS task_assignees_select ON public.task_assignees;
DROP POLICY IF EXISTS task_assignees_district ON public.task_assignees;

CREATE POLICY task_assignees_select ON public.task_assignees
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

CREATE POLICY task_assignees_district ON public.task_assignees
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

-- Assignee-scoped compliance visibility
DROP POLICY IF EXISTS task_compliance_select ON public.task_compliance;
CREATE POLICY task_compliance_select ON public.task_compliance
  FOR SELECT TO authenticated
  USING (
    assignee_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.task_assignees ta
      WHERE ta.id = task_compliance.assignee_id
        AND (
          ta.assigned_to = auth.uid()
          OR ta.department_id IN (
            SELECT department_id FROM public.users WHERE id = auth.uid()
          )
          OR EXISTS (
            SELECT 1 FROM public.users u
            JOIN public.roles r ON r.id = u.role_id
            WHERE u.id = auth.uid()
              AND r.slug IN ('collector', 'acp', 'adm')
          )
        )
    )
  );

NOTIFY pgrst, 'reload schema';
