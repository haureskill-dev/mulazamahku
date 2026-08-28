import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { supabase } from "./supabase";

const LOG_PREFIX = "[PushToken]";
const TABLE_NAME = "push_tokens";
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

/**
 * Hasil diagnosis push token — digunakan oleh UI untuk menampilkan status.
 */
export interface PushTokenStatus {
  platform: string;
  permissionStatus: string;
  projectId: string | null;
  expoToken: string | null;
  isRegisteredInSupabase: boolean;
  totalTokensInSupabase: number;
  error: string | null;
}

/**
 * Mendaftarkan Expo Push Token ke Supabase.
 * Dipanggil sekali setelah user login berhasil.
 *
 * Setiap step di-log detail agar mudah di-debug jika gagal.
 */
export async function registerPushToken(
  userRole: string,
  userName?: string
): Promise<string | null> {
  if (Platform.OS === "web") {
    console.log(LOG_PREFIX, "Push tokens tidak tersedia di web.");
    return null;
  }

  try {
    // Step 1: Cek izin notifikasi
    console.log(LOG_PREFIX, "Step 1: Mengecek izin notifikasi...");
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    console.log(LOG_PREFIX, "  Izin saat ini:", existingStatus);

    if (existingStatus !== "granted") {
      console.log(LOG_PREFIX, "  Meminta izin notifikasi...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log(LOG_PREFIX, "  Hasil permintaan izin:", finalStatus);
    }

    if (finalStatus !== "granted") {
      console.error(LOG_PREFIX, "❌ Step 1 GAGAL: Izin notifikasi tidak diberikan. Status:", finalStatus);
      return null;
    }
    console.log(LOG_PREFIX, "✅ Step 1: Izin notifikasi granted.");

    // Step 2: Setup notification channel (Android)
    if (Platform.OS === "android") {
      console.log(LOG_PREFIX, "Step 2: Setup Android notification channel...");
      await Notifications.setNotificationChannelAsync("kajian-reminders-v2", {
        name: "Jadwal Kajian",
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: "#C9A227",
      });
      console.log(LOG_PREFIX, "✅ Step 2: Channel Android berhasil dibuat.");
    }

    // Step 3: Dapatkan project ID
    console.log(LOG_PREFIX, "Step 3: Mencari Project ID...");
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      console.error(LOG_PREFIX, "❌ Step 3 GAGAL: Expo project ID tidak ditemukan.");
      console.error(LOG_PREFIX, "  expoConfig.extra:", JSON.stringify(Constants.expoConfig?.extra));
      console.error(LOG_PREFIX, "  TIPS: Pastikan app.json memiliki extra.eas.projectId");
      console.error(LOG_PREFIX, "  TIPS: Jika menggunakan Expo Go, push token mungkin tidak tersedia.");
      return null;
    }
    console.log(LOG_PREFIX, "✅ Step 3: Project ID ditemukan:", projectId);

    // Step 4: Dapatkan Expo Push Token
    console.log(LOG_PREFIX, "Step 4: Mendapatkan Expo Push Token...");
    let expoToken: string;
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      expoToken = tokenData.data;
    } catch (tokenError: any) {
      console.error(LOG_PREFIX, "❌ Step 4 GAGAL: getExpoPushTokenAsync error:", tokenError?.message || tokenError);
      console.error(LOG_PREFIX, "  TIPS: Ini biasanya terjadi di Expo Go. Push token membutuhkan EAS Build (development/preview build).");
      return null;
    }

    if (!expoToken) {
      console.error(LOG_PREFIX, "❌ Step 4 GAGAL: Token yang didapat kosong.");
      return null;
    }
    console.log(LOG_PREFIX, "✅ Step 4: Token didapat:", expoToken);

    // Step 5: Simpan ke Supabase
    console.log(LOG_PREFIX, "Step 5: Menyimpan token ke Supabase...");
    const { error } = await supabase.from(TABLE_NAME).upsert(
      {
        expo_token: expoToken,
        user_role: userRole,
        user_name: userName || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "expo_token" }
    );

    if (error) {
      console.error(LOG_PREFIX, "❌ Step 5 GAGAL: Supabase upsert error:", error.message);
      console.error(LOG_PREFIX, "  Error details:", JSON.stringify(error));
      return null;
    }

    console.log(LOG_PREFIX, "✅✅✅ Semua step berhasil! Token terdaftar:", expoToken);
    return expoToken;
  } catch (e: any) {
    console.error(LOG_PREFIX, "❌ Error tidak terduga saat registerPushToken:", e?.message || e);
    return null;
  }
}

/**
 * Diagnosis lengkap status push token.
 * Dipanggil dari UI untuk menampilkan status di halaman Profile.
 */
export async function getPushTokenStatus(): Promise<PushTokenStatus> {
  const status: PushTokenStatus = {
    platform: Platform.OS,
    permissionStatus: "unknown",
    projectId: null,
    expoToken: null,
    isRegisteredInSupabase: false,
    totalTokensInSupabase: 0,
    error: null,
  };

  if (Platform.OS === "web") {
    status.error = "Push token tidak tersedia di web.";
    return status;
  }

  try {
    // Cek izin
    const { status: permStatus } = await Notifications.getPermissionsAsync();
    status.permissionStatus = permStatus;

    // Cek project ID
    status.projectId = Constants.expoConfig?.extra?.eas?.projectId || null;

    // Cek expo token
    if (status.projectId) {
      try {
        const tokenData = await Notifications.getExpoPushTokenAsync({
          projectId: status.projectId,
        });
        status.expoToken = tokenData.data || null;
      } catch (e: any) {
        status.error = `Gagal ambil token: ${e?.message || "unknown"}. Kemungkinan menggunakan Expo Go (butuh EAS Build).`;
      }
    } else {
      status.error = "Project ID tidak ditemukan di app.json. Cek extra.eas.projectId.";
    }

    // Cek di Supabase: apakah token ini sudah terdaftar
    if (status.expoToken) {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("id")
        .eq("expo_token", status.expoToken)
        .limit(1);

      if (!error && data && data.length > 0) {
        status.isRegisteredInSupabase = true;
      }
    }

    // Hitung total token di Supabase
    const { count, error: countError } = await supabase
      .from(TABLE_NAME)
      .select("id", { count: "exact", head: true });

    if (!countError && count !== null) {
      status.totalTokensInSupabase = count;
    }
  } catch (e: any) {
    status.error = e?.message || "Error tidak terduga";
  }

  return status;
}

/**
 * Ambil jumlah total token yang terdaftar di Supabase.
 * Berguna untuk admin dashboard.
 */
export async function getRegisteredTokenCount(): Promise<number> {
  const { count, error } = await supabase
    .from(TABLE_NAME)
    .select("id", { count: "exact", head: true });

  if (error || count === null) return 0;
  return count;
}

/**
 * Menghapus Expo Push Token dari Supabase.
 * Dipanggil saat user logout.
 */
export async function unregisterPushToken(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoToken = tokenData.data;

    if (!expoToken) return;

    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq("expo_token", expoToken);

    if (error) {
      console.warn(LOG_PREFIX, "Gagal menghapus token:", error.message);
    } else {
      console.log(LOG_PREFIX, "Token berhasil dihapus dari Supabase.");
    }
  } catch (e: any) {
    console.warn(LOG_PREFIX, "Error saat unregisterPushToken:", e?.message || e);
  }
}

/**
 * Kirim push notification ke SEMUA perangkat yang terdaftar.
 * Dipanggil langsung dari app saat admin upload flyer / batalkan kajian.
 * Langsung memanggil Expo Push API — tidak perlu Edge Function.
 *
 * Fitur:
 * - Retry 1x pada network failure
 * - Inspeksi per-ticket error dari Expo (DeviceNotRegistered, dll)
 * - Auto-cleanup token yang sudah tidak valid
 */
export async function sendPushToAllUsers(
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<{ sent: number; errors: number; invalidTokensCleaned: number }> {
  try {
    const { data: tokens, error } = await supabase
      .from(TABLE_NAME)
      .select("expo_token");

    if (error || !tokens || tokens.length === 0) {
      console.log(LOG_PREFIX, "Tidak ada token terdaftar atau error:", error?.message);
      return { sent: 0, errors: 0, invalidTokensCleaned: 0 };
    }

    console.log(LOG_PREFIX, `Mengirim push ke ${tokens.length} perangkat...`);

    const messages = tokens.map((t: { expo_token: string }) => ({
      to: t.expo_token,
      sound: "default" as const,
      title,
      body,
      data: data || {},
      channelId: "kajian-reminders-v2",
      priority: "high" as const,
    }));

    let totalSent = 0;
    let totalErrors = 0;
    const invalidTokens: string[] = [];

    for (let i = 0; i < messages.length; i += 100) {
      const batch = messages.slice(i, i + 100);
      let response: Response | null = null;

      // Retry 1x pada network failure
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          response = await fetch(EXPO_PUSH_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(batch),
          });
          break; // Success, keluar dari retry loop
        } catch (e: any) {
          if (attempt === 0) {
            console.warn(LOG_PREFIX, `Batch fetch gagal, retry 1x...`, e?.message);
            await new Promise(r => setTimeout(r, 1000));
          } else {
            console.error(LOG_PREFIX, `Batch fetch gagal setelah retry:`, e?.message);
            totalErrors += batch.length;
          }
        }
      }

      if (!response) continue;

      if (response.ok) {
        try {
          const result = await response.json();
          const tickets = result.data || [];

          // Inspeksi per-ticket: cek mana yang error
          let batchSent = 0;
          let batchErrors = 0;
          for (let j = 0; j < tickets.length; j++) {
            const ticket = tickets[j];
            if (ticket.status === "ok") {
              batchSent++;
            } else {
              batchErrors++;
              // DeviceNotRegistered = token sudah tidak valid, perlu di-cleanup
              if (ticket.details?.error === "DeviceNotRegistered") {
                invalidTokens.push(batch[j].to);
              }
              console.warn(LOG_PREFIX, `Ticket error [${batch[j].to.substring(0, 30)}...]:`, ticket.message || ticket.details?.error);
            }
          }
          totalSent += batchSent;
          totalErrors += batchErrors;
        } catch {
          // Gagal parse response, tapi HTTP 200 — anggap batch terkirim
          totalSent += batch.length;
        }
      } else {
        const errorText = await response.text().catch(() => "unknown");
        console.error(LOG_PREFIX, `Batch HTTP error ${response.status}:`, errorText);
        totalErrors += batch.length;
      }
    }

    // Auto-cleanup token yang sudah tidak valid
    let invalidTokensCleaned = 0;
    if (invalidTokens.length > 0) {
      console.log(LOG_PREFIX, `Membersihkan ${invalidTokens.length} token tidak valid...`);
      for (const token of invalidTokens) {
        const { error: delError } = await supabase
          .from(TABLE_NAME)
          .delete()
          .eq("expo_token", token);
        if (!delError) invalidTokensCleaned++;
      }
      console.log(LOG_PREFIX, `Token dibersihkan: ${invalidTokensCleaned}/${invalidTokens.length}`);
    }

    console.log(LOG_PREFIX, `Selesai. Terkirim: ${totalSent}, Error: ${totalErrors}, Token invalid dibersihkan: ${invalidTokensCleaned}`);
    return { sent: totalSent, errors: totalErrors, invalidTokensCleaned };
  } catch (e: any) {
    console.error(LOG_PREFIX, "Error sendPushToAllUsers:", e?.message || e);
    return { sent: 0, errors: 0, invalidTokensCleaned: 0 };
  }
}
