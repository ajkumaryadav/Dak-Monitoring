-- Repair notifications table: ensure columns exist and convert type enum → text.
-- Run in Supabase SQL Editor if inserts fail due to incomplete enum.

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

UPDATE public.notifications SET body = '' WHERE body IS NULL;
UPDATE public.notifications SET metadata = '{}'::jsonb WHERE metadata IS NULL;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notifications'
      AND column_name = 'type'
      AND udt_name = 'notification_type'
  ) THEN
    ALTER TABLE public.notifications
      ALTER COLUMN type TYPE text USING type::text;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
