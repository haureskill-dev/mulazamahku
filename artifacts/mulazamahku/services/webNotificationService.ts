/**
 * Web Notification Service — mendukung notifikasi browser (seperti WA Web / QLC).
 * Meminta izin kepada user saat pertama kali dibuka di web, dan dapat menampilkan
 * notifikasi kajian serta reminder.
 */
import { Platform } from "react-native";

const STORAGE_KEY = "@mulazamahku_web_notif_asked";

export const WebNotificationService = {
  isSupported(): boolean {
    return Platform.OS === "web" && typeof window !== "undefined" && "Notification" in window;
  },

  getPermission(): NotificationPermission | "unsupported" {
    if (!this.isSupported()) return "unsupported";
    return Notification.permission;
  },

  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      const permission = await Notification.requestPermission();
      try {
        localStorage.setItem(STORAGE_KEY, "true");
      } catch {}
      return permission === "granted";
    } catch (e) {
      console.warn("[WebNotif] Gagal meminta izin notifikasi:", e);
      return false;
    }
  },

  async maybeRequestOnFirstVisit(): Promise<void> {
    if (!this.isSupported()) return;
    try {
      if (Notification.permission === "default") {
        // Tampilkan dialog izin setelah jeda singkat agar tidak mengagetkan user
        setTimeout(async () => {
          await this.requestPermission();
        }, 1500);
      }
    } catch {}
  },

  notify(title: string, body: string, data?: any): boolean {
    if (!this.isSupported()) return false;
    if (Notification.permission !== "granted") return false;
    try {
      const notif = new Notification(title, {
        body,
        icon: "/favicon.ico",
        badge: "/favicon.ico",
        data,
      });
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
      return true;
    } catch (e) {
      console.warn("[WebNotif] Gagal memicu notifikasi:", e);
      return false;
    }
  },
};
