-- Seed district departments for DAK allocation (idempotent by name)
INSERT INTO public.departments (name, is_active)
SELECT v.name, v.is_active
FROM (
  VALUES
    ('Collectorate', true),
    ('General Administration', true),
    ('Revenue', true),
    ('Development', true),
    ('Panchayat Raj', true),
    ('Education', true),
    ('Health', true),
    ('Agriculture', true),
    ('Social Welfare', true),
    ('Police (District)', true)
) AS v(name, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d WHERE d.name = v.name
);
