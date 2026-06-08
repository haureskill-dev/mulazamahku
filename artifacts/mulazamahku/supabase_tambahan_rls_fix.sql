DROP POLICY IF EXISTS "Semua bisa membaca jadwal umum, hanya pengajar/admin membaca jadwal privat" ON public.kajian_tambahan;
DROP POLICY IF EXISTS "Pengajar dan admin bisa menambah kajian tambahan" ON public.kajian_tambahan;
DROP POLICY IF EXISTS "Pembuat bisa mengupdate kajian tambahan" ON public.kajian_tambahan;
DROP POLICY IF EXISTS "Pembuat bisa menghapus kajian tambahan" ON public.kajian_tambahan;
DROP POLICY IF EXISTS "Allow all for anon" ON public.kajian_tambahan;

CREATE POLICY "Allow all" ON public.kajian_tambahan FOR ALL USING (true) WITH CHECK (true);
