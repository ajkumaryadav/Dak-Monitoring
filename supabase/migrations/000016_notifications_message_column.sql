-- Align notifications.message (legacy) with notifications.body (app column).

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

UPDATE public.notifications
SET body = message
WHERE body IS NULL AND message IS NOT NULL;

UPDATE public.notifications
SET message = body
WHERE message IS NULL AND body IS NOT NULL;

UPDATE public.notifications
SET body = COALESCE(body, message, ''),
    message = COALESCE(message, body, '');

NOTIFY pgrst, 'reload schema';
