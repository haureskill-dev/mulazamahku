import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
  Easing,
  Modal,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Svg, {
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Path,
  Circle,
  Ellipse,
  G,
} from "react-native-svg";
import { useColors } from "@/hooks/useColors";
import { Kajian } from "@/types";
import { ProgressService, ProgressData } from "@/services/progressService";
import { formatMasehi, parseDateStr } from "@/utils/dates";

interface FloatingScrollParchmentProps {
  kajian: Kajian | null;
  bottomOffset?: number;
}

// Palet perkamen (sengaja tetap hangat di mode terang maupun gelap — ini "benda fisik")
const PAPER = "#FAF5E8";
const PAPER_EDGE = "#EADDB5";
const INK = "#2C2208";
const INK_SOFT = "#6B582C";
const INK_MUTED = "#8A7340";
const WOOD = "#7A4E24";
const WOOD_LIGHT = "#A0703C";
const SEAL = "#A63D2F";

const USE_NATIVE = Platform.OS !== "web";

/**
 * Ikon gulungan kertas klasik elegan (seperti gulungan diploma ber-pita merah, tanpa bingkai/lingkaran).
 */
function ElegantScrollIcon({ hasProgress }: { hasProgress: boolean }) {
  return (
    <Svg width={68} height={68} viewBox="0 0 68 68">
      <Defs>
        <SvgGradient id="paperGrad" x1="0.1" y1="0.1" x2="0.9" y2="0.9">
          <Stop offset="0%" stopColor="#FFFDF5" />
          <Stop offset="60%" stopColor="#F5ECD1" />
          <Stop offset="100%" stopColor="#DECDA0" />
        </SvgGradient>
        <SvgGradient id="paperEndGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#E6D7AE" />
          <Stop offset="100%" stopColor="#B8A372" />
        </SvgGradient>
        <SvgGradient id="ribbonBandGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor="#F0473A" />
          <Stop offset="55%" stopColor="#D92D20" />
          <Stop offset="100%" stopColor="#A61B12" />
        </SvgGradient>
        <SvgGradient id="ribbonTailGrad" x1="0" y1="0" x2="0.5" y2="1">
          <Stop offset="0%" stopColor="#D92D20" />
          <Stop offset="100%" stopColor="#9E1A11" />
        </SvgGradient>
      </Defs>

      {/* Pita ekor kiri & kanan yang menjuntai di bawah gulungan */}
      <Path
        d="M 30 39 L 25 57 L 30 53.5 L 33.5 58.5 L 36 41 Z"
        fill="url(#ribbonTailGrad)"
      />
      <Path
        d="M 35 38 L 38 56.5 L 41.5 52 L 46.5 55 L 40 37 Z"
        fill="url(#ribbonBandGrad)"
      />

      {/* Badan utama gulungan kertas (miring diagonal dari kiri-bawah ke kanan-atas) */}
      <Path
        d="M 15 44 L 41 12 C 44 9.5 50.5 11.5 53.5 15.5 C 56 19 56 23 54 25.5 L 28 57.5 Z"
        fill="url(#paperGrad)"
        stroke="#B5A070"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />

      {/* Garis lipatan kertas di sisi kanan */}
      <Path
        d="M 48 18 L 24 47.5"
        stroke="#C7B282"
        strokeWidth="1"
        opacity={0.65}
      />

      {/* Highlight lembut di sepanjang badan kertas */}
      <Path
        d="M 22 42 L 44 15"
        stroke="#FFFFFF"
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity={0.7}
      />

      {/* Ujung gulungan spiral di kiri bawah */}
      <G transform="rotate(-48 21.5 50.5)">
        <Ellipse
          cx="21.5"
          cy="50.5"
          rx="9.5"
          ry="6.8"
          fill="url(#paperEndGrad)"
          stroke="#9E895A"
          strokeWidth="1.2"
        />
        <Ellipse
          cx="21.5"
          cy="50.5"
          rx="5.5"
          ry="3.8"
          fill="#F5ECD1"
          stroke="#8A7548"
          strokeWidth="1"
        />
        <Ellipse
          cx="21.2"
          cy="50.6"
          rx="2.3"
          ry="1.5"
          fill="#A89364"
        />
      </G>

      {/* Pita merah melingkari tengah gulungan */}
      <Path
        d="M 27.5 29 C 31.5 25.5 39 28 42.5 33.5 L 38 39 C 34.5 34 27 31.5 23 34.5 Z"
        fill="url(#ribbonBandGrad)"
        stroke="#9E1A11"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <Path
        d="M 29.5 28.5 C 33 27 38 29.2 40.5 32.8"
        stroke="#FF857A"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity={0.75}
        fill="none"
      />

      {/* Titik kecil penanda jika ada catatan materi terbaru */}
      {hasProgress && (
        <Circle
          cx="51"
          cy="14"
          r="4"
          fill="#C9A227"
          stroke="#FFFDF5"
          strokeWidth="1.4"
        />
      )}
    </Svg>
  );
}

/**
 * Gulungan kertas mengambang (Floating Parchment):
 * - Dalam keadaan tergulung, melayang naik-turun dengan lembut di pojok kanan bawah.
 * - Saat diklik, gulungan terbuka (animasi unroll) dan menampilkan catatan materi
 *   (progress materi) kajian terdekat — sinkron dengan data progress dari pengajar.
 */
export function FloatingScrollParchment({
  kajian,
  bottomOffset = 80,
}: FloatingScrollParchmentProps) {
  const colors = useColors();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();

  const [progressData, setProgressData] = useState<ProgressData | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [contentH, setContentH] = useState(0);

  // ── Animasi mengambang ───────────────────────────────────────
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: USE_NATIVE,
        }),
      ])
    );
    float.start();
    return () => {
      float.stop();
    };
  }, [floatAnim]);

  // ── Animasi membuka gulungan ─────────────────────────────────
  const openAnim = useRef(new Animated.Value(0)).current;
  const pendingOpen = useRef(false);

  const loadProgress = useCallback(() => {
    if (kajian?.id) {
      ProgressService.get(kajian.id).then(setProgressData);
    }
  }, [kajian?.id]);

  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Jalankan animasi unroll setelah tinggi isi gulungan terukur
  useEffect(() => {
    if (isOpen && contentH > 0 && pendingOpen.current) {
      pendingOpen.current = false;
      openAnim.setValue(0);
      Animated.timing(openAnim, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false, // animasi tinggi tidak didukung native driver
      }).start();
    }
  }, [isOpen, contentH, openAnim]);

  const openScroll = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    loadProgress(); // ambil data terbaru tiap kali dibuka
    pendingOpen.current = true;
    openAnim.setValue(0);
    setIsOpen(true);
    // Jika tinggi isi sudah terukur sebelumnya, effect unroll langsung berjalan saat isOpen berubah
  };

  const closeScroll = (after?: () => void) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    Animated.timing(openAnim, {
      toValue: 0,
      duration: 450,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: false,
    }).start(() => {
      setIsOpen(false);
      after?.();
    });
  };

  if (!kajian) return null;

  const progressText = progressData?.progress?.trim();
  const tanggalKajian = progressData?.tanggal_kajian;
  const tanggalDate = tanggalKajian ? parseDateStr(tanggalKajian) : null;
  const updatedAt = progressData?.updated_at ? new Date(progressData.updated_at) : null;
  const hasProgress = !!progressText;

  const scrollWidth = Math.min(screenWidth - 40, 440);
  const progressMaxH = Math.max(120, screenHeight * 0.32);

  const translateY = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const rotate = floatAnim.interpolate({ inputRange: [0, 1], outputRange: ["-3deg", "3deg"] });
  const shadowScale = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0.72] });
  const shadowOpacity = floatAnim.interpolate({ inputRange: [0, 1], outputRange: [0.28, 0.14] });

  const paperHeight = openAnim.interpolate({ inputRange: [0, 1], outputRange: [0, contentH || 1] });
  const backdropOpacity = openAnim.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, 0.6, 1] });
  const contentOpacity = openAnim.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0, 0, 1] });
  const rodSpin = openAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "540deg"] });
  const scrollScale = openAnim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.85, 1, 1] });

  const Rod = ({ position }: { position: "top" | "bottom" }) => (
    <View style={[styles.rodRow, { width: scrollWidth + 24 }]}>
      <Animated.View style={[styles.rodKnob, { transform: [{ rotate: rodSpin }] }]}>
        <View style={styles.rodKnobInner} />
      </Animated.View>
      <View style={[styles.rod, position === "top" ? styles.rodTopShade : styles.rodBottomShade]}>
        <View style={styles.rodHighlight} />
      </View>
      <Animated.View style={[styles.rodKnob, { transform: [{ rotate: rodSpin }] }]}>
        <View style={styles.rodKnobInner} />
      </Animated.View>
    </View>
  );

  return (
    <>
      {/* ── Gulungan tergulung yang melayang ─────────────────── */}
      {!isOpen && (
        <View
          style={[styles.floatingWrap, { bottom: bottomOffset, right: 18 }]}
          pointerEvents="box-none"
        >
          {/* Bayangan halus di bawah agar terasa benar-benar mengambang */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.groundShadow,
              { opacity: shadowOpacity, transform: [{ scaleX: shadowScale }] },
            ]}
          />
          <Animated.View style={{ transform: [{ translateY }, { rotate }] }}>
            <Pressable
              onPress={openScroll}
              accessibilityRole="button"
              accessibilityLabel="Buka gulungan catatan materi"
              hitSlop={8}
              style={({ pressed }) => ({ transform: [{ scale: pressed ? 0.94 : 1 }] })}
            >
              <ElegantScrollIcon hasProgress={hasProgress} />
            </Pressable>
          </Animated.View>
        </View>
      )}

      {/* ── Gulungan terbuka ─────────────────────────────────── */}
      <Modal visible={isOpen} transparent animationType="none" onRequestClose={() => closeScroll()}>
        <View style={styles.modalRoot}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: colors.isDark ? "rgba(0,0,0,0.72)" : "rgba(15,20,35,0.55)",
                opacity: backdropOpacity,
              },
            ]}
          >
            <Pressable style={StyleSheet.absoluteFill} onPress={() => closeScroll()} />
          </Animated.View>

          <Animated.View style={{ alignItems: "center", transform: [{ scale: scrollScale }] }}>
            <Rod position="top" />

            {/* Kertas yang membuka */}
            <Animated.View
              style={[
                styles.paper,
                { width: scrollWidth, height: paperHeight },
              ]}
            >
              {/* Isi diukur secara absolut agar tinggi aslinya diketahui */}
              <Animated.View
                style={[styles.paperContent, { opacity: contentOpacity }]}
                onLayout={(e) => {
                  const h = Math.ceil(e.nativeEvent.layout.height);
                  if (Math.abs(h - contentH) > 1) setContentH(h);
                }}
              >
                {/* Kepala gulungan */}
                <View style={styles.ornamentRow}>
                  <View style={styles.ornamentLine} />
                  <Text style={styles.ornamentText}>✦ Catatan Materi ✦</Text>
                  <View style={styles.ornamentLine} />
                </View>

                <Text style={styles.kajianJudul}>{kajian.judul}</Text>
                <Text style={styles.kajianSub}>
                  {kajian.ustadz} · {kajian.hari}
                </Text>

                <View style={styles.progressBox}>
                  <View style={styles.progressLabelRow}>
                    <Feather name="bookmark" size={12} color={INK_MUTED} />
                    <Text style={styles.progressLabel}>
                      {tanggalDate
                        ? `Materi untuk kajian ${formatMasehi(tanggalDate)}`
                        : "Materi terakhir sampai"}
                    </Text>
                  </View>
                  <ScrollView
                    style={{ maxHeight: progressMaxH }}
                    nestedScrollEnabled
                    showsVerticalScrollIndicator={false}
                  >
                    <Text style={[styles.progressText, !hasProgress && styles.progressEmpty]}>
                      {progressText || "Belum ada catatan materi dari pengajar."}
                    </Text>
                  </ScrollView>
                </View>

                {updatedAt && (
                  <Text style={styles.updatedText}>
                    Diperbarui {formatMasehi(updatedAt)}
                  </Text>
                )}

                <View style={styles.actionRow}>
                  <Pressable
                    onPress={() => closeScroll()}
                    style={({ pressed }) => [styles.actionBtnGhost, pressed && { opacity: 0.7 }]}
                  >
                    <Feather name="chevrons-up" size={14} color={INK_SOFT} />
                    <Text style={styles.actionGhostText}>Gulung</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => closeScroll(() => router.push(`/kajian/${kajian.id}`))}
                    style={({ pressed }) => [
                      styles.actionBtnPrimary,
                      { backgroundColor: WOOD },
                      pressed && { opacity: 0.85 },
                    ]}
                  >
                    <Text style={styles.actionPrimaryText}>Detail Kajian</Text>
                    <Feather name="chevron-right" size={14} color="#FFF8E7" />
                  </Pressable>
                </View>
              </Animated.View>
            </Animated.View>

            <Rod position="bottom" />
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingWrap: {
    position: "absolute",
    zIndex: 99,
    alignItems: "center",
  },
  groundShadow: {
    position: "absolute",
    bottom: -6,
    width: 44,
    height: 8,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.22)",
  },

  // ── Modal gulungan terbuka ──
  modalRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  rodRow: {
    flexDirection: "row",
    alignItems: "center",
    zIndex: 3,
  },
  rod: {
    flex: 1,
    height: 18,
    borderRadius: 9,
    backgroundColor: WOOD,
    marginHorizontal: -4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  rodTopShade: { borderBottomWidth: 3, borderBottomColor: "#5C3A18" },
  rodBottomShade: { borderTopWidth: 3, borderTopColor: "#5C3A18" },
  rodHighlight: {
    position: "absolute",
    top: 3,
    left: 10,
    right: 10,
    height: 3,
    borderRadius: 2,
    backgroundColor: WOOD_LIGHT,
    opacity: 0.8,
  },
  rodKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#C9A227",
    borderWidth: 2,
    borderColor: "#8A6D12",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 4,
  },
  rodKnobInner: {
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#8A6D12",
  },
  paper: {
    backgroundColor: PAPER,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    borderColor: PAPER_EDGE,
    overflow: "hidden",
    marginVertical: -6,
    zIndex: 1,
  },
  paperContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 20,
  },
  ornamentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  ornamentLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(201,162,39,0.6)",
  },
  ornamentText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: INK_MUTED,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  kajianJudul: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: INK,
    textAlign: "center",
    lineHeight: 24,
  },
  kajianSub: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: INK_SOFT,
    textAlign: "center",
    marginTop: 4,
    marginBottom: 14,
  },
  progressBox: {
    backgroundColor: "rgba(201,162,39,0.10)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.35)",
    borderStyle: "dashed",
    padding: 12,
  },
  progressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  progressLabel: {
    flex: 1,
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: INK_SOFT,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  progressText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: INK,
    lineHeight: 21,
  },
  progressEmpty: {
    fontStyle: "italic",
    color: INK_MUTED,
  },
  updatedText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: INK_MUTED,
    textAlign: "right",
    marginTop: 6,
  },
  actionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    gap: 10,
  },
  actionBtnGhost: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(138,115,64,0.4)",
  },
  actionGhostText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: INK_SOFT,
  },
  actionBtnPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionPrimaryText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: "#FFF8E7",
  },
});
