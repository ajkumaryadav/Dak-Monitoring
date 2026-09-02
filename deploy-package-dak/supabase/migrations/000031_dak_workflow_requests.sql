-- Pending workflow requests from departments (transfer, escalation, extension)

CREATE TABLE IF NOT EXISTS public.dak_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries(id) ON DELETE CASCADE,
  request_type text NOT NULL CHECK (
    request_type IN ('transfer', 'escalation', 'extension')
  ),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'approved', 'rejected')
  ),
  requested_by uuid NOT NULL REFERENCES public.users(id),
  reviewed_by uuid REFERENCES public.users(id),
  remarks text NOT NULL,
  review_remarks text,
  target_department_id uuid REFERENCES public.departments(id),
  requested_due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_dak_requests_dak_id ON public.dak_requests(dak_id);
CREATE INDEX IF NOT EXISTS idx_dak_requests_status ON public.dak_requests(status);
CREATE INDEX IF NOT EXISTS idx_dak_requests_type ON public.dak_requests(request_type);

ALTER TABLE public.dak_requests ENABLE ROW LEVEL SECURITY;

NOTIFY pgrst, 'reload schema';
