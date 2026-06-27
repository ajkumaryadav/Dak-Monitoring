-- DAK source master for correspondence origin tracking
CREATE TABLE IF NOT EXISTS public.dak_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name text NOT NULL UNIQUE,
  source_category text NOT NULL DEFAULT 'general',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.dak_sources (source_name, source_category)
SELECT v.source_name, v.source_category
FROM (
  VALUES
    ('Chief Secretary', 'executive'),
    ('CMO', 'executive'),
    ('Secretariat', 'executive'),
    ('Minister', 'executive'),
    ('MP', 'elected'),
    ('MLA', 'elected'),
    ('Jan Sunwai', 'public'),
    ('Ratri Chaupal', 'public'),
    ('CM Helpline', 'public'),
    ('Public Grievance', 'public'),
    ('Court', 'legal'),
    ('Department', 'administrative'),
    ('Public', 'public'),
    ('Email', 'digital'),
    ('Other', 'general')
) AS v(source_name, source_category)
WHERE NOT EXISTS (
  SELECT 1 FROM public.dak_sources s WHERE s.source_name = v.source_name
);
