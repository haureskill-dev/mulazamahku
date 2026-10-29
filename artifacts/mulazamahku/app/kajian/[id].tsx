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
import { ProgressService, ProgressData } from "@/services/progressService";
import { RujukanService } from "@/services/rujukanService";
import { Kajian, RujukanKitab } from "@/types";
import { getNextOccurrences } from "@/utils/kajianSchedule";
import { formatHijri, formatMasehi, parseDateStr, toDateStr } from "@/utils/dates";

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
  const [progressUpdatedAt, setProgressUpdatedAt] = useState<string | null>(null);
  // Tanggal kajian berikutnya — dipilih manual oleh pengajar/admin (YYYY-MM-DD)
  const [tanggalKajian, setTanggalKajian] = useState<string | null>(null);
  const [savedTanggal, setSavedTanggal] = useState<string | null>(null);
  const [manualTanggal, setManualTanggal] = useState("");
  const [inputHeight, setInputHeight] = useState(80);
  const [ojekModalVisible, setOjekModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [rujukanList, setRujukanList] = useState<RujukanKitab[]>([]);

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
      ProgressService.get(id as string).then((data: ProgressData) => {
        if (data.progress) {
          setProgress(data.progress);
          setSavedProgress(data.progress);
        }
        if (data.updated_at) {
          setProgressUpdatedAt(data.updated_at);
        }
        if (data.tanggal_kajian) {
          setTanggalKajian(data.tanggal_kajian);
          setSavedTanggal(data.tanggal_kajian);
          const d = parseDateStr(data.tanggal_kajian);
          if (d) setManualTanggal(`${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`);
        }
      });
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      RujukanService.getRujukanByKajian(id as string).then((data) => {
        setRujukanList(data);
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

  const applyManualTanggal = (text: string) => {
    // Auto-format DD/MM/YYYY
    const digits = text.replace(/\D/g, "").slice(0, 8);
    let formatted = digits;
    if (digits.length > 4) formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
    else if (digits.length > 2) formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`;
    setManualTanggal(formatted);
    if (digits.length === 8) {
      const dd = parseInt(digits.slice(0, 2), 10);
      const mm = parseInt(digits.slice(2, 4), 10);
      const yyyy = parseInt(digits.slice(4), 10);
      const d = new Date(yyyy, mm - 1, dd);
      if (d.getDate() === dd && d.getMonth() === mm - 1) setTanggalKajian(toDateStr(d));
    } else if (digits.length === 0) {
      setTanggalKajian(null);
    }
  };

  const handleSaveProgress = async () => {
    setIsSaving(true);
    const ok = await ProgressService.set(id as string, progress, tanggalKajian);
    if (!ok) {
      setIsSaving(false);
      Alert.alert("Gagal", "Progres gagal disimpan. Periksa koneksi internet.");
      return;
    }
    setSavedProgress(progress);
    setSavedTanggal(tanggalKajian);
    setProgressUpdatedAt(new Date().toISOString());
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

    // Improved matching: try exact, then partial, then word-based matching
    const lokasiLower = kajian.lokasi.toLowerCase();
    const cp = ADMIN_KAJIAN_CONTACTS.find((c) => {
      const cpLower = c.lokasi.toLowerCase();
      // Exact match
      if (cpLower === lokasiLower) return true;
      // Partial includes (either direction)
      if (lokasiLower.includes(cpLower) || cpLower.includes(lokasiLower)) return true;
      // Word-based matching: split both into keywords and check overlap
      const lokasiWords = lokasiLower.split(/[\s,·\-]+/).filter(w => w.length > 2);
      const cpWords = cpLower.split(/[\s,·\-]+/).filter(w => w.length > 2);
      const overlap = lokasiWords.filter(w => cpWords.some(cw => cw.includes(w) || w.includes(cw)));
      return overlap.length >= 2;
    });
    
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

  const formatProgressDate = (isoDate: string | null) => {
    if (!isoDate) return null;
    try {
      const d = new Date(isoDate);
      const days = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
      const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
    } catch {
      return null;
    }
  };

  const openRujukanLink = async (url: string) => {
    try {
      if (Platform.OS === "web" && typeof window !== "undefined") {
        window.open(url, "_blank");
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      console.error("Gagal membuka link:", e);
    }
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
          { paddingBottom: insets.bottom + 120 },
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

        {/* ── Progres Belajar (Premium Card) ──────────────────── */}
        <View style={[styles.progressCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {/* Header */}
          <View style={[styles.progressHeader, { borderBottomColor: colors.border }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10, flex: 1 }}>
              <View style={[styles.progressIconWrap, { backgroundColor: colors.highlight }]}>
                <Feather name="book-open" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.progressHeaderTitle, { color: colors.foreground }]}>
                  Progres Belajar
                </Text>
                {savedTanggal ? (
                  <Text style={[styles.progressDateText, { color: colors.mutedForeground }]}>
                    Untuk kajian: {formatMasehi(parseDateStr(savedTanggal)!)}
                  </Text>
                ) : savedProgress ? (
                  <Text style={[styles.progressDateText, { color: colors.mutedForeground }]}>
                    Tanggal kajian belum ditentukan
                  </Text>
                ) : null}
              </View>
            </View>
            {savedTanggal && (
              <View style={[styles.progressDateBadge, { backgroundColor: "rgba(201,162,39,0.12)", borderColor: "rgba(201,162,39,0.3)" }]}>
                <Feather name="calendar" size={11} color={colors.gold} />
                <Text style={[styles.progressDateBadgeText, { color: colors.gold }]}>
                  {parseDateStr(savedTanggal)!.toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                </Text>
              </View>
            )}
          </View>

          {/* Body */}
          <View style={styles.progressBody}>
            {(user?.role === "pengajar" || user?.role === "admin") ? (
              <>
                <Text style={[styles.descText, { color: colors.mutedForeground, marginBottom: 12 }]}>
                  Catat sampai mana materi atau halaman kitab yang telah diajarkan, lalu pilih untuk kajian tanggal berapa materi ini dilanjutkan.
                </Text>

                {/* Pilih tanggal kajian berikutnya (manual) */}
                <Text style={[styles.progressDisplayLabel, { color: colors.foreground, marginBottom: 8 }]}>
                  Untuk kajian tanggal
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                  {getNextOccurrences(kajian, 4).map((d) => {
                    const ds = toDateStr(d);
                    const active = tanggalKajian === ds;
                    return (
                      <Pressable
                        key={ds}
                        onPress={() => {
                          if (Platform.OS !== "web") Haptics.selectionAsync();
                          setTanggalKajian(ds);
                          setManualTanggal(`${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`);
                        }}
                        style={({ pressed }) => [
                          styles.dateChip,
                          {
                            backgroundColor: active ? colors.primary : colors.background,
                            borderColor: active ? colors.primary : colors.border,
                            opacity: pressed ? 0.8 : 1,
                          },
                        ]}
                      >
                        <Text style={[styles.dateChipDay, { color: active ? "#FFF" : colors.foreground }]}>
                          {d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" })}
                        </Text>
                        <Text style={[styles.dateChipHijri, { color: active ? "rgba(255,255,255,0.75)" : colors.mutedForeground }]}>
                          {formatHijri(d, false)}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
                <View style={[styles.manualDateWrap, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Feather name="calendar" size={15} color={colors.mutedForeground} />
                  <TextInput
                    value={manualTanggal}
                    onChangeText={applyManualTanggal}
                    placeholder="Atau ketik manual: DD/MM/YYYY"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    maxLength={10}
                    style={[styles.manualDateInput, { color: colors.foreground }]}
                  />
                  {tanggalKajian && (
                    <Pressable onPress={() => { setTanggalKajian(null); setManualTanggal(""); }} hitSlop={8}>
                      <Feather name="x-circle" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  )}
                </View>
                {tanggalKajian && parseDateStr(tanggalKajian) && (
                  <Text style={[styles.progressDateSmall, { color: colors.gold, marginBottom: 12, marginTop: -4 }]}>
                    {formatMasehi(parseDateStr(tanggalKajian)!)} · {formatHijri(parseDateStr(tanggalKajian)!)}
                  </Text>
                )}

                <Text style={[styles.progressDisplayLabel, { color: colors.foreground, marginBottom: 8 }]}>
                  Materi sampai
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
                        height: Platform.OS === "web" ? Math.max(80, inputHeight) : undefined,
                      },
                    ]}
                    multiline
                    scrollEnabled={Platform.OS === "web" ? true : false}
                    onContentSizeChange={(e) => {
                      if (Platform.OS === "web") {
                        setInputHeight(e.nativeEvent.contentSize.height);
                      }
                    }}
                  />
                {(() => {
                  const unchanged = progress === savedProgress && tanggalKajian === savedTanggal;
                  return (
                    <Pressable
                      onPress={handleSaveProgress}
                      disabled={isSaving || unchanged}
                      style={({ pressed }) => [
                        styles.saveBtn,
                        {
                          backgroundColor: unchanged ? colors.muted : colors.primary,
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
                            { color: unchanged ? colors.mutedForeground : "#FFF" },
                          ]}
                        >
                          {unchanged && progress ? "Tersimpan ✓" : "Simpan Progres"}
                        </Text>
                      )}
                    </Pressable>
                  );
                })()}
              </>
            ) : (
              <>
                {savedProgress ? (
                  <View style={[styles.progressDisplayCard, { backgroundColor: colors.background, borderColor: colors.border }]}>
                    <View style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                      <View style={[styles.progressDot, { backgroundColor: colors.gold }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.progressDisplayLabel, { color: colors.mutedForeground }]}>
                          Materi terakhir sampai:
                        </Text>
                        <Text style={[styles.progressDisplayText, { color: colors.foreground }, Platform.OS === "web" && { whiteSpace: "pre-wrap" } as any]}>
                          {savedProgress}
                        </Text>
                        {savedTanggal && parseDateStr(savedTanggal) && (
                          <View style={[styles.progressDateRow]}>
                            <Feather name="calendar" size={11} color={colors.mutedForeground} />
                            <Text style={[styles.progressDateSmall, { color: colors.mutedForeground }]}>
                              {formatMasehi(parseDateStr(savedTanggal)!)} · {formatHijri(parseDateStr(savedTanggal)!)}
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>
                    <View style={[styles.progressNextBanner, { backgroundColor: "rgba(201,162,39,0.08)", borderColor: "rgba(201,162,39,0.25)" }]}>
                      <Feather name="arrow-right-circle" size={14} color={colors.gold} />
                      <Text style={[styles.progressNextText, { color: colors.gold }]}>
                        {savedTanggal && parseDateStr(savedTanggal)
                          ? `Kajian ${formatMasehi(parseDateStr(savedTanggal)!)} melanjutkan dari sini`
                          : "Kajian selanjutnya melanjutkan dari sini"}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={{ alignItems: "center", paddingVertical: 16 }}>
                    <Feather name="book" size={28} color={colors.mutedForeground} style={{ opacity: 0.4, marginBottom: 8 }} />
                    <Text style={[styles.descText, { color: colors.mutedForeground, fontStyle: "italic", textAlign: "center" }]}>
                      Belum ada informasi progres materi.
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>
        </View>

        {/* ── Kitab Rujukan ──────────────────── */}
        {rujukanList.length > 0 && (
          <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 0 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <View style={[styles.progressIconWrap, { backgroundColor: colors.highlight, width: 32, height: 32, borderRadius: 8 }]}>
                <Feather name="bookmark" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.descTitle, { color: colors.foreground, marginBottom: 0 }]}>
                Kitab Rujukan
              </Text>
            </View>
            {rujukanList.map((r, idx) => (
              <Pressable
                key={r.id}
                onPress={() => r.file_url ? openRujukanLink(r.file_url) : null}
                style={({ pressed }) => [
                  styles.rujukanItem,
                  {
                    borderColor: colors.border,
                    backgroundColor: pressed && r.file_url ? colors.highlight : colors.surface,
                    borderBottomWidth: idx < rujukanList.length - 1 ? 0 : 0,
                  }
                ]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rujukanTitle, { color: colors.foreground }]}>
                    {r.judul_kitab}
                  </Text>
                  {r.penulis && (
                    <Text style={[styles.rujukanAuthor, { color: colors.mutedForeground }]}>
                      {r.penulis}
                    </Text>
                  )}
                  {r.deskripsi && (
                    <Text style={[styles.rujukanDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {r.deskripsi}
                    </Text>
                  )}
                </View>
                {r.file_url && (
                  <View style={[styles.rujukanLinkBadge, { backgroundColor: "rgba(58,110,168,0.1)" }]}>
                    <Feather name="external-link" size={14} color="#3A6EA8" />
                  </View>
                )}
              </Pressable>
            ))}
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

      {/* ── Sticky Action Bar (tetap di bawah) ──────────────────── */}
      <View style={[styles.stickyActionBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
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
      <View style={{ width: 50, height: 50, borderRadius: 25, backgroundColor: bgColor, alignItems: "center", justifyContent: "center", marginBottom: 6 }}>
        {isFontAwesome ? (
          <FontAwesome name={icon} size={22} color={color} />
        ) : (
          <Feather name={icon} size={22} color={color} />
        )}
      </View>
      <Text style={{ fontSize: 10, fontFamily: "Inter_600SemiBold", color: color, textAlign: "center", lineHeight: 13 }}>{label}</Text>
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

  // ── Progress Card ──────────────────────────
  progressCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  progressHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  progressIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  progressHeaderTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  progressDateText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  progressDateBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  progressDateBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  progressBody: {
    padding: 16,
  },
  progressDisplayCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 5,
  },
  progressDisplayLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  progressDisplayText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 22,
  },
  progressDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 8,
  },
  progressDateSmall: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  progressNextBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  progressNextText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
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
  dateChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateChipDay: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  dateChipHijri: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  manualDateWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    gap: 8,
    marginBottom: 12,
  },
  manualDateInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
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

  // ── Rujukan ──────────────────────────
  rujukanItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  rujukanTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  rujukanAuthor: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  rujukanDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 16,
  },
  rujukanLinkBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Sticky Action Bar ──────────────────────────
  stickyActionBar: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    paddingTop: 12,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: "0 -4px 12px rgba(0,0,0,0.06)",
      } as any,
    }),
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
