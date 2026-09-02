-- Compliance draft support for process-driven DAK disposal workflow

ALTER TABLE public.dak_atr
  ADD COLUMN IF NOT EXISTS is_draft boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_dak_atr_is_draft ON public.dak_atr (dak_id, is_draft);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dak_atr_one_draft_per_officer
  ON public.dak_atr (dak_id, submitted_by)
  WHERE is_draft = true;

NOTIFY pgrst, 'reload schema';
