-- Mulazamahku: tanggal kajian manual untuk Progres Materi
-- Jalankan di Supabase SQL Editor.
-- Pengajar/admin memilih sendiri progres ini untuk kajian tanggal berapa,
-- bukan lagi memakai tanggal otomatis saat input (updated_at).

ALTER TABLE public.kajian_progress
  ADD COLUMN IF NOT EXISTS tanggal_kajian date;
