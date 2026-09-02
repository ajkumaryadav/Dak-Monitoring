-- Phase 2: DAK intake — department optional at registration; priority set at assignment

ALTER TABLE public.dak_entries
  ALTER COLUMN department_id DROP NOT NULL;

-- Ensure placeholder priority until collector assigns
ALTER TABLE public.dak_entries
  ALTER COLUMN priority SET DEFAULT 'routine';

NOTIFY pgrst, 'reload schema';
