import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { Linking, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { DUMMY_KAJIAN } from "@/services/dummyData";

const STATUS_LABEL: Record<string, string> = {
  aktif: "Kajian Rutin",
  akan_datang: "Akan Datang",
  selesai: "Selesai",
  online: "Online",
};

const STATUS_COLOR: Record<string, string> = {
  aktif: "#3C4A5E",
  akan_datang: "#B07D2A",
  selesai: "#8A90A0",
  online: "#3A6EA8",
};

export default function KajianDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const kajian = DUMMY_KAJIAN.find((k) => k.id === id);

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

  const statusColor = STATUS_COLOR[kajian.status] ?? colors.mutedForeground;

  const openMaps = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const query = encodeURIComponent(kajian.alamat);
    const url =
      Platform.OS === "ios"
        ? `maps:?q=${query}`
        : `https://maps.google.com/?q=${query}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Linking.openURL(`https://maps.google.com/?q=${query}`);
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
          <Text style={styles.heroUstadz}>{kajian.ustadz}</Text>
        </View>

        <View style={styles.infoSection}>
          <InfoRow icon="clock" label="Hari & Waktu" value={`${kajian.hari} · ${kajian.waktu}`} colors={colors} />
          <InfoRow icon="map-pin" label="Lokasi" value={kajian.lokasi} colors={colors} />
          <InfoRow icon="navigation" label="Alamat" value={kajian.alamat} colors={colors} />
          <InfoRow icon="tag" label="Kategori" value={kajian.kategori} colors={colors} />
        </View>

        <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.descTitle, { color: colors.foreground }]}>Tentang Kajian</Text>
          <Text style={[styles.descText, { color: colors.mutedForeground }]}>{kajian.deskripsi}</Text>
        </View>

        {kajian.status !== "online" && (
          <Pressable
            onPress={openMaps}
            style={({ pressed }) => [
              styles.mapsBtn,
              {
                backgroundColor: colors.primary,
                opacity: pressed ? 0.85 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }],
              },
            ]}
          >
            <Feather name="map" size={18} color="#FFFFFF" />
            <Text style={styles.mapsBtnText}>Buka di Google Maps</Text>
          </Pressable>
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
  mapsBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 10,
    height: 52,
    borderRadius: 14,
  },
  mapsBtnText: {
    fontSize: 16,
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
