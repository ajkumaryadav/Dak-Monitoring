-- Add dak_created enum value for registration notifications

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'dak_created';

NOTIFY pgrst, 'reload schema';
