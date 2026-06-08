-- Hapus semua kebijakan keamanan (RLS) lama pada tabel faedah
DROP POLICY IF EXISTS "Semua bisa membaca faedah" ON public.faedah;
DROP POLICY IF EXISTS "Semua bisa menambah faedah" ON public.faedah;
DROP POLICY IF EXISTS "Semua bisa mengupdate faedah" ON public.faedah;
DROP POLICY IF EXISTS "Semua bisa menghapus faedah" ON public.faedah;
DROP POLICY IF EXISTS "Allow all for anon" ON public.faedah;

-- Buat satu kebijakan sapu jagat agar semua akses diperbolehkan tanpa hambatan (Internal App)
CREATE POLICY "Allow all on faedah" ON public.faedah FOR ALL USING (true) WITH CHECK (true);

-- Pastikan tabel memiliki akses RLS aktif
ALTER TABLE public.faedah ENABLE ROW LEVEL SECURITY;

-- Untuk penyimpanan gambar (Supabase Storage)
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'faedah');
CREATE POLICY "Allow Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'faedah');
CREATE POLICY "Allow Update" ON storage.objects FOR UPDATE USING (bucket_id = 'faedah');
CREATE POLICY "Allow Delete" ON storage.objects FOR DELETE USING (bucket_id = 'faedah');
