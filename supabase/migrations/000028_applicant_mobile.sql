-- Phase 6: Applicant mobile and reference for duplicate detection

ALTER TABLE public.dak_entries
  ADD COLUMN IF NOT EXISTS applicant_mobile text,
  ADD COLUMN IF NOT EXISTS applicant_reference text;

CREATE INDEX IF NOT EXISTS idx_dak_entries_applicant_mobile
  ON public.dak_entries(applicant_mobile)
  WHERE applicant_mobile IS NOT NULL;

NOTIFY pgrst, 'reload schema';
