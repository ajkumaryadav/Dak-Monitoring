-- Step 1: Add new workflow enum values (must commit before Step 2)
-- Run this file first, then run 000005_migrate_dak_status_data.sql

ALTER TYPE public.dak_status ADD VALUE IF NOT EXISTS 'in_progress';
ALTER TYPE public.dak_status ADD VALUE IF NOT EXISTS 'completed';
