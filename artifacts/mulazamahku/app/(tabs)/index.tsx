import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { KajianCard } from "@/components/KajianCard";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { useNotes } from "@/context/NotesContext";
import { DUMMY_KAJIAN } from "@/services/dummyData";
import { Kajian } from "@/types";

const KATEGORI = ["Semua", "Fikih", "Akidah", "Ilmu", "Tafsir", "Akhlak", "Umum"];

export default function BerandaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { notes } = useNotes();
  const [selectedKategori, setSelectedKategori] = React.useState("Semua");

  const filtered = useMemo(() => {
    if (selectedKategori === "Semua") return DUMMY_KAJIAN;
    return DUMMY_KAJIAN.filter((k) => k.kategori === selectedKategori);
  }, [selectedKategori]);

  const highlight = DUMMY_KAJIAN.find((k) => k.status === "aktif") ?? DUMMY_KAJIAN[0];

  const greeting = () => {
    const h = new Date().getHours();
    if (h >= 4 && h < 11) return "Shabahul Khair";   // صباح الخير — pagi
    if (h >= 11 && h < 15) return "Assalamu'alaikum"; // siang
    return "Masa'ul Khair";                            // مساء الخير — sore & malam
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
      <View
        style={[
          styles.headerSection,
          { backgroundColor: colors.primary, paddingTop: insets.top + 20 },
        ]}
      >
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greetingArabic}>{greetingArabic()}</Text>
            <Text style={styles.greetingText}>{greeting()},</Text>
            <Text style={styles.nameText}>{user?.nama ?? "Muslimah"}</Text>
          </View>
          <Pressable
            onPress={() => router.push("/(tabs)/profile")}
            style={[styles.avatarBtn, { backgroundColor: "rgba(255,255,255,0.2)" }]}
          >
            <Text style={styles.avatarLetter}>
              {(user?.nama ?? "M").charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        </View>

        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Text style={styles.statNum}>{DUMMY_KAJIAN.filter((k) => k.status === "aktif").length}</Text>
            <Text style={styles.statLabel}>Kajian Rutin</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Text style={styles.statNum}>{notes.length}</Text>
            <Text style={styles.statLabel}>Catatan</Text>
          </View>
          <View style={[styles.statItem, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
            <Text style={styles.statNum}>{DUMMY_KAJIAN.length}</Text>
            <Text style={styles.statLabel}>Total Kajian</Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Kajian Hari Ini
        </Text>
        <Pressable
          onPress={() => router.push(`/kajian/${highlight.id}`)}
          style={({ pressed }) => [
            styles.highlightCard,
            {
              backgroundColor: colors.highlight,
              borderColor: colors.primary,
              opacity: pressed ? 0.92 : 1,
              transform: [{ scale: pressed ? 0.98 : 1 }],
            },
          ]}
        >
          <View style={styles.highlightTop}>
            <View style={[styles.highlightBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.highlightBadgeText}>{highlight.hari}</Text>
            </View>
            <Text style={[styles.highlightTime, { color: colors.primary }]}>
              {highlight.waktu}
            </Text>
          </View>
          <Text style={[styles.highlightJudul, { color: colors.foreground }]}>
            {highlight.judul}
          </Text>
          <Text style={[styles.highlightUstadz, { color: colors.secondary }]}>
            {highlight.ustadz}
          </Text>
          <View style={styles.highlightMeta}>
            <Feather name="map-pin" size={13} color={colors.primary} />
            <Text style={[styles.highlightLoc, { color: colors.primary }]}>
              {highlight.lokasi}
            </Text>
          </View>
        </Pressable>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Semua Kajian
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipScroll}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}
        >
          {KATEGORI.map((k) => (
            <Pressable
              key={k}
              onPress={() => setSelectedKategori(k)}
              style={[
                styles.chip,
                {
                  backgroundColor:
                    selectedKategori === k ? colors.primary : colors.card,
                  borderColor:
                    selectedKategori === k ? colors.primary : colors.border,
                },
              ]}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color:
                      selectedKategori === k
                        ? colors.primaryForeground
                        : colors.foreground,
                  },
                ]}
              >
                {k}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.list}>
          {filtered.map((kajian) => (
            <KajianCard key={kajian.id} kajian={kajian} />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerSection: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  greetingArabic: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "rgba(255,255,255,0.95)",
    textAlign: "right",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  greetingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
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
  },
  avatarLetter: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statItem: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  statNum: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
    textAlign: "center",
  },
  content: {
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  highlightCard: {
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    marginBottom: 24,
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
    color: "#FFFFFF",
  },
  highlightTime: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
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
    fontFamily: "Inter_500Medium",
  },
  chipScroll: {
    marginBottom: 14,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  list: {
    paddingHorizontal: 20,
  },
});
