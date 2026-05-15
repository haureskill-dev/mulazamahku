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

  const statusColor =
    kajian.status === "aktif"
      ? colors.primary
      : kajian.status === "akan_datang"
      ? "#D4841A"
      : kajian.status === "online"
      ? "#1A6DA8"
      : colors.mutedForeground;

  const statusBg =
    kajian.status === "aktif"
      ? colors.highlight
      : kajian.status === "akan_datang"
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
      <View style={styles.header}>
        <View style={[styles.badge, { backgroundColor: statusBg }]}>
          <Text style={[styles.badgeText, { color: statusColor }]}>
            {STATUS_LABEL[kajian.status]}
          </Text>
        </View>
        <View style={[styles.kategori, { backgroundColor: colors.muted }]}>
          <Text style={[styles.kategoriText, { color: colors.mutedForeground }]}>
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
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
    lineHeight: 22,
  },
  ustadz: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 10,
  },
  meta: {
    gap: 4,
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
