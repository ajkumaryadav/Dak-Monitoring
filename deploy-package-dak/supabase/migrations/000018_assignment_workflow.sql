-- Assignment workflow: officer columns on dak_entries + ACEM section

ALTER TABLE public.dak_entries
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_by uuid REFERENCES public.users (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_dak_entries_assigned_to ON public.dak_entries (assigned_to);
CREATE INDEX IF NOT EXISTS idx_dak_entries_assigned_by ON public.dak_entries (assigned_by);

INSERT INTO public.assignment_units (unit_name, unit_type)
SELECT 'ACEM', 'section'::public.assignment_unit_type
WHERE NOT EXISTS (
  SELECT 1 FROM public.assignment_units u WHERE u.unit_name = 'ACEM'
);

NOTIFY pgrst, 'reload schema';
