import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { DUMMY_KAJIAN } from "./dummyData";
import { KajianTambahanService } from "./kajianTambahanService";
import { Flyer } from "@/types";
import { Kajian } from "../types";

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

function prevDay(weekday: number): number {
  return weekday === 1 ? 7 : weekday - 1;
}

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

/**
 * Hitung jam & menit untuk reminder H-3 jam sebelum kajian.
 * Jika hasilnya negatif (misal kajian jam 02.00), maka reminder
 * dijadwalkan di hari sebelumnya.
 */
function threeHoursBefore(
  startHour: number,
  startMinute: number,
  kajianWeekday: number,
): { weekday: number; hour: number; minute: number } | null {
  let totalMinutes = startHour * 60 + startMinute - 180; // 3 jam = 180 menit
  let weekday = kajianWeekday;
  if (totalMinutes < 0) {
    totalMinutes += 24 * 60;
    weekday = prevDay(weekday);
  }
  return { weekday, hour: Math.floor(totalMinutes / 60), minute: totalMinutes % 60 };
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
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

export async function scheduleAllKajianReminders(userRole?: string): Promise<void> {
  if (Platform.OS === "web") return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  // Batalkan semua notifikasi lama sebelum menjadwalkan ulang
  await Notifications.cancelAllScheduledNotificationsAsync();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Jadwalkan notifikasi secara dinamis untuk 14 hari ke depan
  let allKajian: Kajian[] = [...DUMMY_KAJIAN];
  let flyersList: Flyer[] = [];
  let batalList: any[] = [];
  
  try {
    const KajianBatalService = require("./kajianBatalService").KajianBatalService;
    batalList = await KajianBatalService.getAll();
  } catch (e) {
    // Abaikan jika gagal memuat kajian batal
  }
  
  try {
    const customKajianData = await KajianTambahanService.getAll();
    const publicCustomKajian = customKajianData
      .filter(d => d.is_public || userRole === "admin" || userRole === "pengajar")
      .map(d => ({
        id: d.id,
        judul: d.judul,
        ustadz: d.ustadz,
        waktu: d.waktu,
        hari: d.hari,
        lokasi: d.lokasi,
        status: "aktif",
      } as Kajian));
      
    allKajian = [...allKajian, ...publicCustomKajian];
  } catch (e) {
    // Abaikan jika gagal memuat custom kajian
  }

  try {
    const FlyerService = require("./flyerService").FlyerService;
    flyersList = await FlyerService.getAllFlyers();
  } catch (e) {
    // Abaikan
  }

  for (let offset = 0; offset < 14; offset++) {
    const date = new Date(today.getTime() + offset * 24 * 60 * 60 * 1000);
    const dateStr = getLocalDateString(date);

    for (const kajian of allKajian) {
      if (!isKajianActiveOnDate(kajian.hari, kajian.id, date, flyersList)) continue;

      const waktuLabel = extractWaktuLabel(kajian.waktu);
      const pekanMatch = kajian.hari.match(/pekan\s*([\d\s&,]+)/i);
      const pekanLabel = pekanMatch ? ` (${kajian.hari.split("·")[1]?.trim() ?? ""})` : "";

      const batalInfo = batalList.find(b => b.kajian_id === kajian.id && b.tanggal === dateStr);

      // Jika kajian dibatalkan, jangan jadwalkan reminder H-3jam & H-30m
      // Namun, kita jadwalkan notifikasi "Info Update" pada H-1 agar murid tahu
      
      if (!batalInfo) {
        // ── Reminder H-3 jam (3 jam sebelum kajian dimulai) ──────────────────
        const startTime = extractStartHour(kajian.waktu);
      if (startTime) {
        const h3Time = new Date(date.getTime());
        h3Time.setHours(startTime.hour, startTime.minute, 0, 0);
        h3Time.setMinutes(h3Time.getMinutes() - 180); // Kurangi 3 jam

        if (h3Time.getTime() > Date.now()) {
          try {
            await Notifications.scheduleNotificationAsync({
              identifier: `kajian-h3jam-${kajian.id}-${dateStr}`,
              content: {
                title: "⏰ Kajian 3 Jam Lagi!",
                body: `"${kajian.judul}"${pekanLabel} di ${kajian.lokasi}${waktuLabel}. Jangan lupa hadir!`,
                data: { kajianId: kajian.id, reminderType: "h3jam", dateStr },
                sound: true,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: h3Time,
              },
            });
          } catch {
            // Lewati jika error
          }
        }

        // ── Reminder H-30 menit (30 menit sebelum kajian dimulai) ──────────────
        const h30mTime = new Date(date.getTime());
        h30mTime.setHours(startTime.hour, startTime.minute, 0, 0);
        h30mTime.setMinutes(h30mTime.getMinutes() - 30); // Kurangi 30 menit

        if (h30mTime.getTime() > Date.now()) {
          try {
            await Notifications.scheduleNotificationAsync({
              identifier: `kajian-h30m-${kajian.id}-${dateStr}`,
              content: {
                title: "⏳ Kajian 30 Menit Lagi!",
                body: `"${kajian.judul}"${pekanLabel} segera dimulai di ${kajian.lokasi}${waktuLabel}. Segera merapat!`,
                data: { kajianId: kajian.id, reminderType: "h30m", dateStr },
                sound: true,
              },
              trigger: {
                type: Notifications.SchedulableTriggerInputTypes.DATE,
                date: h30mTime,
              },
            });
          } catch {
            // Lewati jika error
          }
        }
        }
      }

      // ── Reminder H-1 (sehari sebelumnya, jam 20:00) ─────────────────────
      const h1Time = new Date(date.getTime() - 24 * 60 * 60 * 1000);
      h1Time.setHours(20, 0, 0, 0);

      if (h1Time.getTime() > Date.now()) {
        try {
          await Notifications.scheduleNotificationAsync({
            identifier: `kajian-h1-${kajian.id}-${dateStr}`,
            content: {
              title: batalInfo ? "⚠️ Info Update Kajian" : "📚 Pengingat Kajian Besok",
              body: batalInfo 
                ? `Kajian "${kajian.judul}" besok DIBATALKAN karena: ${batalInfo.alasan}`
                : `"${kajian.judul}"${pekanLabel} di ${kajian.lokasi}${waktuLabel}. Siapkan diri untuk menuntut ilmu!`,
              data: { kajianId: kajian.id, reminderType: "h1", dateStr, isCancelled: !!batalInfo },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.DATE,
              date: h1Time,
            },
          });
        } catch {
          // Lewati jika error
        }
      }
    }
  }
}

export async function cancelAllKajianReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

