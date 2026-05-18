import { createClient } from "@supabase/supabase-js";

// ╔═══════════════════════════════════════════════════════════════════════╗
// ║  KONFIGURASI SUPABASE                                               ║
// ║  Ganti kedua nilai di bawah dengan kredensial dari dashboard         ║
// ║  Supabase Anda: Settings → API                                      ║
// ╚═══════════════════════════════════════════════════════════════════════╝
const SUPABASE_URL = "https://twkofkelpeeftmgtowvp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3a29ma2VscGVlZnRtZ3Rvd3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNDIxOTUsImV4cCI6MjA5NDYxODE5NX0.OIorHGbR50Umyir-Oqf431xRtqriXF0QE5qKpk1xk7s";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
