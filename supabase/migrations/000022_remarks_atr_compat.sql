-- Stage 16: Remarks & ATR schema compatibility (maps to 000019 columns)

-- is_internal mirrors remark_type for reporting (internal_note, collector_note)
ALTER TABLE public.dak_remarks
  ADD COLUMN IF NOT EXISTS is_internal boolean;

UPDATE public.dak_remarks
SET is_internal = remark_type IN ('internal_note', 'collector_note')
WHERE is_internal IS NULL;

-- created_at alias for dak_atr (submitted_at is canonical)
ALTER TABLE public.dak_atr
  ADD COLUMN IF NOT EXISTS created_at timestamptz;

UPDATE public.dak_atr
SET created_at = submitted_at
WHERE created_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_dak_remarks_is_internal ON public.dak_remarks (is_internal);

NOTIFY pgrst, 'reload schema';
