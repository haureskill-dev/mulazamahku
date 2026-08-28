-- ══════════════════════════════════════════════════════════════════════
-- MULAZAMAHKU — Fix: Tambah UPDATE Policy untuk Flyers + Storage Delete
-- 
-- Jalankan di Supabase Dashboard → SQL Editor
-- 
-- Bug: tabel flyers tidak punya UPDATE policy, sehingga edit flyer
-- selalu gagal dengan "new row violates row-level security policy"
-- ══════════════════════════════════════════════════════════════════════

-- 1. Tambah UPDATE policy untuk tabel flyers (FIX KRITIS)
CREATE POLICY "Allow anonymous update flyers"
  ON flyers FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

-- 2. Tambah DELETE policy untuk storage objects bucket flyers
-- (Diperlukan agar app bisa cleanup gambar lama saat replace/hapus flyer)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'objects' 
    AND schemaname = 'storage' 
    AND policyname = 'Allow anonymous delete flyers storage'
  ) THEN
    CREATE POLICY "Allow anonymous delete flyers storage"
      ON storage.objects FOR DELETE TO anon
      USING (bucket_id = 'flyers');
  END IF;
END $$;
