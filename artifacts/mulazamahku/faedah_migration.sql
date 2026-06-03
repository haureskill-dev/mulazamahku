-- ══════════════════════════════════════════════════════════════════
-- MULAZAMAHKU — Tabel & Storage untuk Faedah
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Buat tabel faedah
CREATE TABLE IF NOT EXISTS public.faedah (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  uploader_name TEXT NOT NULL,
  uploader_email TEXT,
  uploader_role TEXT NOT NULL CHECK (uploader_role IN ('murid', 'pengajar', 'admin')),
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu', 'disetujui', 'ditolak')),
  catatan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Aktifkan RLS (Row Level Security) tapi izinkan semua operasi untuk anon
ALTER TABLE public.faedah ENABLE ROW LEVEL SECURITY;

-- Kebijakan: Semua orang bisa membaca (SELECT)
CREATE POLICY "Semua bisa membaca faedah" ON public.faedah
  FOR SELECT USING (true);

-- Kebijakan: Semua orang bisa menambah (INSERT)
CREATE POLICY "Semua bisa menambah faedah" ON public.faedah
  FOR INSERT WITH CHECK (true);

-- Kebijakan: Semua orang bisa mengupdate (UPDATE)
CREATE POLICY "Semua bisa mengupdate faedah" ON public.faedah
  FOR UPDATE USING (true);

-- Kebijakan: Semua orang bisa menghapus (DELETE)
CREATE POLICY "Semua bisa menghapus faedah" ON public.faedah
  FOR DELETE USING (true);

-- 3. Buat bucket storage untuk gambar faedah
INSERT INTO storage.buckets (id, name, public) 
VALUES ('faedah', 'faedah', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Kebijakan storage: izinkan upload dan akses publik
CREATE POLICY "Izinkan upload faedah" ON storage.objects 
  FOR INSERT WITH CHECK (bucket_id = 'faedah');

CREATE POLICY "Izinkan akses publik faedah" ON storage.objects 
  FOR SELECT USING (bucket_id = 'faedah');
