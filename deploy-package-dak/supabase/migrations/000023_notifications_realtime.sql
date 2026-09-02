-- Stage 18: Enable Supabase Realtime for notifications + RLS for client subscriptions

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS notifications_select_own ON public.notifications;
DROP POLICY IF EXISTS notifications_select_district ON public.notifications;
DROP POLICY IF EXISTS notifications_update_own ON public.notifications;

-- Users read their own notifications
CREATE POLICY notifications_select_own ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Collector, ACP, and ADM read district-wide notifications
CREATE POLICY notifications_select_district ON public.notifications
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
        AND r.slug IN ('collector', 'acp', 'adm')
    )
  );

-- Users mark their own notifications read from the client
CREATE POLICY notifications_update_own ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- District admins may mark any notification read
CREATE POLICY notifications_update_district ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.roles r ON r.id = u.role_id
      WHERE u.id = auth.uid()
        AND r.slug IN ('collector', 'acp', 'adm')
    )
  )
  WITH CHECK (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';
