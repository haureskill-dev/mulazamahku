/**
 * Utilitas tanggal Masehi & Hijriah.
 *
 * Hijriah memakai Intl (kalender Umm al-Qura) bila tersedia — misalnya di
 * browser. Di perangkat yang Intl-nya tidak mendukung kalender islami
 * (sebagian Hermes/Android), otomatis jatuh ke algoritma tabular (Kuwaiti).
 */

export const HIJRI_MONTHS = [
  "Muharram",
  "Safar",
  "Rabiul Awal",
  "Rabiul Akhir",
  "Jumadil Awal",
  "Jumadil Akhir",
  "Rajab",
  "Sya'ban",
  "Ramadhan",
  "Syawal",
  "Dzulqa'dah",
  "Dzulhijjah",
];

export const HIJRI_MONTHS_AR = [
  "مُحَرَّم",
  "صَفَر",
  "رَبِيع الأَوَّل",
  "رَبِيع الآخِر",
  "جُمَادَى الأُولَى",
  "جُمَادَى الآخِرَة",
  "رَجَب",
  "شَعْبَان",
  "رَمَضَان",
  "شَوَّال",
  "ذُو القَعْدَة",
  "ذُو الحِجَّة",
];

export const MASEHI_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const HARI = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export interface HijriDate {
  day: number;
  month: number; // 1–12
  year: number;
}

// ── Algoritma tabular (fallback) ───────────────────────────────────────────
function gregorianToJD(y: number, m: number, d: number): number {
  if (m < 3) {
    y -= 1;
    m += 12;
  }
  const a = Math.floor(y / 100);
  const b = 2 - a + Math.floor(a / 4);
  return Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524.5;
}

function islamicToJD(y: number, m: number, d: number): number {
  return d + Math.ceil(29.5 * (m - 1)) + (y - 1) * 354 + Math.floor((3 + 11 * y) / 30) + 1948439.5 - 1;
}

function tabularHijri(date: Date): HijriDate {
  const jd = Math.floor(gregorianToJD(date.getFullYear(), date.getMonth() + 1, date.getDate())) + 0.5;
  const year = Math.floor((30 * (jd - 1948439.5) + 10646) / 10631);
  const month = Math.min(12, Math.ceil((jd - (29 + islamicToJD(year, 1, 1))) / 29.5) + 1);
  const day = jd - islamicToJD(year, month, 1) + 1;
  return { day: Math.round(day), month, year };
}

// ── Intl (Umm al-Qura) ──────────────────────────────────────────────────────
let intlFormatter: Intl.DateTimeFormat | null | undefined;
function getIntlFormatter(): Intl.DateTimeFormat | null {
  if (intlFormatter !== undefined) return intlFormatter;
  try {
    intlFormatter = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
      day: "numeric",
      month: "numeric",
      year: "numeric",
    });
  } catch {
    intlFormatter = null;
  }
  return intlFormatter;
}

function intlHijri(date: Date): HijriDate | null {
  const fmt = getIntlFormatter();
  if (!fmt || typeof (fmt as any).formatToParts !== "function") return null;
  try {
    const parts = fmt.formatToParts(date);
    const get = (t: string) => parseInt(parts.find((p) => p.type === t)?.value ?? "", 10);
    const day = get("day");
    const month = get("month");
    const year = get("year");
    if (!day || !month || !year) return null;
    // Validasi: harus benar-benar tahun Hijriah, bukan Masehi
    if (year < 1300 || year > 1700 || month < 1 || month > 12 || day < 1 || day > 30) return null;
    return { day, month, year };
  } catch {
    return null;
  }
}

const cache = new Map<string, HijriDate>();

export function toHijri(date: Date): HijriDate {
  const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  const hit = cache.get(key);
  if (hit) return hit;
  const tab = tabularHijri(date);
  const viaIntl = intlHijri(date);
  // Pakai Intl bila wajar (selisih ≤ 2 hari dari tabular)
  let result = tab;
  if (viaIntl && viaIntl.year === tab.year && viaIntl.month === tab.month && Math.abs(viaIntl.day - tab.day) <= 2) {
    result = viaIntl;
  } else if (viaIntl && Math.abs(viaIntl.month - tab.month) <= 1) {
    result = viaIntl;
  }
  cache.set(key, result);
  return result;
}

export function formatHijri(date: Date, withYear = true): string {
  const h = toHijri(date);
  return `${h.day} ${HIJRI_MONTHS[h.month - 1]}${withYear ? ` ${h.year} H` : ""}`;
}

export function formatMasehi(date: Date, withDay = true): string {
  const s = `${date.getDate()} ${MASEHI_MONTHS[date.getMonth()]} ${date.getFullYear()}`;
  return withDay ? `${HARI[date.getDay()]}, ${s}` : s;
}

export function toDateStr(date: Date): string {
  return (
    date.getFullYear() +
    "-" +
    String(date.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(date.getDate()).padStart(2, "0")
  );
}

/** Parse "YYYY-MM-DD" sebagai tanggal lokal (tanpa geser zona waktu). */
export function parseDateStr(s: string | null | undefined): Date | null {
  if (!s) return null;
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
}
