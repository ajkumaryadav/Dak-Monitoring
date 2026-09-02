-- Extend DAK entries with source and assignment metadata (nullable for existing rows)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dak_assignment_type') THEN
    CREATE TYPE public.dak_assignment_type AS ENUM ('department', 'section');
  END IF;
END $$;

ALTER TABLE public.dak_entries
  ADD COLUMN IF NOT EXISTS source_id uuid REFERENCES public.dak_sources(id),
  ADD COLUMN IF NOT EXISTS assignment_type public.dak_assignment_type,
  ADD COLUMN IF NOT EXISTS assignment_unit_id uuid REFERENCES public.assignment_units(id);

CREATE INDEX IF NOT EXISTS idx_dak_entries_source_id ON public.dak_entries (source_id);
CREATE INDEX IF NOT EXISTS idx_dak_entries_assignment_unit_id ON public.dak_entries (assignment_unit_id);
CREATE INDEX IF NOT EXISTS idx_dak_entries_assignment_type ON public.dak_entries (assignment_type);
