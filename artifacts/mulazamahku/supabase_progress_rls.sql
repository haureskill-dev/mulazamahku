DROP POLICY IF EXISTS "Allow all for anon" ON public.kajian_progress;
CREATE POLICY "Allow select for all" ON public.kajian_progress FOR SELECT USING (true);
CREATE POLICY "Allow insert for all" ON public.kajian_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update for all" ON public.kajian_progress FOR UPDATE USING (true);
