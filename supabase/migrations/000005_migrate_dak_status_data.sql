-- Step 2: Migrate legacy status values to the new workflow model
-- Run AFTER 000004_workflow_statuses.sql has been committed

UPDATE public.dak_entries SET status = 'in_progress' WHERE status = 'under_process';
UPDATE public.dak_entries SET status = 'completed' WHERE status = 'disposed';
UPDATE public.dak_entries SET status = 'pending' WHERE status = 'escalated';
