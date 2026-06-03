-- ══════════════════════════════════════════════════════════════════
-- MULAZAMAHKU — Tabel & Storage untuk Flyer dan Rujukan Kitab
-- Jalankan SQL ini di Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════

-- ── 1. Tabel Flyers (Poster Kajian) ───────────────────────────
CREATE TABLE IF NOT EXISTS flyers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kajian_id TEXT NOT NULL,
  image_url TEXT NOT NULL,
  keterangan TEXT,
  tanggal_berlaku DATE,
  dibuat_oleh TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE flyers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert flyers"
  ON flyers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous select flyers"
  ON flyers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous delete flyers"
  ON flyers FOR DELETE TO anon USING (true);

-- ── 2. Tabel Rujukan Kitab ────────────────────────────────────
CREATE TABLE IF NOT EXISTS rujukan_kitab (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  kajian_id TEXT,
  judul_kitab TEXT NOT NULL,
  penulis TEXT,
  deskripsi TEXT,
  file_url TEXT,
  izin_penggunaan BOOLEAN NOT NULL DEFAULT false,
  catatan_izin TEXT,
  dibuat_oleh TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE rujukan_kitab ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert rujukan"
  ON rujukan_kitab FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anonymous select rujukan"
  ON rujukan_kitab FOR SELECT TO anon USING (true);
CREATE POLICY "Allow anonymous delete rujukan"
  ON rujukan_kitab FOR DELETE TO anon USING (true);

-- ── 3. Storage Bucket: flyers ─────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('flyers', 'flyers', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow anonymous upload flyers"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'flyers');
CREATE POLICY "Allow public read flyers"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'flyers');

-- ── 4. Storage Bucket: rujukan ────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('rujukan', 'rujukan', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Allow anonymous upload rujukan"
  ON storage.objects FOR INSERT TO anon
  WITH CHECK (bucket_id = 'rujukan');
CREATE POLICY "Allow public read rujukan"
  ON storage.objects FOR SELECT TO anon
  USING (bucket_id = 'rujukan');
