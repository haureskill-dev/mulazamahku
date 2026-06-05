import { Feather, Ionicons, FontAwesome } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { Alert, ActivityIndicator, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { StorageService } from "@/services/storage";
import { useColors } from "@/hooks/useColors";
import { DUMMY_KAJIAN, PENGAJAR_PROFILES, ADMIN_KAJIAN_CONTACTS } from "@/services/dummyData";
import { OjekMuslimahModal } from "@/components/OjekMuslimahModal";
import { KajianTambahanService } from "@/services/kajianTambahanService";
import { Kajian } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  aktif: "Kajian Rutin",
  akan_datang: "Akan Datang",
  selesai: "Selesai",
  online: "Online",
};

const STATUS_COLOR: Record<string, string> = {
  aktif: "#C9A227",
  akan_datang: "#B07D2A",
  selesai: "#8A90A0",
  online: "#3A6EA8",
};

export default function KajianDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  
  const [kajian, setKajian] = useState<Kajian | null>(DUMMY_KAJIAN.find((k) => k.id === id) || null);
  const [loading, setLoading] = useState(!kajian);

  const [progress, setProgress] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [savedProgress, setSavedProgress] = useState("");
  const [ojekModalVisible, setOjekModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const PROGRESS_KEY = `@mulazamahku_progress_${id}`;

  useEffect(() => {
    StorageService.get<string>(PROGRESS_KEY).then((v) => {
      if (v) {
        setProgress(v);
        setSavedProgress(v);
      }
    });
  }, [id]);

  useEffect(() => {
    if (!kajian && id) {
      // Coba fetch dari Supabase (custom schedules)
      KajianTambahanService.getAll().then((data) => {
        const found = data.find(d => d.id === id);
        if (found) {
          setKajian({
            id: found.id,
            judul: found.judul,
            ustadz: found.ustadz,
            waktu: found.waktu,
            hari: found.hari,
            lokasi: found.lokasi,
            status: "aktif",
            deskripsi: found.deskripsi || "",
            kategori: "Kajian Rutin",
            cp_nama: found.cp_nama,
            cp_telepon: found.cp_telepon,
            is_custom: true,
          });
        }
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [id, kajian]);

  const handleSaveProgress = async () => {
    setIsSaving(true);
    await StorageService.set(PROGRESS_KEY, progress);
    setSavedProgress(progress);
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsSaving(false);
  };

  const handleDeleteCustom = () => {
    Alert.alert("Hapus Jadwal", "Anda yakin ingin menghapus jadwal tambahan ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          setIsDeleting(true);
          const { success, error } = await KajianTambahanService.delete(id);
          setIsDeleting(false);
          if (success) {
            router.back();
          } else {
            Alert.alert("Gagal Menghapus", error || "Terjadi kesalahan.");
          }
        }
      }
    ]);
  };

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!kajian) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>Kajian tidak ditemukan</Text>
        <Pressable onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.primary }]}>
          <Text style={{ color: "#FFF", fontFamily: "Inter_600SemiBold" }}>Kembali</Text>
        </Pressable>
      </View>
    );
  }

  const openMaps = async () => {
    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
      
      const query = encodeURIComponent(kajian.lokasi);
      const url = kajian.mapsUrl || `https://www.google.com/maps/search/?api=1&query=${query}`;

      if (Platform.OS === "web" && typeof window !== "undefined") {
        // Harus sinkron di web agar tidak diblokir popup blocker
        window.open(url, "_blank");
        return;
      }
      
      await Linking.openURL(url);
    } catch (error) {
      console.error("Gagal membuka Maps:", error);
    }
  };

  const openAdminWhatsApp = async () => {
    if (kajian.is_custom && kajian.cp_telepon) {
      let phone = kajian.cp_telepon.replace(/\D/g, "");
      if (phone.startsWith("0")) phone = "62" + phone.slice(1);
      const message = `Bismillah. Afwan admin ${kajian.cp_nama || ""}, saya ingin bertanya terkait kajian ${kajian.judul} bersama ${kajian.ustadz}.`;
      
      if (Platform.OS === "android") {
        const intentUrl = `intent://send?phone=${phone}&text=${encodeURIComponent(message)}#Intent;package=com.whatsapp;scheme=whatsapp;end;`;
        try {
          await Linking.openURL(intentUrl);
          return;
        } catch (e) {
          // Fallback
        }
      }
      
      const webUrl = `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`;
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.open(webUrl, "_blank");
        return;
      }
      await Linking.openURL(webUrl).catch((err) => console.error(err));
      return;
    }

    const cp = ADMIN_KAJIAN_CONTACTS.find((c) => 
      kajian.lokasi.toLowerCase().includes(c.lokasi.toLowerCase()) || 
      c.lokasi.toLowerCase().includes(kajian.lokasi.toLowerCase())
    );
    
    if (!cp) {
      if (Platform.OS === "web") {
        window.alert("Info: Kontak admin untuk lokasi ini belum tersedia.");
      } else {
        Alert.alert("Info", "Kontak admin untuk lokasi ini belum tersedia.");
      }
      return;
    }
    
    const message = `Bismillah. Afwan, apakah ada update untuk jadwal kajian ${kajian.judul} di ${kajian.lokasi}?`;
    
    if (Platform.OS === "android") {
      const intentUrl = `intent://send?phone=${cp.phone}&text=${encodeURIComponent(message)}#Intent;package=com.whatsapp;scheme=whatsapp;end;`;
      try {
        await Linking.openURL(intentUrl);
        return;
      } catch (e) {
        // Fallback to api.whatsapp.com
      }
    }
    
    const webUrl = `https://api.whatsapp.com/send?phone=${cp.phone}&text=${encodeURIComponent(message)}`;
    if (Platform.OS === "web" && typeof window !== "undefined") {
      window.open(webUrl, "_blank");
      return;
    }
    await Linking.openURL(webUrl).catch((err) => console.error(err));
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.topBar,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 8,
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backBtnSmall} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.topBarTitle, { color: colors.foreground }]} numberOfLines={1}>
          Detail Kajian
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroSection, { backgroundColor: colors.primary }]}>
          <View style={styles.heroTop}>
            <View style={[styles.statusBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
              <Text style={styles.statusText}>{STATUS_LABEL[kajian.status]}</Text>
            </View>
            <View style={[styles.kategori, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <Text style={styles.kategoriText}>{kajian.kategori}</Text>
            </View>
          </View>
          <Text style={styles.heroJudul}>{kajian.judul}</Text>
          <Pressable
            onPress={() => {
              const p = PENGAJAR_PROFILES.find((pr) => kajian.ustadz.includes(pr.nama));
              if (p) router.push(`/pengajar/${p.id}`);
            }}
          >
            <Text style={[styles.heroUstadz, { textDecorationLine: "underline" }]}>{kajian.ustadz}</Text>
          </Pressable>
        </View>

        <View style={styles.infoSection}>
          <InfoRow icon="clock" label="Hari & Waktu" value={`${kajian.hari} · ${kajian.waktu}`} colors={colors} />
          <InfoRow icon="map-pin" label="Lokasi" value={kajian.lokasi} colors={colors} />
          <InfoRow icon="tag" label="Kategori" value={kajian.kategori} colors={colors} />
        </View>

        <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.descTitle, { color: colors.foreground }]}>Tentang Kajian</Text>
          <Text style={[styles.descText, { color: colors.mutedForeground }]}>{kajian.deskripsi}</Text>
        </View>

        <View style={[styles.descCard, { backgroundColor: colors.surface, borderColor: colors.border, marginTop: 0 }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
            <Feather name="book-open" size={18} color={colors.primary} />
            <Text style={[styles.descTitle, { color: colors.foreground, marginBottom: 0 }]}>
              Progres Materi
            </Text>
          </View>
          
          {(user?.role === "pengajar" || user?.role === "admin") ? (
            <>
              <Text style={[styles.descText, { color: colors.mutedForeground, marginBottom: 12 }]}>
                Catat sampai mana materi atau halaman kitab yang telah diajarkan pada kajian ini.
              </Text>
              <TextInput
                value={progress}
                onChangeText={setProgress}
                placeholder="Contoh: Bab Thaharah, Halaman 45"
                placeholderTextColor={colors.mutedForeground}
                style={[
                  styles.progressInput,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    color: colors.foreground,
                  },
                ]}
                multiline
              />
              <Pressable
                onPress={handleSaveProgress}
                disabled={isSaving || progress === savedProgress}
                style={({ pressed }) => [
                  styles.saveBtn,
                  {
                    backgroundColor: progress === savedProgress ? colors.muted : colors.primary,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text
                    style={[
                      styles.saveBtnText,
                      { color: progress === savedProgress ? colors.mutedForeground : "#FFF" },
                    ]}
                  >
                    {progress === savedProgress && progress ? "Tersimpan" : "Simpan Progres"}
                  </Text>
                )}
              </Pressable>
            </>
          ) : (
            <Text style={[styles.descText, { color: savedProgress ? colors.foreground : colors.mutedForeground, fontStyle: savedProgress ? "normal" : "italic" }]}>
              {savedProgress || "Belum ada informasi progres materi."}
            </Text>
          )}
        </View>

        {kajian.status !== "online" && (
          <View style={styles.actionButtonsRow}>
            <Pressable
              onPress={openMaps}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <Feather name="map" size={20} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>Rute Lokasi</Text>
            </Pressable>

            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setOjekModalVisible(true);
              }}
              style={({ pressed }) => [
                styles.actionBtn,
                {
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              <Feather name="navigation" size={20} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Ojek Muslimah</Text>
            </Pressable>
          </View>
        )}

        {/* Tampilkan CP untuk semua user agar murid bisa bertanya */}
        <View style={{ marginTop: 8, paddingHorizontal: 20, alignItems: "center" }}>
          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openAdminWhatsApp();
            }}
            style={({ pressed }) => [
              {
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#25D366", // Warna hijau khas WhatsApp
                paddingVertical: 12,
                paddingHorizontal: 24,
                borderRadius: 24,
                gap: 10,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <FontAwesome name="whatsapp" size={20} color="#FFFFFF" />
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontFamily: "Inter_600SemiBold" }}>
              Hubungi CP Kajian
            </Text>
          </Pressable>
        </View>

        {(user?.role === "pengajar" || user?.role === "admin") && (
          <View style={{ marginTop: 8 }}>
            {kajian.is_custom && (
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <Pressable
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/kajian/edit/${kajian.id}`);
                  }}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    {
                      backgroundColor: "#4B5563",
                      opacity: pressed ? 0.7 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      flex: 1,
                    },
                  ]}
                >
                  <Feather name="edit-2" size={20} color="#FFFFFF" />
                  <Text style={styles.actionBtnText}>Edit</Text>
                </Pressable>

                <Pressable
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    handleDeleteCustom();
                  }}
                  disabled={isDeleting}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    {
                      backgroundColor: "#EF4444",
                      opacity: pressed || isDeleting ? 0.7 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      flex: 1,
                    },
                  ]}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <Feather name="trash-2" size={20} color="#FFFFFF" />
                      <Text style={styles.actionBtnText}>Hapus</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}
          </View>
        )}

        {kajian.status === "online" && (
          <View style={[styles.onlineInfo, { backgroundColor: colors.highlight, borderColor: colors.primary }]}>
            <Ionicons name="videocam-outline" size={20} color={colors.primary} />
            <Text style={[styles.onlineText, { color: colors.primary }]}>
              Kajian ini diselenggarakan secara online
            </Text>
          </View>
        )}
      </ScrollView>

      <OjekMuslimahModal
        visible={ojekModalVisible}
        onClose={() => setOjekModalVisible(false)}
        defaultTujuan={kajian.lokasi}
      />
    </View>
  );
}

interface InfoRowProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}

function InfoRow({ icon, label, value, colors }: InfoRowProps) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.infoIcon, { backgroundColor: colors.highlight }]}>
        <Feather name={icon} size={15} color={colors.primary} />
      </View>
      <View style={styles.infoText}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  backBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtnSmall: { padding: 4 },
  topBarTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  content: {},
  heroSection: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  heroTop: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 14,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  kategori: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  kategoriText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.9)",
  },
  heroJudul: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginBottom: 6,
    lineHeight: 30,
  },
  heroUstadz: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
  },
  infoSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 14,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  infoText: { flex: 1 },
  infoLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  descCard: {
    margin: 20,
    marginTop: 20,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
  },
  descTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  descText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
  },
  progressInput: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: "top",
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    marginBottom: 12,
  },
  saveBtn: {
    height: 44,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  actionButtonsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 40,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 72,
    borderRadius: 14,
  },
  actionBtnText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
    textAlign: "center",
  },
  onlineInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    marginBottom: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  onlineText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
});
