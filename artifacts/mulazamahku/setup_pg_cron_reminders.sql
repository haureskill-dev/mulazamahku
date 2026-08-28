-- ==============================================================================
-- SETUP CRON JOB UNTUK PENGINGAT HARIAN H-1 KAJIAN (PUSH NOTIFICATIONS)
-- ==============================================================================
-- Script ini akan memerintahkan database Supabase untuk memanggil Edge Function
-- 'cron-daily-reminders' setiap jam 20:00 WIB (13:00 UTC) setiap hari.
--
-- PENTING: SEBELUM DIJALANKAN, GANTI NILAI BERIKUT:
-- 1. Ganti 'YOUR_PROJECT_REF' dengan Project Reference Supabase Anda (misal: qwertyuiopasdfghjkl)
-- 2. Ganti 'YOUR_SERVICE_ROLE_KEY' dengan Service Role Key Supabase Anda
-- ==============================================================================

-- 1. Aktifkan ekstensi yang dibutuhkan (jika belum)
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Hapus jadwal lama jika sudah ada (mencegah duplikasi)
-- HAPUS TANDA '--' DI BAWAH JIKA ANDA INGIN MENGUBAH JADWAL YANG SUDAH ADA SEBELUMNYA:
-- SELECT cron.unschedule('invoke-daily-reminders');

-- 3. Buat jadwal baru (Berjalan setiap jam 13:00 UTC / 20:00 WIB)
SELECT cron.schedule(
    'invoke-daily-reminders',
    '0 13 * * *',
    $$ 
    SELECT net.http_post(
        url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/cron-daily-reminders',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
    ) as request_id; 
    $$
);

-- ==============================================================================
-- CARA MENDAPATKAN PROJECT REF & SERVICE ROLE KEY:
-- 1. Project Ref: Lihat URL dashboard Supabase Anda. Misal: https://supabase.com/dashboard/project/abcxyz123 -> 'abcxyz123'
-- 2. Service Role Key: Ke Settings -> API -> Project API keys -> service_role (Copy)
-- ==============================================================================
