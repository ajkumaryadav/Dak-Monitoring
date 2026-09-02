-- Phase 4: DAK transfer / forward / escalation workflow

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dak_transfer_action') THEN
    CREATE TYPE public.dak_transfer_action AS ENUM (
      'forward_adm',
      'forward_collector',
      'transfer_department',
      'return_clarification',
      'manual_escalate',
      'adm_guidance'
    );
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.dak_transfers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dak_id uuid NOT NULL REFERENCES public.dak_entries(id) ON DELETE CASCADE,
  action public.dak_transfer_action NOT NULL,
  from_user_id uuid REFERENCES public.users(id),
  to_user_id uuid REFERENCES public.users(id),
  from_department_id uuid REFERENCES public.departments(id),
  to_department_id uuid REFERENCES public.departments(id),
  remarks text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dak_transfers_dak_id ON public.dak_transfers(dak_id);

ALTER TABLE public.dak_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY dak_transfers_select ON public.dak_transfers
  FOR SELECT TO authenticated USING (true);

NOTIFY pgrst, 'reload schema';
