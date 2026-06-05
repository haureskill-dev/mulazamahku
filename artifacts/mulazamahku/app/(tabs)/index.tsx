import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useFocusEffect } from "expo-router";
import React, { useMemo, useState, useCallback, useRef, useEffect } from "react";
import {
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  Alert,
  Modal,
  Animated,
  Image as RNImage,
} from "react-native";
import * as Updates from "expo-updates";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MosqueDecoration } from "@/components/MosqueDecoration";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useNotes } from "@/context/NotesContext";
import { DUMMY_KAJIAN, PENGAJAR_PROFILES } from "@/services/dummyData";
import { Kajian, Flyer } from "@/types";
import { FlyerService } from "@/services/flyerService";
import { KajianTambahanService } from "@/services/kajianTambahanService";
import { scheduleAllKajianReminders } from "@/services/notificationService";
import { Image } from "expo-image";
import { WebPullToRefresh } from "@/components/WebPullToRefresh";

const DAYS_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

// Mapping JS getDay() → nama hari Indonesia
// getDay(): 0=Ahad, 1=Senin, 2=Selasa, 3=Rabu, 4=Kamis, 5=Jumat, 6=Sabtu
const JS_DAY_TO_HARI = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

function extractDayName(hari: string): string {
  const lower = hari.toLowerCase();
  for (const d of DAYS_ORDER) {
    if (lower.startsWith(d.toLowerCase())) return d;
  }
  return hari;
}

function groupByDay(kajian: Kajian[]): Record<string, Kajian[]> {
  const groups: Record<string, Kajian[]> = {};
  for (const d of DAYS_ORDER) groups[d] = [];
  for (const k of kajian) {
    const day = extractDayName(k.hari);
    if (groups[day]) groups[day].push(k);
  }
  return groups;
}

/** Konversi "Pekan 1 & 3" → "P1 & P3", "Pekan 2" → "P2" */
function shortPekan(pekanStr: string): string {
  return pekanStr.replace(/Pekan\s*/gi, "P");
}

/** Cek apakah kajian aktif pada tanggal tertentu (cocok hari + pekan) */
function isKajianOnDate(kajian: Kajian, date: Date, flyers: Flyer[] = []): boolean {
  if (kajian.status !== "aktif") return false;

  // Cek apakah ada flyer (reschedule) yang tanggal berlakunya cocok dengan date ini
  const dateStr = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
  const hasReschedule = flyers.some(f => f.kajian_id === kajian.id && f.tanggal_berlaku === dateStr);
  if (hasReschedule) return true;

  const dayName = JS_DAY_TO_HARI[date.getDay()];
  const kajianDay = extractDayName(kajian.hari);
  if (kajianDay !== dayName) return false;

  const pekanMatch = kajian.hari.match(/pekan\s*([\d\s&,]+)/i);
  if (!pekanMatch) return true;
  const weekNum = Math.ceil(date.getDate() / 7);
  return pekanMatch[1].includes(String(weekNum));
}

function isKajianPassedToday(waktu: string): boolean {
  if (!waktu || waktu.includes("konfirmasi")) return false;
  const matches = waktu.match(/\d{2}[.:]\d{2}/g);
  if (!matches || matches.length === 0) return false;
  
  const lastTime = matches.length > 1 ? matches[1] : matches[0];
  const [h, m] = lastTime.replace(".", ":").split(":");
  
  const now = new Date();
  const end = new Date();
  end.setHours(parseInt(h, 10), parseInt(m, 10), 0, 0);
  
  // Beri buffer 60 menit setelah jadwal habis/mulai
  end.setMinutes(end.getMinutes() + 60);
  
  return now.getTime() > end.getTime();
}

/** Cari kajian terdekat dalam 14 hari ke depan */
function findNearestKajian(allKajian: Kajian[], flyers: Flyer[] = []): Kajian {
  const now = new Date();
  for (let offset = 0; offset < 14; offset++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    for (const k of allKajian) {
      if (isKajianOnDate(k, date, flyers)) {
        if (offset === 0 && isKajianPassedToday(k.waktu)) continue;
        return k;
      }
    }
  }
  return allKajian.find((k) => k.status === "aktif") ?? allKajian[0];
}

const MOTIVASI_QUOTES = [
  "📚 \"Menuntut ilmu itu wajib atas setiap muslim.\" — HR. Ibnu Majah",
  "🌟 \"Barangsiapa menempuh jalan untuk menuntut ilmu, Allah akan memudahkan baginya jalan ke surga.\" — HR. Muslim",
  "💎 \"Ilmu itu lebih baik daripada harta. Ilmu menjagamu, sedangkan harta engkau yang menjaganya.\" — Ali bin Abi Thalib",
  "🌙 \"Carilah ilmu walau sampai ke negeri China.\" — HR. Ibnu 'Abdil Barr",
  "📖 \"Seorang 'alim yang mengamalkan ilmunya lebih utama dari seribu orang yang beribadah.\" — HR. Ad-Dailami",
  "🕌 \"Duduk bersama ulama lebih baik dari berdiri di hadapan raja.\" — Al-Imam Asy-Syafi'i",
];

import { Easing } from "react-native";

function MarqueeText({ colors, width }: { colors: any; width: number }) {
  const translateX = useRef(new Animated.Value(width)).current;
  const fullText = MOTIVASI_QUOTES.join("      ✦      ");
  
  // Berikan lebar fix yang sangat besar untuk container teks
  const containerWidth = 6000; 

  useEffect(() => {
    translateX.setValue(width);

    const animation = Animated.loop(
      Animated.timing(translateX, {
        toValue: -containerWidth,
        duration: (containerWidth + width) * 12, // kecepatan scroll
        easing: Easing.linear,
        useNativeDriver: false, // MATIKAN native driver agar aman di semua platform web/android
      })
    );
    
    animation.start();
    return () => animation.stop();
  }, [width]);

  return (
    <View
      style={{
        overflow: "hidden",
        backgroundColor: colors.primary,
        paddingTop: Platform.OS === "web" ? 12 : 12,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: colors.gold,
      }}
    >
      <Animated.View
        style={{
          flexDirection: "row",
          transform: [{ translateX }],
          width: containerWidth,
        }}
      >
        <Text
          numberOfLines={1}
          style={{
            fontSize: 12,
            fontFamily: "Inter_500Medium",
            color: "#FFFFFF",
            letterSpacing: 0.3,
          }}
        >
          {fullText}
        </Text>
      </Animated.View>
    </View>
  );
}

export default function BerandaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { notes } = useNotes();

  const [customKajian, setCustomKajian] = useState<Kajian[]>([]);
  
  const fetchCustomKajian = useCallback(async () => {
    const data = await KajianTambahanService.getAll();
    
    // Murid hanya boleh melihat yang is_public = true (meskipun sudah dijaga di RLS Supabase)
    const filteredData = (user?.role === "pengajar" || user?.role === "admin") 
      ? data 
      : data.filter(d => d.is_public);
      
    const mapped: Kajian[] = filteredData.map(d => ({
      id: d.id,
      judul: d.judul,
      ustadz: d.ustadz,
      waktu: d.waktu,
      hari: d.hari,
      lokasi: d.lokasi,
      status: "aktif",
      cp_nama: d.cp_nama,
      cp_telepon: d.cp_telepon,
      is_custom: true,
      is_public: d.is_public
    } as Kajian & { cp_nama?: string; cp_telepon?: string; is_custom?: boolean; is_public?: boolean }));
    
    setCustomKajian(mapped);
  }, [user?.role]);

  const allKajianList = useMemo(() => [...DUMMY_KAJIAN, ...customKajian], [customKajian]);
  const grouped = useMemo(() => groupByDay(allKajianList), [allKajianList]);
  
  const [flyers, setFlyers] = useState<Flyer[]>([]);
  const highlight = useMemo(() => findNearestKajian(allKajianList, flyers), [allKajianList, flyers]);


  const fetchFlyers = useCallback(async () => {
    const data = await FlyerService.getAllFlyers();
    setFlyers(data);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFlyers();
      fetchCustomKajian();
    }, [fetchFlyers, fetchCustomKajian])
  );

  const greeting = () => {
    const h = new Date().getHours();
    if (h >= 4 && h < 11) return "Shabahul Khair";
    if (h >= 11 && h < 15) return "Assalamu'alaikum";
    return "Masa'ul Khair";
  };

  const greetingArabic = () => {
    const h = new Date().getHours();
    if (h >= 4 && h < 11) return "صباح الخير";
    if (h >= 11 && h < 15) return "وعليكم السلام";
    return "مساء الخير";
  };

  const [refreshing, setRefreshing] = useState(false);
  const [imageAspectRatios, setImageAspectRatios] = useState<Record<string, number>>({});
  const [selectedFlyer, setSelectedFlyer] = useState<Flyer | null>(null);

  useEffect(() => {
    flyers.forEach(f => {
      if (f.image_url && !imageAspectRatios[f.id]) {
        RNImage.getSize(f.image_url, (width, height) => {
          if (width && height) {
            setImageAspectRatios(prev => ({ ...prev, [f.id]: width / height }));
          }
        }, () => {});
      }
    });
  }, [flyers]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchFlyers();
    await fetchCustomKajian();
    
    if (Platform.OS === "web") {
      window.location.reload();
    } else {
      // Sinkronkan notifikasi dengan kajian terbaru dari database
      scheduleAllKajianReminders().catch(() => {});
      
      try {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          await Updates.reloadAsync();
        }
      } catch (e) {
        // Abaikan error di dev mode
      }
    }
    setRefreshing(false);
  }, [fetchFlyers]);

  return (
    <WebPullToRefresh
      onRefresh={onRefresh}
      refreshing={refreshing}
      primaryColor={colors.primary}
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + 90,
      }}
    >
      {/* ── Tulisan Berjalan (Paling Atas) ───────────────────────── */}
      <View style={{ paddingTop: insets.top, backgroundColor: colors.primary }}>
        <MarqueeText colors={colors} width={width} />
      </View>

      {/* ── Header navy (User) ─────────────────────────────────────── */}
      <View
        style={[
          styles.headerSection,
          { backgroundColor: colors.primary, paddingTop: 16 },
        ]}
      >

        <View style={styles.headerTop}>
          <View style={{ alignItems: "center", marginRight: 14 }}>
            <Pressable
              onPress={() => router.push("/(tabs)/profile")}
              style={[styles.avatarBtn, { borderColor: colors.gold, marginBottom: 4, marginRight: 0 }]}
            >
              <Text style={styles.avatarLetter}>
                {(user?.nama ?? "M").charAt(0).toUpperCase()}
              </Text>
            </Pressable>
            {user?.role && (
              <View style={{ backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8 }}>
                <Text style={{ fontSize: 9, fontFamily: "Inter_600SemiBold", color: "#FFFFFF", textTransform: "capitalize" }}>
                  {user.role}
                </Text>
              </View>
            )}
          </View>

          <View style={{ flex: 1 }}>
            <Text style={styles.greetingArabic}>{greetingArabic()}</Text>
            <Text style={styles.greetingText}>{greeting()},</Text>
            <Text style={[styles.nameText, { marginTop: 2 }]}>{user?.nama ?? "Muslimah"}</Text>
          </View>

          <Pressable
            onPress={() => {
              if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (PENGAJAR_PROFILES.length > 0) {
                router.push(`/pengajar/${PENGAJAR_PROFILES[0].id}`);
              }
            }}
            style={styles.headerRightBtn}
          >
            <Feather name="users" size={20} color="#FFFFFF" />
            <Text style={styles.headerRightBtnText}>Pengajar</Text>
          </Pressable>
        </View>

        {/* Statistik */}
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { borderColor: "rgba(201,162,39,0.4)", backgroundColor: "rgba(201,162,39,0.1)" }]}>
            <Text style={[styles.statNum, { color: colors.gold }]}>
              {DUMMY_KAJIAN.filter((k) => k.status === "aktif").length}
            </Text>
            <Text style={styles.statLabel}>Kajian Rutin</Text>
          </View>
          <View style={[styles.statItem, { borderColor: "rgba(201,162,39,0.4)", backgroundColor: "rgba(201,162,39,0.1)" }]}>
            <Text style={[styles.statNum, { color: colors.gold }]}>{notes.length}</Text>
            <Text style={styles.statLabel}>Catatan</Text>
          </View>
          <View style={[styles.statItem, { borderColor: "rgba(201,162,39,0.4)", backgroundColor: "rgba(201,162,39,0.1)" }]}>
            <Text style={[styles.statNum, { color: colors.gold }]}>{DUMMY_KAJIAN.length}</Text>
            <Text style={styles.statLabel}>Total Kajian</Text>
          </View>
        </View>

        {/* Motif silhouette masjid gold di bawah header */}
        <View style={styles.mosqueWrapper}>
          <MosqueDecoration width={width} goldColor={colors.gold} opacity={0.85} />
        </View>
      </View>

      {/* ── Konten ──────────────────────────────────────────── */}
      <View style={styles.content}>
        {/* Kajian Terdekat */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Kajian Terdekat</Text>
        </View>

        <Pressable
          onPress={() => router.push(`/kajian/${highlight.id}`)}
          style={({ pressed }) => [
            styles.highlightCard,
            {
              backgroundColor: colors.primary,
              borderColor: colors.gold,
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={[styles.highlightTopBar, { backgroundColor: colors.gold }]} />
          <View style={styles.highlightInner}>
            <View style={styles.highlightTop}>
              <View style={[styles.highlightBadge, { backgroundColor: "rgba(201,162,39,0.2)", borderColor: "rgba(201,162,39,0.5)", borderWidth: 1 }]}>
                <Text style={[styles.highlightBadgeText, { color: colors.gold }]}>{highlight.hari}</Text>
              </View>
              <Text style={[styles.highlightTime, { color: "rgba(255,255,255,0.75)" }]}>
                {highlight.waktu}
              </Text>
            </View>
            <Text style={[styles.highlightJudul, { color: "#FFFFFF" }]}>
              {highlight.judul}
            </Text>
            <Text style={[styles.highlightUstadz, { color: "rgba(255,255,255,0.7)" }]}>
              {highlight.ustadz}
            </Text>
            <View style={styles.highlightMeta}>
              <Feather name="map-pin" size={13} color={colors.gold} />
              <Text style={[styles.highlightLoc, { color: colors.gold }]}>
                {highlight.lokasi}
              </Text>
            </View>
          </View>
        </Pressable>

        {/* Flyer / Poster Kajian */}
        <View style={{ marginBottom: 24 }}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Info & Poster Kajian</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
            {flyers.length > 0 ? (
              flyers.map((f) => {
                const ratio = imageAspectRatios[f.id] || 16 / 9; // Default landscape jika belum load
                return (
                  <Pressable key={f.id} onPress={() => setSelectedFlyer(f)}>
                    <View style={[styles.flyerCard, { borderColor: colors.border, aspectRatio: ratio }]}>
                      <Image 
                        source={{ uri: f.image_url }} 
                        style={styles.flyerImage} 
                        contentFit="contain"
                        onLoad={(e) => {
                          if (e.source.width && e.source.height) {
                            setImageAspectRatios(prev => ({
                              ...prev,
                              [f.id]: e.source.width / e.source.height
                            }));
                          }
                        }}
                      />
                    </View>
                  </Pressable>
                );
              })
            ) : (
              <View style={[styles.flyerCard, { borderColor: colors.border, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.02)" }]}>
                <Feather name="image" size={32} color={colors.mutedForeground} style={{ opacity: 0.5 }} />
                <Text style={{ color: colors.mutedForeground, marginTop: 8, fontSize: 12, fontFamily: "Inter_500Medium" }}>Belum ada poster</Text>
              </View>
            )}
          </ScrollView>
        </View>

        {/* Tabel Jadwal Kajian - Desain Bento */}
        <View style={[styles.sectionHeader, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Jadwal Lengkap</Text>
          {(user?.role === "pengajar" || user?.role === "admin") && (
            <Pressable
              onPress={() => router.push("/kajian/tambah")}
              style={({ pressed }) => [
                styles.addScheduleBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.7 : 1 }
              ]}
            >
              <Feather name="plus" size={16} color="#FFF" />
              <Text style={styles.addScheduleBtnText}>Jadwal</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.bentoGrid}>
          {DAYS_ORDER.map((day) => {
            const items = grouped[day];
            if (items.length === 0) return null;

            const isDesktop = width > 600;
            return (
              <View 
                key={day} 
                style={[
                  styles.bentoCard, 
                  { 
                    backgroundColor: colors.card, 
                    borderColor: colors.border,
                    width: isDesktop ? '48%' : '100%'
                  }
                ]}
              >
                <View style={[styles.bentoHeader, { backgroundColor: colors.highlight, borderBottomColor: colors.border }]}>
                  <Feather name="calendar" size={14} color={colors.primary} />
                  <Text style={[styles.bentoDayText, { color: colors.primary }]}>{day}</Text>
                </View>
                <View style={styles.bentoContent}>
                  {items.map((kajian, idx) => {
                    const isLast = idx === items.length - 1;
                    const isConfirm = kajian.waktu.includes("konfirmasi");
                    const timeStr = isConfirm ? "Confirm" : kajian.waktu.replace("WIB", "").split("-")[0].trim();
                    const pekanStr = kajian.hari.includes("·") ? kajian.hari.split("·")[1].replace(/pekan/i, "Pk.").trim() : "";

                    return (
                      <Pressable
                        key={kajian.id}
                        onPress={() => {
                          if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          router.push(`/kajian/${kajian.id}`);
                        }}
                        style={({ pressed }) => [
                          styles.bentoItem,
                          {
                            borderBottomWidth: isLast ? 0 : 1,
                            borderBottomColor: colors.border,
                            backgroundColor: pressed ? colors.highlight : "transparent",
                          }
                        ]}
                      >
                        <View style={styles.bentoItemTop}>
                          <Text style={[styles.bentoTime, { color: colors.foreground }]}>
                            {kajian.waktu.includes("konfirmasi") ? "Confirm" : kajian.waktu.split("-")[0].trim()}
                          </Text>
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            {kajian.hari.includes("·") && (
                              <View style={[styles.bentoPekanBadge, { backgroundColor: colors.highlight }]}>
                                <Text style={[styles.bentoPekanText, { color: colors.mutedForeground }]}>
                                  {kajian.hari.split("·")[1].trim()}
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <Text style={[styles.bentoTitle, { color: colors.foreground }]} numberOfLines={2}>
                          {kajian.judul}
                        </Text>
                        <Text style={[styles.bentoLoc, { color: colors.mutedForeground }]} numberOfLines={1}>
                          <Feather name="map-pin" size={10} /> {kajian.lokasi}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>

        <View style={{ height: 20 }} />
      </View>

      <Modal visible={!!selectedFlyer} transparent={true} animationType="fade" onRequestClose={() => setSelectedFlyer(null)}>
        <View style={styles.modalContainer}>
          <Pressable style={styles.modalCloseBtn} onPress={() => setSelectedFlyer(null)}>
            <Feather name="x" size={24} color="#FFF" />
          </Pressable>
          
          <ScrollView contentContainerStyle={styles.modalScrollContent} style={{ width: "100%" }}>
            {selectedFlyer && (
              <>
                <Image 
                  source={{ uri: selectedFlyer.image_url }} 
                  style={{ width: "100%", aspectRatio: 3/4, borderRadius: 12, backgroundColor: "#000" }} 
                  contentFit="contain" 
                />
                {selectedFlyer.keterangan ? (
                  <View style={styles.modalTextContainer}>
                    <Text style={styles.modalText}>{selectedFlyer.keterangan}</Text>
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </WebPullToRefresh>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Header
  headerSection: {
    paddingHorizontal: 20,
    paddingBottom: 0,
    overflow: "hidden",
  },
  goldTopBar: {
    height: 3,
    marginHorizontal: -20,
    marginBottom: 16,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greetingArabic: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#C9A227",
    letterSpacing: 0.5,
    marginBottom: 2,
    textAlign: "left",
  },
  greetingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  addScheduleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addScheduleBtnText: {
    color: "#FFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  nameText: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginTop: 2,
  },
  avatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
    borderWidth: 1.5,
  },
  avatarLetter: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  headerRightBtn: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  headerRightBtnText: {
    color: "#FFF",
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    marginTop: 4,
  },

  // Stats
  statsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 20,
  },
  statItem: {
    flex: 1,
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  statNum: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
    textAlign: "center",
  },
  mosqueWrapper: {
    marginHorizontal: -20,
  },

  // Content
  content: { paddingHorizontal: 20, paddingTop: 20 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionAccent: {
    width: 4,
    height: 18,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    flex: 1,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  testBtnText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },

  // Highlight card
  highlightCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    marginBottom: 30,
    overflow: "hidden",
  },
  highlightTopBar: {
    height: 3,
  },
  highlightInner: {
    padding: 16,
  },
  highlightTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  highlightBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  highlightBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  highlightTime: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  highlightJudul: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
    lineHeight: 24,
    textAlign: "left",
  },
  highlightUstadz: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
    textAlign: "left",
  },
  highlightMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  highlightLoc: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },

  bentoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
  },
  bentoCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 4,
  },
  bentoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  bentoDayText: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  bentoContent: {
    paddingBottom: 4,
  },
  bentoItem: {
    padding: 14,
  },
  bentoItemTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  bentoTime: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  bentoPekanBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bentoPekanText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  bentoTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
    lineHeight: 18,
    textAlign: "left",
  },
  bentoLoc: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    textAlign: "left",
  },

  // Flyers
  flyerCard: {
    width: 280,
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  flyerImage: {
    width: "100%",
    height: "100%",
  },

  // Pengajar Card
  pengajarCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    gap: 14,
  },
  pengajarAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  pengajarAvatarText: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  pengajarNama: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    marginBottom: 1,
  },
  pengajarSub: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  pengajarRole: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.9)",
  },
  modalCloseBtn: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 20,
  },
  modalScrollContent: {
    paddingTop: 100,
    paddingBottom: 40,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  modalTextContainer: {
    marginTop: 20,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
    padding: 16,
    borderRadius: 12,
  },
  modalText: {
    color: "#FFF",
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  }
});
