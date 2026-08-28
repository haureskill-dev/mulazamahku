import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const expoAccessToken = Deno.env.get("EXPO_ACCESS_TOKEN") || null;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

function getDayNameIndonesian(date: Date): string {
  const days = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  return days[date.getDay()];
}

function getWeekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  return Math.ceil((date.getDate() + firstDay) / 7);
}

function isKajianOnDate(kajian: any, date: Date, flyers: any[] = []): boolean {
  if (kajian.status !== "aktif") return false;

  const targetDay = getDayNameIndonesian(date);
  if (!kajian.hari.toLowerCase().includes(targetDay.toLowerCase())) return false;

  const weekNum = getWeekOfMonth(date);
  const pekanMatch = kajian.hari.match(/pekan\s*([\d\s&,]+)/i);
  if (!pekanMatch) return true;

  return pekanMatch[1].includes(String(weekNum));
}

Deno.serve(async (req) => {
  try {
    const authHeader = req.headers.get("Authorization");
    if (authHeader !== "Bearer ${supabaseServiceKey}") {
      return new Response("Unauthorized", { status: 401 });
    }

    console.log("[cron-daily-reminders] Memulai proses pengecekan jadwal kajian besok...");

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const { data: allKajian, error: kajianError } = await supabase
      .from("kajian")
      .select("*")
      .eq("status", "aktif");

    if (kajianError) throw kajianError;

    const kajianBesok = allKajian.filter(k => isKajianOnDate(k, tomorrow));

    if (kajianBesok.length === 0) {
      console.log("[cron-daily-reminders] Tidak ada kajian besok.");
      return new Response(JSON.stringify({ message: "Tidak ada kajian besok" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    console.log("[cron-daily-reminders] Ditemukan ${kajianBesok.length} kajian besok.");

    const { data: tokens, error: tokensError } = await supabase
      .from("push_tokens")
      .select("expo_token");

    if (tokensError) throw tokensError;

    if (!tokens || tokens.length === 0) {
      console.log("[cron-daily-reminders] Tidak ada push token terdaftar.");
      return new Response(JSON.stringify({ message: "Tidak ada token" }), { status: 200 });
    }

    let totalSent = 0;
    let totalErrors = 0;
    const invalidTokens: string[] = [];

    const kajianTitles = kajianBesok.map(k => k.judul).join(", ");
    let body = "";
    if (kajianBesok.length === 1) {
      const k = kajianBesok[0];
      body = `Besok ada kajian ${k.judul} bersama ${k.ustadz} pukul ${k.waktu.replace("WIB", "").trim()}.`;
    } else {
      body = `Besok ada ${kajianBesok.length} kajian: ${kajianTitles}. Jangan sampai terlewat!`;
    }

    const messages = tokens.map((t: { expo_token: string }) => ({
      to: t.expo_token,
      sound: "default",
      title: "🗓️ Pengingat Kajian Besok",
      body,
      data: { type: "reminder", kajianIds: kajianBesok.map(k => k.id) },
      channelId: "kajian-reminders-v2",
      priority: "high",
    }));

    const batches = [];
    for (let i = 0; i < messages.length; i += 100) {
      batches.push(messages.slice(i, i + 100));
    }

    for (const batch of batches) {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        Accept: "application/json",
      };

      if (expoAccessToken) {
        headers["Authorization"] = "Bearer ${expoAccessToken}";
      }

      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(batch),
      });

      if (response.ok) {
        const result = await response.json();
        const tickets = result.data || [];

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
        totalErrors += batch.length;
      }
    }

    if (invalidTokens.length > 0) {
      for (const token of invalidTokens) {
        await supabase.from("push_tokens").delete().eq("expo_token", token);
      }
    }

    console.log("[cron-daily-reminders] Sukses mengirim push notif H-1. Sent: ${totalSent}");

    return new Response(JSON.stringify({ 
      success: true, 
      sent: totalSent, 
      errors: totalErrors,
      kajianFound: kajianBesok.length
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error: any) {
    console.error("[cron-daily-reminders] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
});
