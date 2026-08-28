import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import * as BackgroundFetch from "expo-background-fetch";
import * as TaskManager from "expo-task-manager";
import { DUMMY_KAJIAN } from "./dummyData";
import { KajianTambahanService } from "./kajianTambahanService";
import { Flyer } from "@/types";
import { Kajian } from "../types";
import { BACKGROUND_TASK_NAME } from "./backgroundTaskSetup";

const LOG_PREFIX = "[NotifService]";

if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

// expo-notifications weekday: 1=Ahad, 2=Senin, 3=Selasa, 4=Rabu, 5=Kamis, 6=Jumat, 7=Sabtu
const HARI_TO_WEEKDAY: Record<string, number> = {
  ahad: 1,
  senin: 2,
  selasa: 3,
  rabu: 4,
  kamis: 5,
  jumat: 6,
  sabtu: 7,
};

function extractHari(hariStr: string): string | null {
  const lower = hariStr.toLowerCase();
  for (const h of Object.keys(HARI_TO_WEEKDAY)) {
    if (lower.startsWith(h)) return h;
  }
  return null;
}

function extractStartHour(waktu: string): { hour: number; minute: number } | null {
  if (!waktu || waktu.includes("konfirmasi")) return null;
  const match = waktu.match(/(\d{2})[.:](\d{2})/);
  if (match) return { hour: parseInt(match[1], 10), minute: parseInt(match[2], 10) };
  return null;
}

function extractWaktuLabel(waktu: string): string {
  if (!waktu || waktu.includes("konfirmasi")) return "";
  const match = waktu.match(/(\d{2})[.:](\d{2})/);
  if (match) return ` pukul ${match[1]}.${match[2]}`;
  return "";
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("kajian-reminders-v2", {
      name: "Jadwal Kajian",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#C9A227",
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

function getLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function isKajianActiveOnDate(kajianHari: string, kajianId: string, date: Date, flyers: Flyer[] = []): boolean {
  // Cek apakah ada flyer (reschedule) yang tanggal berlakunya cocok dengan date ini
  const dateStr = getLocalDateString(date);
  const hasReschedule = flyers.some(f => f.kajian_id === kajianId && f.tanggal_berlaku === dateStr);
  if (hasReschedule) return true;

  const DAYS_ID = ["ahad", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
  const dateWeekday = DAYS_ID[date.getDay()];
  
  const lowerHari = kajianHari.toLowerCase();
  if (!lowerHari.startsWith(dateWeekday)) {
    return false;
  }
  
  // Periksa apakah ada spesifikasi pekan (misal: "Pekan 1 & 3")
  const pekanMatch = kajianHari.match(/pekan\s*([\d\s&,]+)/i);
  if (!pekanMatch) {
    return true; // Jika tidak ada spesifikasi pekan, maka diadakan setiap minggu
  }
  
  const weekNum = Math.ceil(date.getDate() / 7);
  const pekanSpecs = pekanMatch[1]; // misal "1 & 3" atau "2"
  return pekanSpecs.includes(String(weekNum));
}

/**
 * Jadwalkan notifikasi secara cerdas:
 * - TIDAK menghapus semua notifikasi lalu jadwalkan ulang (ini penyebab bug lama)
 * - Bandingkan notifikasi yang sudah terjadwal dengan yang seharusnya
 * - Hanya tambah/hapus yang berbeda
 * - Memperluas window menjadi 30 hari ke depan
 */
export async function scheduleAllKajianReminders(userRole?: string): Promise<void> {
  if (Platform.OS === "web") return;

  const granted = await requestNotificationPermission();
  if (!granted) {
    console.log(LOG_PREFIX, "Izin notifikasi tidak diberikan");
    return;
  }

  console.log(LOG_PREFIX, "Mulai menjadwalkan notifikasi kajian...");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // ── Kumpulkan data kajian ──────────────────────────────────────────────
  let allKajian: Kajian[] = [...DUMMY_KAJIAN];
  let flyersList: Flyer[] = [];
  let batalList: any[] = [];
  
  try {
    const KajianBatalService = require("./kajianBatalService").KajianBatalService;
    batalList = await KajianBatalService.getAll();
  } catch (e) {
    console.log(LOG_PREFIX, "Gagal memuat kajian batal:", e);
  }
  
  try {
    const customKajianData = await KajianTambahanService.getAll();
    
    // Simpan ID yang sudah dihapus
    const deletedIds = customKajianData.filter(d => d.is_deleted).map(d => d.id);
    
    const publicCustomKajian = customKajianData
      .filter(d => !d.is_deleted && (d.is_public || userRole === "admin" || userRole === "pengajar"))
      .map(d => ({
        id: d.id,
        judul: d.judul,
        ustadz: d.ustadz,
        waktu: d.waktu,
        hari: d.hari,
        lokasi: d.lokasi,
        status: "aktif",
      } as Kajian));
      
    const customIds = publicCustomKajian.map(c => c.id);
    const filteredDummy = allKajian.filter(d => !customIds.includes(d.id) && !deletedIds.includes(d.id));
    
    allKajian = [...filteredDummy, ...publicCustomKajian];
  } catch (e) {
    console.log(LOG_PREFIX, "Gagal memuat custom kajian:", e);
  }

  try {
    const FlyerService = require("./flyerService").FlyerService;
    flyersList = await FlyerService.getAllFlyers();
  } catch (e) {
    console.log(LOG_PREFIX, "Gagal memuat flyers:", e);
  }

  // ── Ambil notifikasi yang sudah terjadwal ──────────────────────────────
  const existingNotifs = await Notifications.getAllScheduledNotificationsAsync();
  const existingIds = new Set(existingNotifs.map(n => n.identifier));
  console.log(LOG_PREFIX, `Notifikasi terjadwal saat ini: ${existingIds.size}`);

  // ── Hitung notifikasi yang seharusnya dijadwalkan ──────────────────────
  const desiredNotifs = new Map<string, {
    content: Notifications.NotificationContentInput;
    triggerDate: Date;
  }>();

  // Notifikasi yang waktunya baru saja lewat — kirim langsung
  const immediateNotifs: { id: string; content: Notifications.NotificationContentInput }[] = [];

  for (let offset = 0; offset < 30; offset++) {
    const date = new Date(today.getTime() + offset * 24 * 60 * 60 * 1000);
    const dateStr = getLocalDateString(date);

    for (const kajian of allKajian) {
      if (!isKajianActiveOnDate(kajian.hari, kajian.id, date, flyersList)) continue;

      const waktuLabel = extractWaktuLabel(kajian.waktu);
      const pekanMatch = kajian.hari.match(/pekan\s*([\d\s&,]+)/i);
      const pekanLabel = pekanMatch ? ` (${kajian.hari.split("·")[1]?.trim() ?? ""})` : "";

      const batalInfo = batalList.find(b => b.kajian_id === kajian.id && b.tanggal === dateStr);

      if (!batalInfo) {
        // ── Reminder H-3 jam ─────────────────────────────────────────────
        const startTime = extractStartHour(kajian.waktu);
        if (startTime) {
          const h3Time = new Date(date.getTime());
          h3Time.setHours(startTime.hour, startTime.minute, 0, 0);
          h3Time.setMinutes(h3Time.getMinutes() - 180);

          if (h3Time.getTime() > Date.now()) {
            const id = `kajian-h3jam-${kajian.id}-${dateStr}`;
            desiredNotifs.set(id, {
              content: {
                title: "⏰ Kajian 3 Jam Lagi!",
                body: `"${kajian.judul}"${pekanLabel} di ${kajian.lokasi}${waktuLabel}. Jangan lupa hadir!`,
                data: { kajianId: kajian.id, reminderType: "h3jam", dateStr },
                sound: true,
                channelId: "kajian-reminders-v2",
              },
              triggerDate: h3Time,
            });
          }

          // ── Reminder H-30 menit ──────────────────────────────────────────
          const h30mTime = new Date(date.getTime());
          h30mTime.setHours(startTime.hour, startTime.minute, 0, 0);
          h30mTime.setMinutes(h30mTime.getMinutes() - 30);

          if (h30mTime.getTime() > Date.now()) {
            const id = `kajian-h30m-${kajian.id}-${dateStr}`;
            desiredNotifs.set(id, {
              content: {
                title: "⏳ Kajian 30 Menit Lagi!",
                body: `"${kajian.judul}"${pekanLabel} segera dimulai di ${kajian.lokasi}${waktuLabel}. Segera merapat!`,
                data: { kajianId: kajian.id, reminderType: "h30m", dateStr },
                sound: true,
                channelId: "kajian-reminders-v2",
              },
              triggerDate: h30mTime,
            });
          }
        }
      }

      // ── Reminder H-1 (sehari sebelumnya, jam 20:00) ─────────────────────
      const h1Time = new Date(date.getTime() - 24 * 60 * 60 * 1000);
      h1Time.setHours(20, 0, 0, 0);

      const h1Content: Notifications.NotificationContentInput = {
        title: batalInfo ? "⚠️ Info Update Kajian" : "📚 Pengingat Kajian Besok",
        body: batalInfo 
          ? `Kajian "${kajian.judul}" besok DIBATALKAN karena: ${batalInfo.alasan}`
          : `"${kajian.judul}"${pekanLabel} di ${kajian.lokasi}${waktuLabel}. Siapkan diri untuk menuntut ilmu!`,
        data: { kajianId: kajian.id, reminderType: "h1", dateStr, isCancelled: !!batalInfo },
        sound: true,
        channelId: "kajian-reminders-v2",
      };

      const h1Id = `kajian-h1-${kajian.id}-${dateStr}`;
      const h1Diff = h1Time.getTime() - Date.now();

      if (h1Diff > 0) {
        // Waktu masih di masa depan → jadwalkan normal
        desiredNotifs.set(h1Id, { content: h1Content, triggerDate: h1Time });
      } else if (h1Diff > -4 * 60 * 60 * 1000 && !existingIds.has(h1Id)) {
        // Waktu sudah lewat tapi masih malam yang sama (≤4 jam = sampai jam 00:00)
        // & belum pernah dikirim → Kirim langsung agar user tetap dapat notifikasi
        console.log(LOG_PREFIX, `H-1 terlewat ${Math.round(-h1Diff / 60000)} menit lalu, kirim langsung: ${kajian.judul}`);
        immediateNotifs.push({ id: h1Id, content: h1Content });
      }
    }
  }

  console.log(LOG_PREFIX, `Notifikasi yang seharusnya dijadwalkan: ${desiredNotifs.size}`);

  // ── Hapus notifikasi yang sudah tidak diperlukan ───────────────────────
  let cancelledCount = 0;
  for (const existingId of existingIds) {
    // Hanya kelola notifikasi kajian (yang dimulai dengan "kajian-")
    if (existingId.startsWith("kajian-") && !desiredNotifs.has(existingId)) {
      await Notifications.cancelScheduledNotificationAsync(existingId);
      cancelledCount++;
    }
  }
  console.log(LOG_PREFIX, `Notifikasi dibatalkan: ${cancelledCount}`);

  // ── Jadwalkan notifikasi baru yang belum ada ──────────────────────────
  let scheduledCount = 0;
  let errorCount = 0;
  for (const [id, notif] of desiredNotifs) {
    if (!existingIds.has(id)) {
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: id,
          content: notif.content,
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: notif.triggerDate,
          },
        });
        scheduledCount++;
      } catch (e) {
        errorCount++;
        console.warn(LOG_PREFIX, `Gagal jadwalkan notifikasi ${id}:`, e);
      }
    }
  }
  
  // ── Kirim notifikasi yang waktunya baru lewat (immediate) ─────────────
  let immediateCount = 0;
  for (const imm of immediateNotifs) {
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: imm.id,
        content: imm.content,
        trigger: null, // null = kirim langsung
      });
      immediateCount++;
    } catch (e) {
      errorCount++;
      console.warn(LOG_PREFIX, `Gagal kirim immediate notifikasi ${imm.id}:`, e);
    }
  }

  console.log(LOG_PREFIX, `Selesai! Dijadwalkan: ${scheduledCount}, Immediate: ${immediateCount}, Error: ${errorCount}, Total aktif: ${desiredNotifs.size}`);
}

export async function cancelAllKajianReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// ── Debug: Lihat semua notifikasi yang sudah terjadwal ─────────────────
export async function debugListScheduledNotifications(): Promise<string> {
  if (Platform.OS === "web") return "Web: notifikasi tidak didukung";
  
  const notifs = await Notifications.getAllScheduledNotificationsAsync();
  if (notifs.length === 0) return "Tidak ada notifikasi terjadwal.";
  
  const lines = notifs
    .sort((a, b) => {
      const dateA = (a.trigger as any)?.value ?? 0;
      const dateB = (b.trigger as any)?.value ?? 0;
      return dateA - dateB;
    })
    .map(n => {
      const triggerDate = (n.trigger as any)?.value 
        ? new Date((n.trigger as any).value).toLocaleString("id-ID") 
        : "unknown";
      return `• ${n.identifier}\n  → ${n.content.title}\n  → ${triggerDate}`;
    });
  
  return `Total: ${notifs.length} notifikasi\n\n${lines.join("\n\n")}`;
}

/**
 * Kirim notifikasi test langsung (muncul dalam 3 detik).
 * Untuk verifikasi apakah sistem notifikasi berfungsi.
 */
export async function sendTestNotification(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  try {
    const granted = await requestNotificationPermission();
    if (!granted) {
      console.log(LOG_PREFIX, "Test notif: izin tidak diberikan");
      return false;
    }

    await Notifications.scheduleNotificationAsync({
      identifier: "test-notif-" + Date.now(),
      content: {
        title: "🔔 Test Notifikasi Berhasil!",
        body: "Alhamdulillah, notifikasi berfungsi dengan baik di perangkat ini.",
        sound: true,
        channelId: "kajian-reminders-v2",
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(Date.now() + 3000), // 3 detik dari sekarang
      },
    });

    console.log(LOG_PREFIX, "Test notifikasi dijadwalkan (3 detik lagi)");
    return true;
  } catch (e) {
    console.error(LOG_PREFIX, "Gagal kirim test notifikasi:", e);
    return false;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// BACKGROUND FETCH REGISTRATION
// defineTask() sudah dipanggil di backgroundTaskSetup.ts (top-level).
// Fungsi ini hanya mendaftarkan task ke BackgroundFetch scheduler.
// ══════════════════════════════════════════════════════════════════════════

/**
 * Daftarkan background task untuk menjadwalkan notifikasi secara berkala.
 * Panggil SEKALI saat app pertama kali dibuka (misal di _layout.tsx).
 *
 * Interval: 6 jam (21600 detik)
 * - Cukup sering untuk menangkap perubahan jadwal kajian
 * - Cukup jarang agar tidak di-throttle oleh Android Doze / iOS Background App Refresh
 *
 * stopOnTerminate: false → Task tetap terdaftar walau app di-force-close
 * startOnBoot: true → Task didaftarkan ulang setelah device restart
 */
export async function registerBackgroundNotificationTask(): Promise<void> {
  if (Platform.OS === "web") return;

  try {
    const isRegistered = await TaskManager.isTaskRegisteredAsync(BACKGROUND_TASK_NAME);
    if (isRegistered) {
      console.log(LOG_PREFIX, "Background task sudah terdaftar.");
      return;
    }

    await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
      minimumInterval: 6 * 60 * 60, // 6 jam — ramah baterai, tidak di-throttle OS
      stopOnTerminate: false,        // Tetap jalan walau app ditutup
      startOnBoot: true,             // Jalan ulang setelah HP restart
    });
    
    console.log(LOG_PREFIX, "Background task berhasil didaftarkan! (interval: 6 jam)");
  } catch (e) {
    console.warn(LOG_PREFIX, "Gagal mendaftarkan background task:", e);
  }
}
