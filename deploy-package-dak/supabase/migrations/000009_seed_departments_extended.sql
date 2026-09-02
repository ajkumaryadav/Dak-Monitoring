-- Extended district department master (alphabetical names, idempotent)
INSERT INTO public.departments (name, is_active)
SELECT v.name, true
FROM (
  VALUES
    ('BIDA'),
    ('Devsthan'),
    ('DOIT&C'),
    ('Food & Supply'),
    ('Home'),
    ('Irrigation'),
    ('JVVNL'),
    ('LSG'),
    ('Medical & Health'),
    ('Minority'),
    ('PHED'),
    ('Police'),
    ('Pollution Control'),
    ('PWD'),
    ('Revenue'),
    ('Rural Development'),
    ('SJE'),
    ('Statistics'),
    ('Transport'),
    ('Treasury'),
    ('Watershed')
) AS v(name)
WHERE NOT EXISTS (
  SELECT 1 FROM public.departments d WHERE d.name = v.name
);
