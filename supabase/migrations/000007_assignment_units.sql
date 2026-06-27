-- Internal Collectorate sections and assignment unit types
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'assignment_unit_type') THEN
    CREATE TYPE public.assignment_unit_type AS ENUM ('department', 'section');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.assignment_units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_name text NOT NULL UNIQUE,
  unit_type public.assignment_unit_type NOT NULL DEFAULT 'section',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.assignment_units (unit_name, unit_type)
SELECT v.unit_name, v.unit_type::public.assignment_unit_type
FROM (
  VALUES
    ('Development', 'section'),
    ('Accounts', 'section'),
    ('PA Cell', 'section'),
    ('General', 'section'),
    ('LR', 'section'),
    ('Court', 'section'),
    ('Legal', 'section'),
    ('RTI', 'section'),
    ('Panchayati Raj', 'section'),
    ('ADM', 'section'),
    ('Store', 'section'),
    ('ACEM', 'section')
) AS v(unit_name, unit_type)
WHERE NOT EXISTS (
  SELECT 1 FROM public.assignment_units u WHERE u.unit_name = v.unit_name
);
