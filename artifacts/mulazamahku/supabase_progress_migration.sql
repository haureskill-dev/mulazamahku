CREATE TABLE IF NOT EXISTS public.kajian_progress (
  kajian_id TEXT PRIMARY KEY,
  progress TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kajian_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON public.kajian_progress FOR ALL USING (true) WITH CHECK (true);
