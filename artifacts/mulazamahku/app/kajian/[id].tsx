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
import { KajianBatalService, KajianBatal } from "@/services/kajianBatalService";
import { ProgressService } from "@/services/progressService";
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

  const [batalList, setBatalList] = useState<KajianBatal[]>([]);
  const [batalModalVisible, setBatalModalVisible] = useState(false);
  const [batalDate, setBatalDate] = useState(() => {
    const d = new Date();
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  });
  const [batalAlasan, setBatalAlasan] = useState("");
  const [isSubmittingBatal, setIsSubmittingBatal] = useState(false);

  useEffect(() => {
    if (id) {
      ProgressService.get(id as string).then((v) => {
        if (v) {
          setProgress(v);
          setSavedProgress(v);
        }
      });
    }
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

  useEffect(() => {
    if (id) {
      KajianBatalService.getAll().then((data) => {
        setBatalList(data.filter(d => d.kajian_id === id));
      });
    }
  }, [id]);

  const handleSaveProgress = async () => {
    setIsSaving(true);
    await ProgressService.set(id as string, progress);
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

  const handleBatalSubmit = async () => {
    if (!batalDate || !batalAlasan) return;
    
    // Parse DD/MM/YYYY to YYYY-MM-DD for Supabase
    const parts = batalDate.split("/");
    if (parts.length !== 3) {
      Alert.alert("Format Salah", "Gunakan format tanggal DD/MM/YYYY (contoh: 10/06/2026)");
      return;
    }
    const isoDate = `${parts[2]}-${parts[1]}-${parts[0]}`;

    setIsSubmittingBatal(true);
    const success = await KajianBatalService.insert({
      kajian_id: id as string,
      tanggal: isoDate,
      alasan: batalAlasan
    });
    setIsSubmittingBatal(false);
    if (success) {
      setBatalModalVisible(false);
      setBatalAlasan("");
      const newData = await KajianBatalService.getAll();
      setBatalList(newData.filter(d => d.kajian_id === id));
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Alert.alert("Error", "Gagal menambahkan info pembatalan.");
    }
  };

  const handleDeleteBatal = async (batalId: string) => {
    Alert.alert("Hapus Info", "Hapus info pembatalan ini?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: async () => {
        await KajianBatalService.delete(batalId);
        const newData = await KajianBatalService.getAll();
        setBatalList(newData.filter(d => d.kajian_id === id));
      }}
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
            paddingTop: insets.top + 8,
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
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {batalList.map(b => {
          const today = new Date();
          today.setHours(0,0,0,0);
          if (new Date(b.tanggal) < today) return null;
          
          // Format YYYY-MM-DD to DD/MM/YYYY
          const dateParts = b.tanggal.split("-");
          const displayDate = dateParts.length === 3 ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}` : b.tanggal;

          return (
            <View key={b.id} style={{ backgroundColor: "#FEF2F2", padding: 16, borderBottomWidth: 1, borderBottomColor: "#FEE2E2" }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1 }}>
                  <Feather name="alert-circle" size={20} color="#EF4444" />
                  <Text style={{ fontFamily: "Inter_700Bold", color: "#EF4444", fontSize: 15, flex: 1 }}>
                    Dibatalkan pada {displayDate}
                  </Text>
                </View>
                {(user?.role === "admin" || user?.role === "pengajar") && (
                  <Pressable onPress={() => handleDeleteBatal(b.id)} hitSlop={10}>
                    <Feather name="x" size={20} color="#EF4444" />
                  </Pressable>
                )}
              </View>
              <Text style={{ fontFamily: "Inter_500Medium", color: "#991B1B", marginTop: 4, marginLeft: 28 }}>
                Alasan: {b.alasan}
              </Text>
            </View>
          );
        })}

        <View style={[styles.heroSection, { backgroundColor: colors.primary }]}>
          <View style={[styles.heroTop, { justifyContent: "space-between" }]}>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <View style={[styles.statusBadge, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                <Text style={styles.statusText}>{STATUS_LABEL[kajian.status]}</Text>
              </View>
              <View style={[styles.kategori, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                <Text style={styles.kategoriText}>{kajian.kategori}</Text>
              </View>
            </View>

            {(user?.role === "pengajar" || user?.role === "admin") && (
              <View style={{ flexDirection: "row", gap: 16, alignItems: "center" }}>
                <Pressable
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/kajian/edit/${kajian.id}`);
                  }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
                  hitSlop={8}
                >
                  <Feather name="edit-2" size={20} color="#FFFFFF" />
                </Pressable>

                <Pressable
                  onPress={handleDeleteCustom}
                  style={({ pressed }) => [{ opacity: pressed || isDeleting ? 0.6 : 1 }]}
                  disabled={isDeleting}
                  hitSlop={8}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#FF6B6B" />
                  ) : (
                    <Feather name="trash-2" size={20} color="#FF6B6B" />
                  )}
                </Pressable>
              </View>
            )}
          </View>
          <Text style={styles.heroJudul}>{kajian.judul}</Text>
          <Pressable
            onPress={() => {
              if (user?.role !== "admin" && user?.role !== "pengajar") return;
              const p = PENGAJAR_PROFILES.find((pr) => kajian.ustadz.includes(pr.nama));
              if (p) router.push(`/pengajar/${p.id}`);
            }}
          >
            <Text style={[styles.heroUstadz, (user?.role === "admin" || user?.role === "pengajar") && { textDecorationLine: "underline" }]}>
              {kajian.ustadz}
            </Text>
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
                  scrollEnabled={false}
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

        <View style={styles.actionBar}>
          {kajian.status !== "online" && (
            <>
              <ActionIcon 
                icon="map" 
                label="Rute" 
                color={colors.primary} 
                bgColor="rgba(201,162,39,0.15)" 
                onPress={openMaps} 
              />
              <ActionIcon 
                icon="navigation" 
                label="Ojek" 
                color="#3A6EA8" 
                bgColor="rgba(58,110,168,0.15)" 
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setOjekModalVisible(true);
                }} 
              />
            </>
          )}

          <ActionIcon 
            icon="whatsapp" 
            isFontAwesome 
            label="Tanya CP" 
            color="#25D366" 
            bgColor="rgba(37,211,102,0.15)" 
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              openAdminWhatsApp();
            }} 
          />

          {(user?.role === "pengajar" || user?.role === "admin") && (
            <ActionIcon 
              icon="alert-triangle" 
              label="Batal/Udzur" 
              color="#F59E0B" 
              bgColor="rgba(245,158,11,0.15)" 
              onPress={() => setBatalModalVisible(true)} 
            />
          )}
        </View>



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

      {batalModalVisible && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 }]}>
          <View style={{ backgroundColor: colors.card, padding: 24, borderRadius: 16, width: "100%", maxWidth: 400 }}>
            <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: colors.foreground, marginBottom: 16 }}>Info Pembatalan Kajian</Text>
            
            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.foreground, marginBottom: 8 }}>Tanggal (DD/MM/YYYY)</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.foreground, fontFamily: "Inter_400Regular", marginBottom: 16 }}
              value={batalDate}
              onChangeText={setBatalDate}
              placeholder="Contoh: 10/06/2026"
              placeholderTextColor={colors.mutedForeground}
            />

            <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.foreground, marginBottom: 8 }}>Alasan Batal / Udzur</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, color: colors.foreground, fontFamily: "Inter_400Regular", marginBottom: 24, minHeight: 80, textAlignVertical: "top" }}
              value={batalAlasan}
              onChangeText={setBatalAlasan}
              placeholder="Contoh: Ustadzah sedang safar"
              placeholderTextColor={colors.mutedForeground}
              multiline
            />

            <View style={{ flexDirection: "row", gap: 12 }}>
              <Pressable
                onPress={() => setBatalModalVisible(false)}
                style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: colors.highlight, alignItems: "center" }}
              >
                <Text style={{ fontFamily: "Inter_600SemiBold", color: colors.foreground }}>Tutup</Text>
              </Pressable>
              <Pressable
                onPress={handleBatalSubmit}
                disabled={isSubmittingBatal || !batalDate || !batalAlasan}
                style={{ flex: 1, padding: 14, borderRadius: 8, backgroundColor: "#EF4444", alignItems: "center", opacity: isSubmittingBatal || !batalDate || !batalAlasan ? 0.5 : 1 }}
              >
                {isSubmittingBatal ? <ActivityIndicator size="small" color="#FFF" /> : <Text style={{ fontFamily: "Inter_600SemiBold", color: "#FFF" }}>Simpan Info</Text>}
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Helper Components ────────────────────────────────────────────────────

function ActionIcon({ icon, isFontAwesome, label, color, bgColor, onPress }: any) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        { alignItems: "center", opacity: pressed ? 0.7 : 1, width: 75 }
      ]}
    >
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: bgColor, alignItems: "center", justifyContent: "center", marginBottom: 8 }}>
        {isFontAwesome ? (
          <FontAwesome name={icon} size={24} color={color} />
        ) : (
          <Feather name={icon} size={24} color={color} />
        )}
      </View>
      <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: color, textAlign: "center", lineHeight: 14 }}>{label}</Text>
    </Pressable>
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
    <View style={[styles.infoRow]}>
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
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "flex-start",
    paddingHorizontal: 10,
    marginTop: 24,
    marginBottom: 8,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  actionBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
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
