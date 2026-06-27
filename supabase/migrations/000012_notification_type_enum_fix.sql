-- Fix: notification_type enum missing dak_overdue (or other values) from partial migration

ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'dak_created';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'dak_assigned';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'dak_reassigned';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'dak_completed';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'status_updated';
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'dak_overdue';

NOTIFY pgrst, 'reload schema';
