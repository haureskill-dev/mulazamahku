CREATE TABLE IF NOT EXISTS public.kajian_batal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kajian_id TEXT NOT NULL,
  tanggal DATE NOT NULL,
  alasan TEXT NOT NULL,
  dibuat_oleh UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kajian_batal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua orang bisa melihat kajian_batal"
ON public.kajian_batal FOR SELECT
TO public
USING (true);

CREATE POLICY "Hanya admin dan pengajar yang bisa insert kajian_batal"
ON public.kajian_batal FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'pengajar')
  )
);

CREATE POLICY "Hanya admin dan pengajar yang bisa update kajian_batal"
ON public.kajian_batal FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'pengajar')
  )
);

CREATE POLICY "Hanya admin dan pengajar yang bisa delete kajian_batal"
ON public.kajian_batal FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'pengajar')
  )
);
