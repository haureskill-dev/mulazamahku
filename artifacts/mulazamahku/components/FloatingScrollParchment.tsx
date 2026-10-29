import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { Kajian } from "@/types";
import { ProgressService, ProgressData } from "@/services/progressService";
import { formatMasehi, parseDateStr } from "@/utils/dates";

interface FloatingScrollParchmentProps {
  kajian: Kajian | null;
  bottomOffset?: number;
}

/**
 * Gulungan kertas mengambang (Floating Parchment):
 * - Menampilkan materi kajian terdekat sampai mana (sinkron dengan progress materi)
 * - Desain klasik elegan bernuansa perkamen islami (warna gading hangat #FAF5E8, aksen emas #C9A227)
 * - Dapat diminimalkan/dibuka kembali agar tidak menghalangi konten layar.
 */
export function FloatingScrollParchment({
  kajian,
  bottomOffset = 80,
}: FloatingScrollParchmentProps) {
  const colors = useColors();
  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (kajian?.id) {
      ProgressService.get(kajian.id).then((data) => {
        setProgressData(data);
      });
    }
  }, [kajian?.id]);

  if (!kajian || dismissed) return null;

  const progressText = progressData?.progress?.trim();
  const tanggalKajian = progressData?.tanggal_kajian;

  // Jika diminimalkan, tampilkan segel gulungan bundar mengambang
  if (minimized) {
    return (
      <View style={[styles.floatingWrap, { bottom: bottomOffset, right: 16 }]} pointerEvents="box-none">
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setMinimized(false);
          }}
          style={({ pressed }) => [
            styles.minimizedBtn,
            {
              backgroundColor: "#FAF5E8",
              borderColor: colors.gold,
              opacity: pressed ? 0.85 : 1,
              transform: [{ scale: pressed ? 0.95 : 1 }],
            },
          ]}
        >
          <Text style={styles.scrollEmoji}>📜</Text>
          <View style={[styles.minimizedDot, { backgroundColor: colors.gold }]} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.floatingWrap, { bottom: bottomOffset, right: 16, left: 16 }]} pointerEvents="box-none">
      <View
        style={[
          styles.parchmentCard,
          {
            backgroundColor: "#FAF5E8",
            borderColor: colors.gold,
            shadowColor: colors.primary,
          },
        ]}
      >
        {/* Ornamen Gulungan Atas */}
        <View style={styles.scrollRollTop}>
          <View style={[styles.scrollRod, { backgroundColor: colors.gold }]} />
        </View>

        <View style={styles.parchmentBody}>
          {/* Header Gulungan */}
          <View style={styles.headerRow}>
            <View style={styles.titleBadge}>
              <Text style={{ fontSize: 13, marginRight: 4 }}>📜</Text>
              <Text style={[styles.titleBadgeText, { color: colors.goldForeground }]}>
                Materi Terdekat
              </Text>
            </View>

            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setMinimized(true);
                }}
                hitSlop={8}
                style={styles.controlBtn}
              >
                <Feather name="minimize-2" size={13} color="#8A7340" />
              </Pressable>
              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.selectionAsync();
                  setDismissed(true);
                }}
                hitSlop={8}
                style={styles.controlBtn}
              >
                <Feather name="x" size={13} color="#8A7340" />
              </Pressable>
            </View>
          </View>

          {/* Info Kajian */}
          <Pressable
            onPress={() => {
              router.push(`/kajian/${kajian.id}`);
            }}
            style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          >
            <Text style={styles.kajianJudul} numberOfLines={1}>
              {kajian.judul}
            </Text>
            <Text style={styles.kajianSub} numberOfLines={1}>
              {kajian.ustadz} · {kajian.hari}
            </Text>

            {/* Isi Materi Sampai Mana */}
            <View style={styles.progressBox}>
              <View style={styles.progressLabelRow}>
                <Feather name="bookmark" size={11} color="#8A7340" />
                <Text style={styles.progressLabel}>
                  {tanggalKajian && parseDateStr(tanggalKajian)
                    ? `Materi untuk kajian ${formatMasehi(parseDateStr(tanggalKajian)!)}:`
                    : "Materi terakhir sampai:"}
                </Text>
              </View>
              <Text style={styles.progressText} numberOfLines={2}>
                {progressText || "Belum ada catatan materi dari pengajar."}
              </Text>
            </View>
          </Pressable>

          {/* Footer tap */}
          <Pressable
            onPress={() => router.push(`/kajian/${kajian.id}`)}
            style={styles.footerLink}
          >
            <Text style={styles.footerLinkText}>Buka Detail Kajian</Text>
            <Feather name="chevron-right" size={12} color="#8A7340" />
          </Pressable>
        </View>

        {/* Ornamen Gulungan Bawah */}
        <View style={styles.scrollRollBottom}>
          <View style={[styles.scrollRod, { backgroundColor: colors.gold }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  floatingWrap: {
    position: "absolute",
    zIndex: 99,
  },
  minimizedBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    position: "relative",
  },
  scrollEmoji: {
    fontSize: 22,
  },
  minimizedDot: {
    position: "absolute",
    top: 3,
    right: 3,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  parchmentCard: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  scrollRollTop: {
    height: 6,
    backgroundColor: "#F3ECD6",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollRollBottom: {
    height: 6,
    backgroundColor: "#F3ECD6",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollRod: {
    width: "92%",
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
  parchmentBody: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  titleBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(201,162,39,0.2)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  titleBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  controlBtn: {
    padding: 4,
    borderRadius: 4,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  kajianJudul: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#2C2208",
    marginBottom: 1,
  },
  kajianSub: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#6B582C",
    marginBottom: 8,
  },
  progressBox: {
    backgroundColor: "rgba(201,162,39,0.12)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.3)",
    padding: 8,
  },
  progressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 3,
  },
  progressLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#6B582C",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#2C2208",
    lineHeight: 17,
  },
  footerLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 2,
    marginTop: 6,
  },
  footerLinkText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#8A7340",
  },
});
