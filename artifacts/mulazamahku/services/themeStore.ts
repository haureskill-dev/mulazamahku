import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";

/**
 * Theme store — mode gelap/terang otomatis berdasarkan waktu.
 *
 * - "auto"  : terang pukul 06:00–17:59, gelap pukul 18:00–05:59 (default)
 * - "light" : selalu terang
 * - "dark"  : selalu gelap
 */
export type ThemeMode = "auto" | "light" | "dark";
export type ResolvedScheme = "light" | "dark";

const STORAGE_KEY = "@mulazamahku_theme_mode";
const DAY_START_HOUR = 6;
const NIGHT_START_HOUR = 18;

function schemeFromClock(date = new Date()): ResolvedScheme {
  const h = date.getHours();
  return h >= DAY_START_HOUR && h < NIGHT_START_HOUR ? "light" : "dark";
}

let mode: ThemeMode = "auto";
let scheme: ResolvedScheme = schemeFromClock();
let snapshot: { mode: ThemeMode; scheme: ResolvedScheme } = { mode, scheme };
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | null = null;

function emit() {
  snapshot = { mode, scheme };
  listeners.forEach((l) => l());
}

function recompute() {
  const next: ResolvedScheme = mode === "auto" ? schemeFromClock() : mode;
  if (next !== scheme) {
    scheme = next;
    emit();
  }
}

function ensureTimer() {
  if (timer) return;
  // Cek setiap 30 detik agar pergantian siang/malam terasa real-time
  timer = setInterval(recompute, 30_000);
}

// Muat preferensi tersimpan
AsyncStorage.getItem(STORAGE_KEY)
  .then((v) => {
    if (v === "auto" || v === "light" || v === "dark") {
      mode = v;
      scheme = mode === "auto" ? schemeFromClock() : mode;
      emit();
    }
  })
  .catch(() => {});

export function setThemeMode(next: ThemeMode) {
  mode = next;
  scheme = mode === "auto" ? schemeFromClock() : mode;
  emit();
  AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  ensureTimer();
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot() {
  return snapshot;
}

export function useThemeState() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

export function useIsDark() {
  return useThemeState().scheme === "dark";
}
