import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useColors } from "@/hooks/useColors";
import { DUMMY_KAJIAN, OJEK_CONTACTS } from "@/services/dummyData";

// Lokasi unik dari semua kajian
const LOKASI_KAJIAN = Array.from(
  new Set(DUMMY_KAJIAN.filter((k) => k.status === "aktif").map((k) => k.lokasi))
);

interface OjekMuslimahModalProps {
  visible: boolean;
  onClose: () => void;
  /** Pre-fill lokasi tujuan, misal dari halaman detail kajian */
  defaultTujuan?: string;
}

export function OjekMuslimahModal({
  visible,
  onClose,
  defaultTujuan,
}: OjekMuslimahModalProps) {
  const colors = useColors();
  const [step, setStep] = useState<"pilih_tujuan" | "pilih_driver">("pilih_tujuan");
  const [tujuan, setTujuan] = useState(defaultTujuan ?? "");
  const [customTujuan, setCustomTujuan] = useState("");

  const resetAndClose = () => {
    setStep("pilih_tujuan");
    setTujuan(defaultTujuan ?? "");
    setCustomTujuan("");
    onClose();
  };

  const selectTujuan = (lokasi: string) => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTujuan(lokasi);
    setStep("pilih_driver");
  };

  const confirmCustomTujuan = () => {
    if (!customTujuan.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTujuan(customTujuan.trim());
    setStep("pilih_driver");
  };

  const openWhatsApp = async (phone: string, nama: string) => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const pesan = encodeURIComponent(
      `Assalamu'alaikum ${nama},\n\nSaya ingin pesan ojek ke:\n📍 ${tujuan}\n\nMohon infonya, apakah bisa? Jazakillahu khairan.`
    );

    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${pesan}`, "_blank");
    } else if (Platform.OS === "android") {
      // Intent URI langsung ke WhatsApp biasa (com.whatsapp), bukan WA Business
      const intentUrl = `intent://send?phone=${phone}&text=${pesan}#Intent;scheme=whatsapp;package=com.whatsapp;end`;
      try {
        await Linking.openURL(intentUrl);
      } catch {
        // Fallback jika WA biasa tidak terinstall
        await Linking.openURL(`https://api.whatsapp.com/send?phone=${phone}&text=${pesan}`);
      }
    } else {
      // iOS
      await Linking.openURL(`https://api.whatsapp.com/send?phone=${phone}&text=${pesan}`);
    }

    resetAndClose();
  };

  // Jika dari detail kajian, langsung ke pilih driver
  React.useEffect(() => {
    if (visible && defaultTujuan) {
      setTujuan(defaultTujuan);
      setStep("pilih_driver");
    } else if (visible) {
      setStep("pilih_tujuan");
      setTujuan("");
      setCustomTujuan("");
    }
  }, [visible, defaultTujuan]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={resetAndClose}
    >
      <Pressable style={styles.overlay} onPress={resetAndClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.card }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Handle bar */}
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

          {/* Header */}
          <View style={styles.header}>
            {step === "pilih_driver" && !defaultTujuan && (
              <Pressable
                onPress={() => {
                  setStep("pilih_tujuan");
                  if (Platform.OS !== "web")
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                hitSlop={8}
                style={styles.backBtn}
              >
                <Feather name="arrow-left" size={20} color={colors.foreground} />
              </Pressable>
            )}
            <View style={{ flex: 1 }}>
              <View style={styles.headerTitleRow}>
                <View style={[styles.headerIcon, { backgroundColor: colors.highlight }]}>
                  <Feather name="navigation" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Ojek Muslimah
                </Text>
              </View>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {step === "pilih_tujuan"
                  ? "Pilih tujuan perjalanan Anda"
                  : `Tujuan: ${tujuan}`}
              </Text>
            </View>
            <Pressable onPress={resetAndClose} hitSlop={8}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* ── Step 1: Pilih Tujuan ─────────────────────────── */}
          {step === "pilih_tujuan" && (
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                LOKASI KAJIAN
              </Text>
              {LOKASI_KAJIAN.map((lok) => (
                <Pressable
                  key={lok}
                  onPress={() => selectTujuan(lok)}
                  style={({ pressed }) => [
                    styles.lokasiItem,
                    {
                      backgroundColor: pressed ? colors.highlight : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.lokasiIcon, { backgroundColor: colors.highlight }]}>
                    <Feather name="map-pin" size={14} color={colors.primary} />
                  </View>
                  <Text
                    style={[styles.lokasiText, { color: colors.foreground }]}
                    numberOfLines={1}
                  >
                    {lok}
                  </Text>
                  <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                </Pressable>
              ))}

              <Text
                style={[
                  styles.sectionLabel,
                  { color: colors.mutedForeground, marginTop: 20 },
                ]}
              >
                ATAU KETIK TUJUAN LAIN
              </Text>
              <View style={styles.customRow}>
                <TextInput
                  value={customTujuan}
                  onChangeText={setCustomTujuan}
                  placeholder="Misal: Rumah, Stasiun, dll."
                  placeholderTextColor={colors.mutedForeground}
                  style={[
                    styles.customInput,
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      color: colors.foreground,
                    },
                  ]}
                />
                <Pressable
                  onPress={confirmCustomTujuan}
                  disabled={!customTujuan.trim()}
                  style={({ pressed }) => [
                    styles.customSendBtn,
                    {
                      backgroundColor: customTujuan.trim()
                        ? colors.primary
                        : colors.muted,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Feather
                    name="arrow-right"
                    size={18}
                    color={customTujuan.trim() ? "#FFF" : colors.mutedForeground}
                  />
                </Pressable>
              </View>
            </ScrollView>
          )}

          {/* ── Step 2: Pilih Driver ─────────────────────────── */}
          {step === "pilih_driver" && (
            <ScrollView
              style={styles.scrollBody}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.tujuanBanner,
                  { backgroundColor: colors.highlight, borderColor: colors.border },
                ]}
              >
                <Feather name="map-pin" size={16} color={colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.tujuanLabel, { color: colors.mutedForeground }]}>
                    Tujuan
                  </Text>
                  <Text style={[styles.tujuanValue, { color: colors.foreground }]}>
                    {tujuan}
                  </Text>
                </View>
              </View>

              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>
                PILIH DRIVER
              </Text>

              {OJEK_CONTACTS.map((driver) => (
                <Pressable
                  key={driver.id}
                  onPress={() => openWhatsApp(driver.phone, driver.nama)}
                  style={({ pressed }) => [
                    styles.driverCard,
                    {
                      backgroundColor: pressed ? colors.highlight : colors.surface,
                      borderColor: colors.border,
                    },
                  ]}
                >
                  <View style={[styles.driverAvatar, { backgroundColor: "#25D366" }]}>
                    <Feather name="message-circle" size={18} color="#FFF" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.driverName, { color: colors.foreground }]}>
                      {driver.nama}
                    </Text>
                    <Text style={[styles.driverPhone, { color: colors.mutedForeground }]}>
                      +{driver.phone.replace(/^62/, "62 ")}
                    </Text>
                  </View>
                  <View style={[styles.waBtn, { backgroundColor: "#25D366" }]}>
                    <Feather name="send" size={14} color="#FFF" />
                  </View>
                </Pressable>
              ))}

              <Text
                style={[
                  styles.footerNote,
                  { color: colors.mutedForeground },
                ]}
              >
                Pesan akan dikirim via WhatsApp dengan tujuan yang sudah terisi otomatis.
              </Text>
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "85%",
    minHeight: 320,
    paddingBottom: Platform.OS === "web" ? 24 : 34,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  backBtn: {
    padding: 4,
    marginTop: 4,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  headerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginLeft: 44,
  },

  // Scroll
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  // Section
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 4,
  },

  // Lokasi Items
  lokasiItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  lokasiIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  lokasiText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },

  // Custom input
  customRow: {
    flexDirection: "row",
    gap: 10,
  },
  customInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: "Inter_400Regular",
    fontSize: 14,
  },
  customSendBtn: {
    width: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  // Tujuan banner
  tujuanBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  tujuanLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 1,
  },
  tujuanValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },

  // Driver cards
  driverCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    gap: 14,
  },
  driverAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  driverName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  driverPhone: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  waBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  // Footer
  footerNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 12,
    lineHeight: 18,
  },
});
