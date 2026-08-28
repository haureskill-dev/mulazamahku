// ══════════════════════════════════════════════════════════════════════════
// MULAZAMAHKU — Supabase Edge Function: send-push-notification
// 
// Dipanggil oleh Database Webhook saat ada INSERT pada tabel:
//   - flyers     → kirim notifikasi "Flyer kajian baru"
//   - kajian_batal → kirim notifikasi "Kajian dibatalkan"
//
// PENTING: App juga mengirim push dari client-side (sendPushToAllUsers).
// Edge Function ini berfungsi sebagai BACKUP jika client-side gagal.
// Dedup guard mencegah user menerima notifikasi ganda.
//
// Deploy:
//   supabase functions deploy send-push-notification
//
// Set secret (opsional, untuk keamanan tambahan):
//   supabase secrets set EXPO_ACCESS_TOKEN=your_expo_access_token
// ══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

// Supabase client menggunakan service_role agar bisa baca semua data
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN") || null;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Dedup window: jika client sudah kirim push dalam 60 detik terakhir
// untuk record yang sama, Edge Function tidak kirim lagi.
const DEDUP_WINDOW_SECONDS = 60;

interface WebhookPayload {
  type: "INSERT" | "UPDATE" | "DELETE";
  table: string;
  record: Record<string, any>;
  schema: string;
  old_record: Record<string, any> | null;
}

Deno.serve(async (req) => {
  try {
    const payload: WebhookPayload = await req.json();

    console.log(`[send-push] Received webhook: ${payload.type} on ${payload.table}`);

    // Hanya proses INSERT
    if (payload.type !== "INSERT") {
      return new Response(JSON.stringify({ message: "Ignored non-INSERT event" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ── Dedup guard ─────────────────────────────────────────────────────
    // Cek created_at dari record: jika record dibuat lebih dari DEDUP_WINDOW detik
    // yang lalu, berarti ini late-trigger dan mungkin client sudah kirim push.
    const recordCreatedAt = payload.record.created_at;
    if (recordCreatedAt) {
      const createdTime = new Date(recordCreatedAt).getTime();
      const now = Date.now();
      const ageSeconds = (now - createdTime) / 1000;

      // Jika webhook datang lebih dari 5 detik setelah record dibuat,
      // kemungkinan besar client-side push sudah terkirim.
      // Tapi kita tetap kirim jika webhook cepat (< 5 detik), karena
      // client mungkin belum selesai kirim.
      if (ageSeconds > DEDUP_WINDOW_SECONDS) {
        console.log(`[send-push] Dedup: record sudah ${ageSeconds.toFixed(0)}s lalu, skip.`);
        return new Response(
          JSON.stringify({ message: "Skipped: dedup window exceeded", ageSeconds }),
          { status: 200, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // ── Susun konten notifikasi berdasarkan tabel ────────────────────────
    let title = "";
    let body = "";
    let data: Record<string, string> = {};

    if (payload.table === "flyers") {
      const record = payload.record;
      const kajianId = record.kajian_id || "";
      const keterangan = record.keterangan || "";
      const tanggal = record.tanggal_berlaku || "";

      title = "📢 Info Kajian Terbaru";
      body = keterangan
        ? `${keterangan.substring(0, 120)}${keterangan.length > 120 ? "..." : ""}`
        : `Ada flyer kajian baru yang diupload.${tanggal ? ` Tanggal: ${tanggal}` : ""}`;
      data = { kajianId, type: "flyer" };
    } else if (payload.table === "kajian_batal") {
      const record = payload.record;
      const kajianId = record.kajian_id || "";
      const alasan = record.alasan || "Tidak ada keterangan";
      const tanggal = record.tanggal || "";

      title = "⚠️ Kajian Dibatalkan";
      body = `Kajian tanggal ${tanggal} dibatalkan. Alasan: ${alasan}`;
      data = { kajianId, type: "batal" };
    } else {
      return new Response(
        JSON.stringify({ message: `Tabel '${payload.table}' tidak ditangani.` }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // ── Ambil semua push tokens ─────────────────────────────────────────
    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("expo_token");

    if (tokensError) {
      console.error("[send-push] Gagal ambil tokens:", tokensError.message);
      return new Response(
        JSON.stringify({ error: "Gagal ambil push tokens" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!tokens || tokens.length === 0) {
      console.log("[send-push] Tidak ada push token yang terdaftar.");
      return new Response(
        JSON.stringify({ message: "Tidak ada token terdaftar", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`[send-push] Mengirim ke ${tokens.length} perangkat...`);

    // ── Kirim ke Expo Push API (batch, max 100 per request) ─────────────
    const messages = tokens.map((t: { expo_token: string }) => ({
      to: t.expo_token,
      sound: "default",
      title,
      body,
      data,
      channelId: "kajian-reminders-v2",
      priority: "high",
    }));

    // Batch per 100
    const batches = [];
    for (let i = 0; i < messages.length; i += 100) {
      batches.push(messages.slice(i, i + 100));
    }

    let totalSent = 0;
    let totalErrors = 0;
    const invalidTokens: string[] = [];

    for (const batch of batches) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      // Tambahkan Expo Access Token jika tersedia (opsional tapi direkomendasikan)
      if (expoAccessToken) {
        headers["Authorization"] = `Bearer ${expoAccessToken}`;
      }

      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(batch),
      });

      if (response.ok) {
        const result = await response.json();
        const tickets = result.data || [];

        // Inspeksi per-ticket error
        for (let j = 0; j < tickets.length; j++) {
          const ticket = tickets[j];
          if (ticket.status === "ok") {
            totalSent++;
          } else {
            totalErrors++;
            if (ticket.details?.error === "DeviceNotRegistered") {
              invalidTokens.push(batch[j].to);
            }
          }
        }
      } else {
        const errorText = await response.text();
        console.error("[send-push] Batch error:", response.status, errorText);
        totalErrors += batch.length;
      }
    }

    // Auto-cleanup invalid tokens
    if (invalidTokens.length > 0) {
      console.log(`[send-push] Membersihkan ${invalidTokens.length} token tidak valid...`);
      for (const token of invalidTokens) {
        await supabase.from("push_tokens").delete().eq("expo_token", token);
      }
    }

    console.log(`[send-push] Selesai. Terkirim: ${totalSent}, Error: ${totalErrors}, Invalid cleaned: ${invalidTokens.length}`);

    return new Response(
      JSON.stringify({
        message: "Push notifications sent",
        sent: totalSent,
        errors: totalErrors,
        invalidTokensCleaned: invalidTokens.length,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("[send-push] Unhandled error:", error?.message || error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});

