import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { DUMMY_KAJIAN } from "./dummyData";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

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
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function scheduleAllKajianReminders(): Promise<void> {
  if (Platform.OS === "web") return;

  const granted = await requestNotificationPermission();
  if (!granted) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const kajian of DUMMY_KAJIAN) {
    const hariKey = extractHari(kajian.hari);
    if (!hariKey) continue;

    const kajianWeekday = HARI_TO_WEEKDAY[hariKey];
    const reminderWeekday = prevDay(kajianWeekday);
    const waktuLabel = extractWaktuLabel(kajian.waktu);

    const pekanMatch = kajian.hari.match(/pekan\s*([\d\s&,]+)/i);
    const pekanLabel = pekanMatch ? ` (${kajian.hari.split("·")[1]?.trim() ?? ""})` : "";

    // ── Reminder H-1 (sehari sebelumnya, jam 20:00) ─────────────────────
    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `kajian-h1-${kajian.id}`,
        content: {
          title: "📚 Pengingat Kajian Besok",
          body: `"${kajian.judul}"${pekanLabel} di ${kajian.lokasi}${waktuLabel}. Siapkan diri untuk menuntut ilmu!`,
          data: { kajianId: kajian.id, reminderType: "h1" },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: reminderWeekday,
          hour: 20,
          minute: 0,
        },
      });
    } catch {
      // lewati jika trigger tidak didukung di perangkat ini
    }

    // ── Reminder H-3 jam (3 jam sebelum kajian dimulai) ──────────────────
    const startTime = extractStartHour(kajian.waktu);
    if (startTime) {
      const h3 = threeHoursBefore(startTime.hour, startTime.minute, kajianWeekday);
      if (h3) {
        try {
          await Notifications.scheduleNotificationAsync({
            identifier: `kajian-h3jam-${kajian.id}`,
            content: {
              title: "⏰ Kajian 3 Jam Lagi!",
              body: `"${kajian.judul}"${pekanLabel} di ${kajian.lokasi}${waktuLabel}. Jangan lupa hadir!`,
              data: { kajianId: kajian.id, reminderType: "h3jam" },
              sound: true,
            },
            trigger: {
              type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
              weekday: h3.weekday,
              hour: h3.hour,
              minute: h3.minute,
            },
          });
        } catch {
          // lewati jika trigger tidak didukung
        }
      }
    }
  }
}

export async function cancelAllKajianReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}

export async function testNotification(): Promise<void> {
  if (Platform.OS === "web") {
    alert('Simulasi Notifikasi (Web):\n"Fiqih Wanita" di Metro Mediterania pukul 15.45. Siapkan diri untuk menuntut ilmu!');
    return;
  }
  
  const granted = await requestNotificationPermission();
  if (!granted) {
    alert('Izin notifikasi tidak diberikan.');
    return;
  }

  await Notifications.scheduleNotificationAsync({
    identifier: `test-notification-${Date.now()}`,
    content: {
      title: "📚 Pengingat Kajian Besok",
      body: '"Fiqih Wanita" di Metro Mediterania pukul 15.45. Siapkan diri untuk menuntut ilmu!',
      sound: true,
    },
    trigger: null,
  });
}
