-- Stage 14: User management — extend users, seed roles, section mapping

-- Extend users profile columns
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS mobile text,
  ADD COLUMN IF NOT EXISTS designation text,
  ADD COLUMN IF NOT EXISTS employee_code text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS department_id uuid REFERENCES public.departments (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.assignment_units (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users (id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS last_login timestamptz;

CREATE INDEX IF NOT EXISTS idx_users_department_id ON public.users (department_id);
CREATE INDEX IF NOT EXISTS idx_users_section_id ON public.users (section_id);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users (is_active);
CREATE INDEX IF NOT EXISTS idx_users_role_id ON public.users (role_id);

-- Ensure roles table exists (minimal bootstrap if missing)
CREATE TABLE IF NOT EXISTS public.roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.roles (slug, name) VALUES
  ('collector', 'Collector'),
  ('acp', 'ACP'),
  ('adm', 'ADM'),
  ('dak_operator', 'DAK Operator'),
  ('department_user', 'Department User'),
  ('section_user', 'Section User')
ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name;

-- Legacy role aliases (map old slugs to new names if present)
INSERT INTO public.roles (slug, name) VALUES
  ('district_officer', 'District Officer (Legacy)'),
  ('block_officer', 'Block Officer (Legacy)'),
  ('clerk', 'Clerk (Legacy)'),
  ('data_entry_operator', 'Data Entry Operator (Legacy)')
ON CONFLICT (slug) DO NOTHING;

NOTIFY pgrst, 'reload schema';
