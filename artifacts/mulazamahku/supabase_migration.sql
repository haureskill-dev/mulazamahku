-- ══════════════════════════════════════════════════════════════════
-- MULAZAMAHKU — Supabase Migration Script
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- 1. Tabel Users (dengan peran)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('murid', 'pengajar', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabel Jadwal Kajian
CREATE TABLE IF NOT EXISTS public.jadwal_kajian (
  id TEXT PRIMARY KEY,
  judul TEXT NOT NULL,
  ustadz TEXT NOT NULL,
  waktu TEXT NOT NULL,
  hari TEXT NOT NULL,
  lokasi TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'aktif',
  kategori TEXT NOT NULL DEFAULT 'Umum',
  deskripsi TEXT,
  maps_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabel Perubahan Jadwal
CREATE TABLE IF NOT EXISTS public.jadwal_perubahan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kajian_id TEXT REFERENCES public.jadwal_kajian(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  perubahan TEXT NOT NULL,
  waktu_baru TEXT,
  lokasi_baru TEXT,
  dibuat_oleh UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabel Flyers
CREATE TABLE IF NOT EXISTS public.flyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kajian_id TEXT REFERENCES public.jadwal_kajian(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  keterangan TEXT,
  tanggal_berlaku DATE,
  dibuat_oleh UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabel Catatan Pengajar (Progress Materi)
CREATE TABLE IF NOT EXISTS public.catatan_pengajar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kajian_id TEXT REFERENCES public.jadwal_kajian(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  materi_sampai TEXT NOT NULL,
  catatan TEXT,
  dibuat_oleh UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Tabel Rujukan Kitab
CREATE TABLE IF NOT EXISTS public.rujukan_kitab (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kajian_id TEXT REFERENCES public.jadwal_kajian(id) ON DELETE SET NULL,
  judul_kitab TEXT NOT NULL,
  penulis TEXT,
  deskripsi TEXT,
  file_url TEXT,
  izin_penggunaan BOOLEAN DEFAULT false,
  catatan_izin TEXT,
  dibuat_oleh UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ══════════════════════════════════════════════════════════════════
-- INSERT DATA AWAL JADWAL KAJIAN (migrasi dari dummyData)
-- ══════════════════════════════════════════════════════════════════

INSERT INTO public.jadwal_kajian (id, judul, ustadz, waktu, hari, lokasi, status, kategori, deskripsi, maps_url) VALUES
('r3', 'Fiqih Wanita', 'Ustadzah Rubeya Litiloly, S.Kom.', '15.45 - 17.30 WIB', 'Rabu · Pekan 1 & 3', 'Metro Mediterania', 'aktif', 'Fikih', 'Kajian fikih khusus untuk wanita bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Membahas hukum-hukum fikih yang berkaitan dengan wanita muslimah.', 'https://maps.google.com/?q=Metro+Mediterania'),
('r4', 'Fadhlul Islam', 'Ustadzah Rubeya Litiloly, S.Kom.', '16.00 - 17.30 WIB', 'Rabu · Pekan 2', 'Masjid Imam an-Nawawi', 'aktif', 'Akidah', 'Kajian kitab Fadhlul Islam bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله. Membahas keutamaan dan keistimewaan agama Islam.', 'https://maps.google.com/?q=Masjid+Imam+an-Nawawi'),
('r5', 'Fiqih Asmaul Husna', 'Ustadzah Rubeya Litiloly, S.Kom.', '16.00 - 17.15 WIB', 'Kamis · Pekan 1 & 3', 'Masjid Abu Bakar ash-Shiddiq', 'aktif', 'Akidah', 'Kajian Fiqih Asmaul Husna bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.', 'https://maps.google.com/?q=Masjid+Abu+Bakar+ash-Shiddiq'),
('r6', 'Kitabut Tauhid', 'Ustadzah Rubeya Litiloly, S.Kom.', '16.00 - 17.15 WIB', 'Kamis · Pekan 2 & 4', 'Masjid Abu Bakar ash-Shiddiq', 'aktif', 'Akidah', 'Kajian Kitabut Tauhid karya Syaikh Muhammad bin Abdul Wahhab bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.', 'https://maps.google.com/?q=Masjid+Abu+Bakar+ash-Shiddiq'),
('r7', 'Fiqih Haid', 'Ustadzah Rubeya Litiloly, S.Kom.', '16.00 - 17.30 WIB', 'Jumat · Pekan 2 & 4', 'Zircon Villa Permata Hijau', 'aktif', 'Fikih', 'Kajian Fiqih Haid bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.', NULL),
('r8', 'Kajian Jumat', 'Ustadzah Rubeya Litiloly, S.Kom.', '(masih konfirmasi)', 'Jumat · Pekan 4', 'Masjid as-Salam GSI', 'akan_datang', 'Umum', 'Kajian rutin bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله di Masjid as-Salam GSI.', NULL),
('r9', 'Hilyah Thalibul ''Ilmi & al-Firqotun Naiyah', 'Ustadzah Rubeya Litiloly, S.Kom.', '09.30 - selesai', 'Sabtu · Pekan 1 & 3', 'Masjid Imam asy-Syafi''i', 'aktif', 'Ilmu', 'Kajian Hilyah Thalibul ''Ilmi dan kitab al-Firqotun Naiyah bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.', NULL),
('r11', 'Tafsir Juz ''Amma', 'Ustadzah Rubeya Litiloly, S.Kom.', '08.30 - selesai', 'Sabtu · Pekan 2', 'Masjid al-Ikhlas', 'aktif', 'Tafsir', 'Kajian tafsir surah-surah dalam Juz ''Amma bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.', NULL),
('r10', '100 Dosa yang Diremehkan Wanita', 'Ustadzah Rubeya Litiloly, S.Kom.', '10.00 - 11.30 WIB', 'Sabtu · Pekan 4', 'Masjid Arga Baja Grogol', 'aktif', 'Akhlak', 'Kajian tentang 100 dosa yang sering diremehkan wanita bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.', NULL),
('r8_b', 'Kajian Sabtu Sore', 'Ustadzah Rubeya Litiloly, S.Kom.', '16.00 - 17.30 WIB', 'Sabtu · Pekan 4', 'GSI Blok H', 'aktif', 'Umum', 'Kajian rutin Sabtu sore bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.', 'https://maps.google.com/?q=GSI+Blok+H'),
('r12', 'Hilyah Thalibul ''Ilmi', 'Ustadzah Rubeya Litiloly, S.Kom.', '08.00 - 09.30 WIB', 'Ahad · Pekan 1', 'RT Abu Bakar Topaz VPH', 'aktif', 'Ilmu', 'Kajian Hilyah Thalibul ''Ilmi bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.', NULL),
('r13', 'Tsalatsatul Ushul', 'Ustadzah Rubeya Litiloly, S.Kom.', '09.30 - 11.00 WIB', 'Ahad · Pekan 1', 'Rumah Azaji Zamrud', 'aktif', 'Akidah', 'Kajian kitab Tsalatsatul Ushul (Tiga Landasan Pokok) bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله.', NULL),
('r14', 'Kajian Ahad', 'Ustadzah Rubeya Litiloly, S.Kom.', '08.00 - 09.30 WIB', 'Ahad · Pekan 2', 'R. Bu Malika Topaz VPH', 'akan_datang', 'Umum', 'Kajian rutin bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله di R. Bu Malika Topaz VPH.', NULL)
ON CONFLICT (id) DO NOTHING;

-- ══════════════════════════════════════════════════════════════════
-- ENABLE ROW LEVEL SECURITY
-- ══════════════════════════════════════════════════════════════════

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_kajian ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jadwal_perubahan ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.catatan_pengajar ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rujukan_kitab ENABLE ROW LEVEL SECURITY;

-- Policies: allow all operations for anon key (simple auth model)
CREATE POLICY "Allow all for anon" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.jadwal_kajian FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.jadwal_perubahan FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.flyers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.catatan_pengajar FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all for anon" ON public.rujukan_kitab FOR ALL USING (true) WITH CHECK (true);

-- ══════════════════════════════════════════════════════════════════
-- STORAGE BUCKET untuk Flyers dan PDF Kitab
-- ══════════════════════════════════════════════════════════════════

INSERT INTO storage.buckets (id, name, public) VALUES ('flyers', 'flyers', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('kitab', 'kitab', true) ON CONFLICT DO NOTHING;

-- Policies for storage buckets
CREATE POLICY "Public read flyers" ON storage.objects FOR SELECT USING (bucket_id = 'flyers');
CREATE POLICY "Public upload flyers" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'flyers');
CREATE POLICY "Public read kitab" ON storage.objects FOR SELECT USING (bucket_id = 'kitab');
CREATE POLICY "Public upload kitab" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'kitab');

-- 7. Tabel Faedah Kajian (Desain Canva)
CREATE TABLE IF NOT EXISTS public.faedah_kajian (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kajian_id TEXT REFERENCES public.jadwal_kajian(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'menunggu' CHECK (status IN ('menunggu', 'diverifikasi', 'revisi')),
  catatan_pengajar TEXT,
  dibuat_oleh UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.faedah_kajian ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all for anon" ON public.faedah_kajian FOR ALL USING (true) WITH CHECK (true);

INSERT INTO storage.buckets (id, name, public) VALUES ('faedah', 'faedah', true) ON CONFLICT DO NOTHING;
CREATE POLICY "Public read faedah" ON storage.objects FOR SELECT USING (bucket_id = 'faedah');
CREATE POLICY "Public upload faedah" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'faedah');

