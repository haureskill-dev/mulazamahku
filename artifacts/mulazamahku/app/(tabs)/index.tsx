import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MosqueDecoration } from "@/components/MosqueDecoration";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useNotes } from "@/context/NotesContext";
import { DUMMY_KAJIAN } from "@/services/dummyData";
import { testNotification } from "@/services/notificationService";
import { Kajian } from "@/types";

const DAYS_ORDER = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Ahad"];

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

export default function BerandaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { user } = useAuth();
  const { notes } = useNotes();

  const grouped = useMemo(() => groupByDay(DUMMY_KAJIAN), []);
  const highlight = DUMMY_KAJIAN.find((k) => k.status === "aktif") ?? DUMMY_KAJIAN[0];

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

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{
        paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90,
        paddingTop: Platform.OS === "web" ? 67 : 0,
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header navy ─────────────────────────────────────── */}
      <View
        style={[
          styles.headerSection,
          { backgroundColor: colors.primary, paddingTop: insets.top + 20 },
        ]}
      >
        <View style={[styles.goldTopBar, { backgroundColor: colors.gold }]} />

        <View style={styles.headerTop}>
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={[styles.avatarBtn, { borderColor: colors.gold, marginRight: 14 }]}
          >
            <Text style={styles.avatarLetter}>
              {(user?.nama ?? "M").charAt(0).toUpperCase()}
            </Text>
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.greetingArabic}>{greetingArabic()}</Text>
            <Text style={styles.greetingText}>{greeting()},</Text>
            <Text style={styles.nameText}>{user?.nama ?? "Muslimah"}</Text>
          </View>
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

        {/* Highlight kajian */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionAccent, { backgroundColor: colors.gold }]} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Kajian Terdekat</Text>
          <Pressable 
            onPress={testNotification} 
            style={[styles.testBtn, { backgroundColor: "rgba(201,162,39,0.2)", borderColor: colors.gold }]}
          >
            <Feather name="bell" size={12} color={colors.gold} />
            <Text style={[styles.testBtnText, { color: colors.gold }]}>Uji Notifikasi</Text>
          </Pressable>
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

        {/* Tabel Jadwal Kajian */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionAccent, { backgroundColor: colors.gold }]} />
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Jadwal Lengkap</Text>
        </View>

        <View style={[styles.tableContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.tableHeader, { backgroundColor: colors.highlight, borderBottomColor: colors.border }]}>
            <Text style={[styles.colHari, styles.tableHeaderText, { color: colors.mutedForeground }]}>Hari</Text>
            <Text style={[styles.colWaktu, styles.tableHeaderText, { color: colors.mutedForeground }]}>Waktu</Text>
            <Text style={[styles.colKajian, styles.tableHeaderText, { color: colors.mutedForeground }]}>Kajian & Lokasi</Text>
          </View>

          {DAYS_ORDER.map((day, dayIdx) => {
            const items = grouped[day];
            if (items.length === 0) return null;

            return items.map((kajian, idx) => {
              const isLast = dayIdx === DAYS_ORDER.length - 1 && idx === items.length - 1;
              return (
                <Pressable
                  key={kajian.id}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    router.push(`/kajian/${kajian.id}`);
                  }}
                  style={({ pressed }) => [
                    styles.tableRow,
                    {
                      borderBottomWidth: isLast ? 0 : 1,
                      borderBottomColor: colors.border,
                      backgroundColor: pressed ? colors.highlight : colors.card,
                    },
                  ]}
                >
                  <View style={styles.colHari}>
                    {idx === 0 ? (
                      <Text style={[styles.rowDayText, { color: colors.primary }]}>{day}</Text>
                    ) : null}
                    {kajian.hari.includes("·") ? (
                      <Text style={[styles.rowPekanText, { color: colors.mutedForeground }]}>
                        {kajian.hari.split("·")[1].trim()}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.colWaktu}>
                    <Text style={[styles.rowTimeText, { color: colors.foreground }]}>
                      {kajian.waktu.includes("konfirmasi") ? "Confirm" : kajian.waktu.split("-")[0].trim()}
                    </Text>
                  </View>
                  <View style={styles.colKajian}>
                    <Text style={[styles.rowTitleText, { color: colors.foreground }]} numberOfLines={2}>
                      {kajian.judul}
                    </Text>
                    <Text style={[styles.rowLocText, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {kajian.lokasi}
                    </Text>
                  </View>
                </Pressable>
              );
            });
          })}
        </View>
      </View>
    </ScrollView>
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
  },
  greetingText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
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
  },
  highlightUstadz: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
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

  // Table
  tableContainer: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: "row",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  tableHeaderText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  
  colHari: {
    flex: 1.8,
    paddingRight: 6,
  },
  colWaktu: {
    flex: 1.8,
    paddingRight: 6,
  },
  colKajian: {
    flex: 5,
  },

  rowDayText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  rowPekanText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  rowTimeText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  rowTitleText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
    lineHeight: 18,
  },
  rowLocText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
