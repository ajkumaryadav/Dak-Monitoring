-- Move internal Collectorate sections out of the departments master and dedupe names
-- Safe to re-run: uses NOT EXISTS / targeted updates only.

-- Ensure internal sections exist in assignment_units
INSERT INTO public.assignment_units (unit_name, unit_type)
SELECT v.unit_name, 'section'::public.assignment_unit_type
FROM (
  VALUES
    ('Establishment'),
    ('Accounts'),
    ('General Administration'),
    ('Nazarat'),
    ('Legal'),
    ('Confidential'),
    ('Election'),
    ('Disaster Management'),
    ('Store'),
    ('Record Room'),
    ('Planning'),
    ('PRO')
) AS v(unit_name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.assignment_units u WHERE u.unit_name = v.unit_name
);

-- Reassign DAK/users away from internal-only department rows, then delete them
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT d.id, d.name
    FROM public.departments d
    WHERE d.name IN (
      'Establishment',
      'Accounts',
      'General Administration',
      'Nazarat',
      'Legal',
      'Confidential',
      'Election',
      'Disaster Management',
      'Store',
      'Record Room',
      'Planning',
      'PRO'
    )
  LOOP
    UPDATE public.dak_entries SET department_id = NULL WHERE department_id = rec.id;
    UPDATE public.users SET department_id = NULL WHERE department_id = rec.id;
    DELETE FROM public.departments WHERE id = rec.id;
  END LOOP;
END $$;

-- Dedupe remaining departments by name (keep one row per name — no MIN(uuid))
WITH ranked AS (
  SELECT
    id,
    name,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY id::text ASC) AS rn
  FROM public.departments
),
dupes AS (
  SELECT
    r.id AS dupe_id,
    r.name,
    k.id AS keep_id
  FROM ranked r
  INNER JOIN ranked k ON k.name = r.name AND k.rn = 1
  WHERE r.rn > 1
)
UPDATE public.dak_entries de
SET department_id = dupes.keep_id
FROM dupes
WHERE de.department_id = dupes.dupe_id;

WITH ranked AS (
  SELECT
    id,
    name,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY id::text ASC) AS rn
  FROM public.departments
),
dupes AS (
  SELECT
    r.id AS dupe_id,
    r.name,
    k.id AS keep_id
  FROM ranked r
  INNER JOIN ranked k ON k.name = r.name AND k.rn = 1
  WHERE r.rn > 1
)
UPDATE public.users u
SET department_id = dupes.keep_id
FROM dupes
WHERE u.department_id = dupes.dupe_id;

WITH ranked AS (
  SELECT
    id,
    name,
    ROW_NUMBER() OVER (PARTITION BY name ORDER BY id::text ASC) AS rn
  FROM public.departments
)
DELETE FROM public.departments d
USING ranked r
WHERE d.id = r.id
  AND r.rn > 1;

NOTIFY pgrst, 'reload schema';
