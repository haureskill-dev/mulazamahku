import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Linking,
  AppState,
} from "react-native";
import * as Notifications from "expo-notifications";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { WebNotificationService } from "@/services/webNotificationService";
import { scheduleAllKajianReminders } from "@/services/notificationService";
import { registerPushToken } from "@/services/pushTokenService";

/**
 * Pop-up otomatis saat notifikasi belum terhubung / belum diizinkan.
 * Muncul ketika user sudah masuk dan izin notifikasi belum "granted".
 */
export function NotificationPromptModal() {
  const colors = useColors();
  const { user } = useAuth();
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [blockedHint, setBlockedHint] = useState(false);

  const checkPermission = useCallback(async () => {
    if (!user || dismissed) return;

    if (Platform.OS === "web") {
      if (!WebNotificationService.isSupported()) return;
      const perm = WebNotificationService.getPermission();
      if (perm !== "granted") {
        setVisible(true);
      } else {
        setVisible(false);
      }
      return;
    }

    try {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        setVisible(true);
      } else {
        setVisible(false);
      }
    } catch {}
  }, [user, dismissed]);

  useEffect(() => {
    if (!user) {
      setVisible(false);
      setDismissed(false);
      return;
    }
    const timer = setTimeout(checkPermission, 1000);
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") checkPermission();
    });
    return () => {
      clearTimeout(timer);
      sub.remove();
    };
  }, [user, checkPermission]);

  const handleActivate = async () => {
    if (Platform.OS === "web") {
      const current = WebNotificationService.getPermission();
      if (current === "denied") {
        setBlockedHint(true);
        return;
      }
      const granted = await WebNotificationService.requestPermission();
      if (granted) {
        setVisible(false);
        WebNotificationService.notify(
          "✅ Notifikasi Aktif",
          "Anda akan menerima pengingat jadwal kajian & info terbaru Mulazamahku."
        );
      } else if (WebNotificationService.getPermission() === "denied") {
        setBlockedHint(true);
      }
      return;
    }

    try {
      const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
      if (status === "granted") {
        setVisible(false);
        if (user) {
          scheduleAllKajianReminders(user.role).catch(() => {});
          registerPushToken(user.role, user.nama).catch(() => {});
        }
      } else if (!canAskAgain) {
        Linking.openSettings().catch(() => {});
      }
    } catch {}
  };

  const handleLater = () => {
    setDismissed(true);
    setVisible(false);
  };

  if (!visible || !user) return null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleLater}>
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          {/* Ikon info melingkar */}
          <View style={styles.iconCircle}>
            <Text style={styles.iconLetter}>i</Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Aktifkan Notifikasi
          </Text>

          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Izinkan notifikasi untuk menerima pemberitahuan penting seperti pengingat jadwal kajian, info flyer terbaru, dan perubahan jadwal.
          </Text>

          {blockedHint && (
            <View
              style={[
                styles.hintBox,
                { backgroundColor: colors.highlight, borderColor: colors.border },
              ]}
            >
              <Feather name="alert-circle" size={14} color={colors.accentText} />
              <Text style={[styles.hintText, { color: colors.foreground }]}>
                Izin notifikasi sedang diblokir browser. Klik ikon gembok/info di samping alamat web, ubah Notifikasi ke "Izinkan", lalu muat ulang halaman.
              </Text>
            </View>
          )}

          <View style={styles.btnRow}>
            <Pressable
              onPress={handleLater}
              style={({ pressed }) => [
                styles.laterBtn,
                {
                  backgroundColor: colors.isDark ? colors.muted : "#E5E7EB",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Text
                style={[
                  styles.laterText,
                  { color: colors.isDark ? colors.foreground : "#374151" },
                ]}
              >
                Nanti
              </Text>
            </Pressable>

            <Pressable
              onPress={handleActivate}
              style={({ pressed }) => [
                styles.activateBtn,
                { opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Text style={styles.activateText}>Aktifkan</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.48)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 3,
    borderColor: "#38BDF8",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  iconLetter: {
    fontSize: 32,
    fontFamily: "Inter_600SemiBold",
    color: "#38BDF8",
    lineHeight: 36,
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 13.5,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 22,
  },
  hintBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 16,
    width: "100%",
  },
  hintText: {
    flex: 1,
    fontSize: 11.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  laterBtn: {
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 8,
    minWidth: 88,
    alignItems: "center",
  },
  laterText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  activateBtn: {
    paddingHorizontal: 22,
    paddingVertical: 11,
    borderRadius: 8,
    minWidth: 104,
    alignItems: "center",
    backgroundColor: "#F05252",
  },
  activateText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
});
