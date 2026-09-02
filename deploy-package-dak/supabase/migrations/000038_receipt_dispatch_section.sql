-- Add Receipt / Dispatch as an internal Collectorate section
INSERT INTO public.assignment_units (unit_name, unit_type)
SELECT v.unit_name, 'section'::public.assignment_unit_type
FROM (
  VALUES
    ('Receipt / Dispatch')
) AS v(unit_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.assignment_units u WHERE u.unit_name = v.unit_name
);

NOTIFY pgrst, 'reload schema';
