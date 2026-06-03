import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { PENGAJAR_PROFILES, DUMMY_KAJIAN } from "@/services/dummyData";

export default function PengajarDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const pengajar = PENGAJAR_PROFILES.find((p) => p.id === id);

  // Hitung kajian aktif yang diampu
  const namaFull = pengajar
    ? `Ustadzah ${pengajar.nama}, ${pengajar.gelar ?? ""}`
    : "";
  const kajianAktif = DUMMY_KAJIAN.filter(
    (k) => k.status === "aktif" && k.ustadz.includes(pengajar?.nama ?? "___"),
  ).length;

  if (!pengajar) {
    return (
      <View style={[styles.notFound, { backgroundColor: colors.background }]}>
        <Text style={[styles.notFoundText, { color: colors.foreground }]}>
          Pengajar tidak ditemukan
        </Text>
        <Pressable
          onPress={() => router.back()}
          style={[styles.backBtnLarge, { backgroundColor: colors.primary }]}
        >
          <Text style={{ color: "#FFF", fontFamily: "Inter_600SemiBold" }}>
            Kembali
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Top Bar */}
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
        <Pressable
          onPress={() => router.back()}
          style={styles.backBtn}
          hitSlop={8}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text
          style={[styles.topBarTitle, { color: colors.foreground }]}
          numberOfLines={1}
        >
          Profil Pengajar
        </Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          {
            paddingBottom:
              insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={[styles.hero, { backgroundColor: colors.primary }]}>
          <View style={[styles.avatarLarge, { borderColor: colors.gold }]}>
            <Text style={styles.avatarText}>
              {pengajar.nama.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.heroNama}>Ustadzah</Text>
          <Text style={styles.heroNamaFull}>
            {pengajar.nama}, {pengajar.gelar}
          </Text>
          <Text style={styles.heroSubtitle}>حفظها الله</Text>

          {/* Stats */}
          <View style={styles.heroStats}>
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatNum, { color: colors.gold }]}>
                {kajianAktif}
              </Text>
              <Text style={styles.heroStatLabel}>Kajian Aktif</Text>
            </View>
            <View
              style={[styles.heroStatDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]}
            />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatNum, { color: colors.gold }]}>
                {pengajar.pendidikanNonFormal.length}
              </Text>
              <Text style={styles.heroStatLabel}>Masyaikh</Text>
            </View>
            <View
              style={[styles.heroStatDivider, { backgroundColor: "rgba(255,255,255,0.2)" }]}
            />
            <View style={styles.heroStatItem}>
              <Text style={[styles.heroStatNum, { color: colors.gold }]}>
                {pengajar.aktivitasSaatIni.length}
              </Text>
              <Text style={styles.heroStatLabel}>Aktivitas</Text>
            </View>
          </View>
        </View>

        {/* Info Pribadi */}
        <View style={styles.section}>
          <SectionTitle icon="user" title="Informasi Pribadi" colors={colors} />
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <InfoItem
              label="Tempat Lahir"
              value={pengajar.tempatLahir}
              colors={colors}
            />
            <InfoItem label="Agama" value={pengajar.agama} colors={colors} />
            <InfoItem label="Status" value={pengajar.status} colors={colors} />
            <InfoItem
              label="Pendidikan"
              value={pengajar.pendidikanTerakhir}
              colors={colors}
            />
            <InfoItem
              label="Domisili"
              value={pengajar.alamat}
              colors={colors}
              isLast
            />
          </View>
        </View>

        {/* Pendidikan Non Formal */}
        <View style={styles.section}>
          <SectionTitle
            icon="book"
            title="Pendidikan Non Formal"
            colors={colors}
          />
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {pengajar.pendidikanNonFormal.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.bulletItem,
                  {
                    borderBottomWidth:
                      idx === pengajar.pendidikanNonFormal.length - 1 ? 0 : 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.bulletDot,
                    { backgroundColor: colors.gold },
                  ]}
                />
                <Text
                  style={[styles.bulletText, { color: colors.foreground }]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Aktivitas Saat Ini */}
        <View style={styles.section}>
          <SectionTitle
            icon="briefcase"
            title="Aktivitas Saat Ini"
            colors={colors}
          />
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {pengajar.aktivitasSaatIni.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.bulletItem,
                  {
                    borderBottomWidth:
                      idx === pengajar.aktivitasSaatIni.length - 1 ? 0 : 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.bulletDot,
                    { backgroundColor: colors.primary },
                  ]}
                />
                <Text
                  style={[styles.bulletText, { color: colors.foreground }]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Aktivitas Belajar */}
        <View style={styles.section}>
          <SectionTitle
            icon="feather"
            title="Aktivitas Belajar Saat Ini"
            colors={colors}
          />
          <View
            style={[
              styles.card,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {pengajar.aktivitasBelajar.map((item, idx) => (
              <View
                key={idx}
                style={[
                  styles.bulletItem,
                  {
                    borderBottomWidth:
                      idx === pengajar.aktivitasBelajar.length - 1 ? 0 : 1,
                    borderBottomColor: colors.border,
                  },
                ]}
              >
                <View
                  style={[
                    styles.bulletDot,
                    { backgroundColor: "#25D366" },
                  ]}
                />
                <Text
                  style={[styles.bulletText, { color: colors.foreground }]}
                >
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Helper Components ────────────────────────────────────────────────────

function SectionTitle({
  icon,
  title,
  colors,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View
        style={[styles.sectionIcon, { backgroundColor: colors.highlight }]}
      >
        <Feather name={icon} size={14} color={colors.primary} />
      </View>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
        {title}
      </Text>
    </View>
  );
}

function InfoItem({
  label,
  value,
  colors,
  isLast = false,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        styles.infoItem,
        {
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>
        {value}
      </Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  notFoundText: { fontSize: 16, fontFamily: "Inter_500Medium" },
  backBtnLarge: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },

  // Top bar
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  topBarTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },

  scroll: {},

  // Hero
  hero: {
    alignItems: "center",
    paddingTop: 32,
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  avatarText: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  heroNama: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginBottom: 4,
  },
  heroNamaFull: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 4,
  },
  heroSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: "#C9A227",
    marginBottom: 20,
  },

  // Hero stats
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    gap: 4,
  },
  heroStatItem: {
    flex: 1,
    alignItems: "center",
  },
  heroStatNum: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  heroStatLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
    marginTop: 2,
  },
  heroStatDivider: {
    width: 1,
    height: 30,
  },

  // Sections
  section: {
    paddingHorizontal: 20,
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  sectionIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },

  // Card
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },

  // Info items
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  infoLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  infoValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textAlign: "right",
    flex: 1,
    marginLeft: 16,
  },

  // Bullet items
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  bulletDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginTop: 6,
  },
  bulletText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 20,
  },
});
