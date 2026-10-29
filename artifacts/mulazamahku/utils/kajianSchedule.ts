import { Kajian, Flyer } from "@/types";
import { DUMMY_KAJIAN } from "@/services/dummyData";
import { KajianTambahanService } from "@/services/kajianTambahanService";
import { FlyerService } from "@/services/flyerService";
import { KajianBatalService, KajianBatal } from "@/services/kajianBatalService";
import { toDateStr } from "@/utils/dates";

/**
 * Logika jadwal kajian bersama — dipakai Beranda, Kalender, dan
 * pengingat (notifikasi) agar semuanya sinkron 1 sumber.
 */

export const DAYS_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];
// getDay(): 0=Ahad … 6=Sabtu
export const JS_DAY_TO_HARI = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export function extractDayName(hari: string): string {
  const lower = hari.toLowerCase();
  for (const d of DAYS_ORDER) {
    if (lower.startsWith(d.toLowerCase())) return d;
  }
  return hari;
}

export function groupByDay(kajian: Kajian[]): Record<string, Kajian[]> {
  const groups: Record<string, Kajian[]> = {};
  for (const d of DAYS_ORDER) groups[d] = [];
  for (const k of kajian) {
    const day = extractDayName(k.hari);
    if (groups[day]) groups[day].push(k);
  }
  return groups;
}

/** Cek apakah kajian aktif pada tanggal tertentu (cocok hari + pekan, atau ada flyer reschedule) */
export function isKajianOnDate(kajian: Kajian, date: Date, flyers: Flyer[] = []): boolean {
  const status = kajian.status as string;
  if (status === "nonaktif" || status === "selesai") return false;

  const dateStr = toDateStr(date);
  const hasReschedule = flyers.some((f) => f.kajian_id === kajian.id && f.tanggal_berlaku === dateStr);
  if (hasReschedule) return true;

  const dayName = JS_DAY_TO_HARI[date.getDay()];
  const kajianDay = extractDayName(kajian.hari);
  if (kajianDay !== dayName) return false;

  const pekanMatch = kajian.hari.match(/pekan\s*([\d\s&,]+)/i);
  if (!pekanMatch) return true;
  const weekNum = Math.ceil(date.getDate() / 7);
  return pekanMatch[1].includes(String(weekNum));
}

export function isKajianPassedToday(waktu: string): boolean {
  if (!waktu || waktu.includes("konfirmasi")) return false;
  const matches = waktu.match(/\d{2}[.:]\d{2}/g);
  if (!matches || matches.length === 0) return false;

  const lastTime = matches.length > 1 ? matches[1] : matches[0];
  const [h, m] = lastTime.replace(".", ":").split(":");

  const now = new Date();
  const end = new Date();
  end.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  // Buffer 60 menit setelah jadwal habis/mulai
  end.setMinutes(end.getMinutes() + 60);
  return now.getTime() > end.getTime();
}

/** Ambil keterangan waktu dari flyer jika ada reschedule pada tanggal itu */
export function extractTimeFromFlyer(kajian: Kajian, date: Date, flyers: Flyer[]): string | null {
  const dateStr = toDateStr(date);
  const matchingFlyer = flyers.find((f) => f.kajian_id === kajian.id && f.tanggal_berlaku === dateStr);
  if (matchingFlyer?.keterangan) {
    const timeMatch = matchingFlyer.keterangan.match(/(\d{2})[.:]\s*(\d{2})/);
    if (timeMatch) return matchingFlyer.keterangan;
  }
  return null;
}

/** Jam mulai (menit sejak 00:00) untuk pengurutan */
export function getStartMinutes(waktu: string): number {
  if (!waktu || waktu.includes("konfirmasi")) return 9999;
  const match = waktu.match(/(\d{2})[.:]\s*(\d{2})/);
  if (match) return parseInt(match[1], 10) * 60 + parseInt(match[2], 10);
  return 9999;
}

export function getStartTime(waktu: string): { hour: number; minute: number } | null {
  const m = getStartMinutes(waktu);
  if (m === 9999) return null;
  return { hour: Math.floor(m / 60), minute: m % 60 };
}

/** Cari kajian terdekat dalam 14 hari ke depan — prioritas paling awal waktunya */
export function findNearestKajian(allKajian: Kajian[], flyers: Flyer[] = []): Kajian {
  const res = findNearestKajianWithDate(allKajian, flyers);
  if (res) return res.kajian;
  return allKajian.find((k) => k.status === "aktif") ?? allKajian[0];
}

export function findNearestKajianWithDate(
  allKajian: Kajian[],
  flyers: Flyer[] = [],
): { kajian: Kajian; date: Date } | null {
  const now = new Date();
  for (let offset = 0; offset < 14; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const candidates: { kajian: Kajian; startMinutes: number }[] = [];
    for (const k of allKajian) {
      if (!isKajianOnDate(k, date, flyers)) continue;
      const flyerWaktu = extractTimeFromFlyer(k, date, flyers);
      const effectiveWaktu = flyerWaktu || k.waktu;
      if (offset === 0 && isKajianPassedToday(effectiveWaktu)) continue;
      candidates.push({ kajian: k, startMinutes: getStartMinutes(effectiveWaktu) });
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.startMinutes - b.startMinutes);
      return { kajian: candidates[0].kajian, date };
    }
  }
  return null;
}

/** N tanggal pertemuan berikutnya untuk satu kajian (mulai hari ini) */
export function getNextOccurrences(kajian: Kajian, count = 4, flyers: Flyer[] = [], maxDays = 120): Date[] {
  const result: Date[] = [];
  const now = new Date();
  for (let offset = 0; offset < maxDays && result.length < count; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    if (isKajianOnDate(kajian, date, flyers)) result.push(date);
  }
  return result;
}

export interface KajianData {
  kajian: Kajian[];
  flyers: Flyer[];
  batal: KajianBatal[];
}

/** Gabungkan kajian rutin (dummy) + kajian tambahan dari Supabase sesuai peran user */
export async function loadAllKajianData(role?: string): Promise<KajianData> {
  const [tambahan, flyers, batal] = await Promise.all([
    KajianTambahanService.getAll().catch(() => [] as any[]),
    FlyerService.getAllFlyers().catch(() => [] as Flyer[]),
    KajianBatalService.getAll().catch(() => [] as KajianBatal[]),
  ]);

  const deletedIds = tambahan.filter((d: any) => d.is_deleted).map((d: any) => d.id);
  const visible = role === "pengajar" || role === "admin" ? tambahan : tambahan.filter((d: any) => d.is_public);
  const custom: Kajian[] = visible
    .filter((d: any) => !d.is_deleted)
    .map(
      (d: any) =>
        ({
          id: d.id,
          judul: d.judul,
          ustadz: d.ustadz,
          waktu: d.waktu,
          hari: d.hari,
          lokasi: d.lokasi,
          status: "aktif",
          kategori: "Kajian Rutin",
          deskripsi: d.deskripsi || "",
          cp_nama: d.cp_nama,
          cp_telepon: d.cp_telepon,
          is_custom: true,
          is_public: d.is_public,
        }) as Kajian,
    );
  const customIds = custom.map((c) => c.id);
  const dummy = DUMMY_KAJIAN.filter((d) => !customIds.includes(d.id) && !deletedIds.includes(d.id));
  return { kajian: [...dummy, ...custom], flyers, batal };
}

export interface DayEvent {
  kajian: Kajian;
  waktu: string;
  isRescheduled: boolean;
  batal?: KajianBatal;
}

/** Semua kajian pada satu tanggal, terurut berdasarkan jam mulai */
export function getEventsForDate(date: Date, data: KajianData): DayEvent[] {
  const dateStr = toDateStr(date);
  const events: DayEvent[] = [];
  for (const k of data.kajian) {
    if (!isKajianOnDate(k, date, data.flyers)) continue;
    const flyerWaktu = extractTimeFromFlyer(k, date, data.flyers);
    let waktu = k.waktu;
    if (flyerWaktu) {
      const m = flyerWaktu.match(/(\d{2}[.:]\s*\d{2}\s*-\s*\d{2}[.:]\s*\d{2}\s*(?:WIB)?)/i);
      if (m) waktu = m[1].trim();
    }
    events.push({
      kajian: k,
      waktu,
      isRescheduled: !!data.flyers.find((f) => f.kajian_id === k.id && f.tanggal_berlaku === dateStr),
      batal: data.batal.find((b) => b.kajian_id === k.id && b.tanggal === dateStr),
    });
  }
  events.sort((a, b) => getStartMinutes(a.waktu) - getStartMinutes(b.waktu));
  return events;
}
