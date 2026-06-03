-- ══════════════════════════════════════════════════════════════════
-- MULAZAMAHKU — Tabel Jadwal Tambahan (Private/Custom)
-- ══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.kajian_tambahan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  judul TEXT NOT NULL,
  ustadz TEXT NOT NULL,
  waktu TEXT NOT NULL,
  hari TEXT NOT NULL,
  lokasi TEXT NOT NULL,
  deskripsi TEXT,
  cp_nama TEXT,
  cp_telepon TEXT,
  is_public BOOLEAN DEFAULT false,
  created_by_email TEXT NOT NULL,
  created_by_role TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.kajian_tambahan ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Semua bisa membaca jadwal umum, hanya pengajar/admin membaca jadwal privat" ON public.kajian_tambahan
  FOR SELECT USING (
    is_public = true OR (auth.jwt() ->> 'role' IN ('pengajar', 'admin'))
  );

CREATE POLICY "Pengajar dan admin bisa menambah kajian tambahan" ON public.kajian_tambahan
  FOR INSERT WITH CHECK (created_by_role IN ('pengajar', 'admin'));

CREATE POLICY "Pembuat bisa mengupdate kajian tambahan" ON public.kajian_tambahan
  FOR UPDATE USING (created_by_email = auth.jwt() ->> 'email');

CREATE POLICY "Pembuat bisa menghapus kajian tambahan" ON public.kajian_tambahan
  FOR DELETE USING (created_by_email = auth.jwt() ->> 'email');
