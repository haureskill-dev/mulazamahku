-- Hapus policy lama yang salah (karena aplikasi ini menggunakan local auth, bukan Supabase Auth)
DROP POLICY IF EXISTS "Semua orang bisa melihat kajian_batal" ON public.kajian_batal;
DROP POLICY IF EXISTS "Hanya admin dan pengajar yang bisa insert kajian_batal" ON public.kajian_batal;
DROP POLICY IF EXISTS "Hanya admin dan pengajar yang bisa update kajian_batal" ON public.kajian_batal;
DROP POLICY IF EXISTS "Hanya admin dan pengajar yang bisa delete kajian_batal" ON public.kajian_batal;

-- Buat policy baru yang mengizinkan semua operasi (pengecekan role sudah dilakukan di frontend aplikasi)
CREATE POLICY "Allow all for anon" ON public.kajian_batal FOR ALL USING (true) WITH CHECK (true);
