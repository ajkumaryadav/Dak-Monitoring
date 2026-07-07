-- Phase 5: ATR-gated approval workflow statuses

ALTER TYPE public.dak_status ADD VALUE IF NOT EXISTS 'atr_submitted';
ALTER TYPE public.dak_status ADD VALUE IF NOT EXISTS 'pending_approval';

NOTIFY pgrst, 'reload schema';
