-- ══════════════════════════════════════════════════════════════════════
-- MULAZAMAHKU — Buat Ulang Webhook Trigger dengan pg_net
--
-- Trigger lama pakai extensions.http_post() yang tidak tersedia.
-- Trigger baru pakai net.http_post() dari pg_net (sudah aktif).
--
-- Ini membuat notifikasi push dikirim OTOMATIS oleh server
-- setiap kali ada INSERT di tabel flyers atau kajian_batal,
-- TANPA perlu admin membuka aplikasi.
-- ══════════════════════════════════════════════════════════════════════

-- 1. Buat function trigger yang memanggil Edge Function via pg_net
CREATE OR REPLACE FUNCTION public.notify_push_on_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload jsonb;
BEGIN
  -- Susun payload sesuai format WebhookPayload yang diharapkan Edge Function
  payload := jsonb_build_object(
    'type', 'INSERT',
    'table', TG_TABLE_NAME,
    'schema', TG_TABLE_SCHEMA,
    'record', to_jsonb(NEW),
    'old_record', NULL
  );

  -- Panggil Edge Function via pg_net (async, non-blocking)
  PERFORM net.http_post(
    url := 'https://twkofkelpeeftmgtowvp.supabase.co/functions/v1/send-push-notification',
    body := payload,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a29ma2VscGVlZnRtZ3Rvd3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDIxOTUsImV4cCI6MjA5NDYxODE5NX0.OIorHGbR50Umyir-Oqf431xRtqriXF0QE5qKpk1xk7s'
    )
  );

  RETURN NEW;
END;
$$;

-- 2. Buat trigger di tabel flyers (INSERT only)
CREATE TRIGGER on_flyer_insert
  AFTER INSERT ON public.flyers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_on_insert();

-- 3. Buat trigger di tabel kajian_batal (INSERT only)
CREATE TRIGGER on_kajian_batal_insert
  AFTER INSERT ON public.kajian_batal
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_push_on_insert();
