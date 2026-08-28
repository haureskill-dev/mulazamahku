-- ══════════════════════════════════════════════════════════════════════
-- MULAZAMAHKU — Push Notification Tokens
-- Tabel untuk menyimpan Expo Push Token setiap perangkat yang login
-- ══════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.push_tokens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  expo_token TEXT NOT NULL UNIQUE,
  user_role TEXT NOT NULL DEFAULT 'murid',
  user_name TEXT,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Aktifkan RLS
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;

-- Policies: semua client (anon) boleh CRUD karena app ini tanpa auth Supabase
CREATE POLICY "Allow insert for all" ON public.push_tokens FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow select for all" ON public.push_tokens FOR SELECT USING (true);
CREATE POLICY "Allow update for all" ON public.push_tokens FOR UPDATE USING (true);
CREATE POLICY "Allow delete for all" ON public.push_tokens FOR DELETE USING (true);
