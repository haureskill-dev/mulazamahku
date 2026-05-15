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

function extractWaktuLabel(waktu: string): string {
  if (!waktu || waktu.includes("konfirmasi")) return "";
  const match = waktu.match(/(\d{2})[.:](\d{2})/);
  if (match) return ` pukul ${match[1]}.${match[2]}`;
  return "";
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

    try {
      await Notifications.scheduleNotificationAsync({
        identifier: `kajian-reminder-${kajian.id}`,
        content: {
          title: "⏰ Pengingat Kajian Besok",
          body: `"${kajian.judul}"${pekanLabel} di ${kajian.lokasi}${waktuLabel}`,
          data: { kajianId: kajian.id },
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
  }
}

export async function cancelAllKajianReminders(): Promise<void> {
  if (Platform.OS === "web") return;
  await Notifications.cancelAllScheduledNotificationsAsync();
}
