-- Run this entire file in Supabase SQL Editor if notifications are not working.
-- Applies table + enum values + PostgREST schema reload in one step.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE public.notification_type AS ENUM (
      'dak_created',
      'dak_assigned',
      'dak_reassigned',
      'dak_completed',
      'status_updated',
      'dak_overdue'
    );
  END IF;
END $$;

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'dak_created';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'dak_assigned';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'dak_reassigned';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'dak_completed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'status_updated';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'dak_overdue';

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  type public.notification_type NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  dak_id uuid REFERENCES public.dak_entries (id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id
  ON public.notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON public.notifications (user_id, created_at DESC)
  WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_created_at
  ON public.notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_dak_id
  ON public.notifications (dak_id);

CREATE INDEX IF NOT EXISTS idx_notifications_type_dak_user
  ON public.notifications (type, dak_id, user_id, created_at DESC);

NOTIFY pgrst, 'reload schema';
