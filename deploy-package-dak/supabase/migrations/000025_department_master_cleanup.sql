-- Phase 3: Department master cleanup — dedupe and add Collectorate branches

-- Merge duplicate Health → Medical & Health
DO $$
DECLARE
  health_id uuid;
  medical_id uuid;
BEGIN
  SELECT id INTO health_id FROM public.departments WHERE name = 'Health' LIMIT 1;
  SELECT id INTO medical_id FROM public.departments WHERE name = 'Medical & Health' LIMIT 1;

  IF health_id IS NOT NULL AND medical_id IS NOT NULL THEN
    UPDATE public.dak_entries SET department_id = medical_id WHERE department_id = health_id;
    UPDATE public.users SET department_id = medical_id WHERE department_id = health_id;
    DELETE FROM public.departments WHERE id = health_id;
  ELSIF health_id IS NOT NULL AND medical_id IS NULL THEN
    UPDATE public.departments SET name = 'Medical & Health' WHERE id = health_id;
  END IF;
END $$;

-- Merge Police (District) → Police
DO $$
DECLARE
  old_id uuid;
  police_id uuid;
BEGIN
  SELECT id INTO old_id FROM public.departments WHERE name = 'Police (District)' LIMIT 1;
  SELECT id INTO police_id FROM public.departments WHERE name = 'Police' LIMIT 1;

  IF old_id IS NOT NULL AND police_id IS NOT NULL THEN
    UPDATE public.dak_entries SET department_id = police_id WHERE department_id = old_id;
    UPDATE public.users SET department_id = police_id WHERE department_id = old_id;
    DELETE FROM public.departments WHERE id = old_id;
  ELSIF old_id IS NOT NULL AND police_id IS NULL THEN
    UPDATE public.departments SET name = 'Police' WHERE id = old_id;
  END IF;
END $$;

-- Add missing Collectorate departments
INSERT INTO public.departments (name)
SELECT v.name
FROM (
  VALUES
    ('Collectorate'),
    ('General Administration'),
    ('PRO'),
    ('Establishment'),
    ('Confidential'),
    ('Nazarat'),
    ('Election'),
    ('Disaster Management'),
    ('Planning')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d WHERE d.name = v.name
);

-- Extend internal sections
INSERT INTO public.assignment_units (unit_name, unit_type)
SELECT v.unit_name, 'section'::public.assignment_unit_type
FROM (
  VALUES
    ('Establishment'),
    ('Confidential'),
    ('Revenue'),
    ('Nazarat'),
    ('General Administration'),
    ('PRO'),
    ('Election'),
    ('Disaster Management'),
    ('Planning')
) AS v(unit_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.assignment_units u WHERE u.unit_name = v.unit_name
);

NOTIFY pgrst, 'reload schema';
