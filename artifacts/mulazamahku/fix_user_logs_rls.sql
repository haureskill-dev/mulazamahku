-- Pastikan tabel user_logs dapat dibaca oleh aplikasi (mode developer)
ALTER TABLE IF EXISTS public.user_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow select user_logs for all" ON public.user_logs;
CREATE POLICY "Allow select user_logs for all"
  ON public.user_logs
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Allow insert user_logs for all" ON public.user_logs;
CREATE POLICY "Allow insert user_logs for all"
  ON public.user_logs
  FOR INSERT
  WITH CHECK (true);
