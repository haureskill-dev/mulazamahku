import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Kajian } from "@/types";

const STATUS_LABEL: Record<Kajian["status"], string> = {
  aktif: "Rutin",
  akan_datang: "Segera",
  selesai: "Selesai",
  online: "Online",
};

interface Props {
  kajian: Kajian;
}

export function KajianCard({ kajian }: Props) {
  const colors = useColors();

  const isAktif = kajian.status === "aktif";
  const isSegera = kajian.status === "akan_datang";

  const statusColor = isAktif
    ? colors.gold
    : isSegera
    ? "#B07D2A"
    : kajian.status === "online"
    ? "#3A6EA8"
    : colors.mutedForeground;

  const statusBg = isAktif
    ? colors.goldLight
    : isSegera
    ? "#FFF4E0"
    : kajian.status === "online"
    ? "#E8F2FA"
    : colors.muted;

  const handlePress = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/kajian/${kajian.id}`);
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      {/* Garis aksen gold di sisi kiri */}
      <View style={[styles.accentBar, { backgroundColor: isAktif ? colors.gold : colors.border }]} />

      <View style={styles.inner}>
        <View style={styles.header}>
          <View style={[styles.badge, { backgroundColor: statusBg }]}>
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {STATUS_LABEL[kajian.status]}
            </Text>
          </View>
          <View style={[styles.kategori, { backgroundColor: colors.highlight }]}>
            <Text style={[styles.kategoriText, { color: colors.primary }]}>
              {kajian.kategori}
            </Text>
          </View>
        </View>

        <Text style={[styles.judul, { color: colors.foreground }]} numberOfLines={2}>
          {kajian.judul}
        </Text>
        <Text style={[styles.ustadz, { color: colors.secondary }]}>{kajian.ustadz}</Text>

        <View style={styles.meta}>
          <View style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
              {kajian.hari} · {kajian.waktu}
            </Text>
          </View>
          <View style={styles.metaRow}>
            <Feather name="map-pin" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground }]} numberOfLines={1}>
              {kajian.lokasi}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    flexDirection: "row",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  accentBar: {
    width: 4,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  inner: {
    flex: 1,
    padding: 14,
  },
  header: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  kategori: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  kategoriText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  judul: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 3,
    lineHeight: 21,
  },
  ustadz: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginBottom: 9,
  },
  meta: {
    gap: 3,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
});
