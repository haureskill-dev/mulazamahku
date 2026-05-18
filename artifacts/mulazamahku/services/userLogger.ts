import { Platform } from "react-native";
import { supabase } from "./supabase";

/**
 * Mencatat aktivitas login pengguna ke tabel `user_logs` di Supabase.
 * Data ini memungkinkan developer melihat siapa saja yang menggunakan aplikasi.
 *
 * Fungsi ini bersifat fire-and-forget: jika gagal (misal tidak ada internet),
 * tidak akan memblokir proses login pengguna.
 */
export async function logUserLogin(nama: string, email: string): Promise<void> {
  try {
    const now = new Date().toISOString();

    await supabase.from("user_logs").insert({
      nama,
      email,
      platform: Platform.OS, // "web", "ios", "android"
      logged_in_at: now,
    });
  } catch {
    // Gagal logging tidak boleh mengganggu UX pengguna
    console.warn("[UserLogger] Gagal mencatat login:", nama);
  }
}
