import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { StorageService } from "@/services/storage";
import { UserProfile, UserRole } from "@/types";
import { supabase } from "@/services/supabase";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";

WebBrowser.maybeCompleteAuthSession();

// Kode akses per peran
const ACCESS_CODES: Record<UserRole, string> = {
  murid: "fiqh akbar",
  pengajar: "unta merah",
  admin: "khidmat ustadzah",
};

const DEV_ACCESS_CODE = "Haura Salsabila's Apps Developer @MULAZAMAHKU.";

const ROLE_INFO: Record<UserRole, { label: string; icon: string; desc: string }> = {
  murid: { label: "Murid", icon: "book-open", desc: "Ikuti kajian & lihat jadwal" },
  pengajar: { label: "Pengajar", icon: "award", desc: "Catat progress materi" },
  admin: { label: "Admin", icon: "settings", desc: "Kelola jadwal & flyer" },
};

const MULAZAMAH_MUTIARA: { arabic?: string; text?: string; source?: string }[] = [
  {
    arabic: "وصحبة أستاذ • وطول زمان\nوملازمة أستاذ • وطول زمان",
    source: "ديوان الشافعي",
  },
  {
    arabic: "من ثبت نبت",
    text: "Barang siapa yang menetap, maka dia akan tumbuh.",
  },
  {
    arabic: "الذي يربي الناس بصغار العلم قبل كباره",
    source: "الإمام البخاري رحمه الله",
  },
  {
    arabic:
      "العلم على ثلاثة أشبار؛ من دخل في شبر الأول تكبر، ومن دخل في شبر الثاني تواضع، ومن دخل في شبر الثالث يعلم أنه لا يعلم",
    source: "الشيخ بكر بن زيد رحمه الله",
  },
  {
    text: "Jangan tergesa-gesa dan cepat bosan, ikhlash, sabar, tempuh cara yang benar, dan istiqomah dalam menuntut ilmu.",
  },
  {
    text: "Jangan seperti orang yang fanatik (taassub) karena ini dilarang dalam agama kita.",
  },
  {
    text: "Allah Azza wa Jalla adalah pemilik waktu, Allah yang akan atur untuk kita. Mohonlah kepada Allah keberkahan waktu dan usia.",
  },
  {
    arabic: "خير الناس من طال عمره وحسن عمله",
  },
  {
    text: "Adab seorang penuntut ilmu dalam menyikapi kesalahan sang muallim.",
  },
  {
    arabic: "ما لا يدرك كله لا يدرك جله",
  },
  {
    arabic: "العلم لا يعادله شيء لمن صحت نيته",
    source: "الإمام أحمد رحمه الله",
  },
  {
    arabic: "إنما العلم يأتى ولم يأتي",
    source: "ابن عباس رضي الله عنهما",
  },
];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  // ── Step state ──────────────────────────────────────────────
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [isDevGate, setIsDevGate] = useState(false);

  // ── Gate state ──────────────────────────────────────────────
  const [gateVerified, setGateVerified] = useState<boolean | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [gateError, setGateError] = useState(false);
  const [gateFocus, setGateFocus] = useState(false);
  const [gateLoading, setGateLoading] = useState(false);
  const [shakeAnim] = useState(() => new Animated.Value(0));

  // ── Login state ─────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [showLanding, setShowLanding] = useState(true);
  const [activeMutiaraIdx, setActiveMutiaraIdx] = useState(0);
  const morphAnim = useRef(new Animated.Value(1)).current;
  const orbAnim = useRef(new Animated.Value(0)).current;

  const morphToIndex = useCallback(
    (nextIdx: number) => {
      Animated.timing(morphAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== "web",
      }).start(() => {
        setActiveMutiaraIdx(nextIdx);
        Animated.timing(morphAnim, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: Platform.OS !== "web",
        }).start();
      });
    },
    [morphAnim]
  );

  // Animasi morphing otomatis & orb cahaya lembut di Landing Page
  useEffect(() => {
    if (!showLanding) return;
    const orbLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
        Animated.timing(orbAnim, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: Platform.OS !== "web",
        }),
      ])
    );
    orbLoop.start();

    const interval = setInterval(() => {
      morphToIndex((activeMutiaraIdx + 1) % MULAZAMAH_MUTIARA.length);
    }, 5200);

    return () => {
      orbLoop.stop();
      clearInterval(interval);
    };
  }, [showLanding, activeMutiaraIdx, morphToIndex, orbAnim]);

  // Check if user already passed the gate before
  useEffect(() => {
    StorageService.get<string>(StorageService.ACCESS_GATE_KEY).then((v) => {
      if (v && (v === "murid" || v === "pengajar" || v === "admin")) {
        setSelectedRole(v as UserRole);
        setGateVerified(true);
      } else if (v === true as any) {
        // Legacy: user lama yang sudah verify dengan sistem lama
        setSelectedRole("murid");
        setGateVerified(true);
      } else {
        setGateVerified(false);
      }
    });
  }, []);

  // ── Gate handlers ───────────────────────────────────────────
  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -12, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const handleGateSubmit = async () => {
    if (!accessCode.trim() || (!selectedRole && !isDevGate)) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGateLoading(true);
    await new Promise((r) => setTimeout(r, 400));

    if (isDevGate) {
      if (accessCode.trim().toLowerCase() === DEV_ACCESS_CODE.toLowerCase()) {
        await StorageService.set(StorageService.ACCESS_GATE_KEY, "admin");
        await signIn("Developer", "developer@mulazamahku.com", "admin", { isDeveloper: true });
        setGateError(false);
        setGateLoading(false);
        router.replace("/(tabs)");
      } else {
        setGateError(true);
        setGateLoading(false);
        triggerShake();
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      return;
    }

    if (selectedRole && accessCode.trim().toLowerCase() === ACCESS_CODES[selectedRole]) {
      await StorageService.set(StorageService.ACCESS_GATE_KEY, selectedRole);
      setGateVerified(true);
      setGateError(false);
    } else {
      setGateError(true);
      setGateLoading(false);
      triggerShake();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  // ── Listen for OAuth callback on web ────────────────────────
  useEffect(() => {
    if (Platform.OS !== "web") return;

    const handleWebAuth = async (session: any) => {
      if (!session?.user) return;
      
      let role: UserRole = "murid";
      const savedRole = await StorageService.get<string>(StorageService.ACCESS_GATE_KEY);
      if (savedRole && (savedRole === "murid" || savedRole === "pengajar" || savedRole === "admin")) {
        role = savedRole as UserRole;
      } else if (selectedRole) {
        role = selectedRole;
      }

      let userName = session.user.user_metadata?.full_name || "Pengguna Google";
      const userEmail = session.user.email || "google@user.com";

      // Pertahankan nama yang sudah diubah oleh user di profile
      const existingUser = await StorageService.get<UserProfile>(StorageService.USER_KEY);
      if (existingUser && existingUser.email === userEmail && existingUser.nama) {
        userName = existingUser.nama;
      }

      await signIn(userName, userEmail, role);
      router.replace("/(tabs)");
    };

    // Cek session saat ini jika baru saja redirect dari Google
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) handleWebAuth(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session) {
        handleWebAuth(session);
      }
    });

    return () => subscription.unsubscribe();
  }, [selectedRole]);

  // ── Login handler (Google OAuth) ───────────────────────────
  const handleGoogleSignIn = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);

    try {
      if (Platform.OS === "web") {
        // Web: redirect langsung di browser (bukan popup)
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: window.location.origin,
            queryParams: { prompt: "select_account" },
          },
        });
        if (error) {
          Alert.alert("Google Login Gagal", error.message);
          setLoading(false);
        }
        // Browser akan redirect, loading tetap true
        return;
      }

      // Native: buka browser popup
      const redirectUrl = Linking.createURL("/");
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl,
          queryParams: { prompt: "select_account" },
        },
      });

      if (error) {
        Alert.alert("Google Login Gagal", error.message);
      } else if (data.url) {
        const result = await WebBrowser.openAuthSessionAsync(data.url, redirectUrl);

        if (result.type === "success" && result.url) {
          const urlStr = result.url.replace("#", "?");
          const parsedUrl = Linking.parse(urlStr);
          
          const accessToken = parsedUrl.queryParams?.access_token;
          const refreshToken = parsedUrl.queryParams?.refresh_token;

          if (accessToken && refreshToken) {
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken as string,
              refresh_token: refreshToken as string,
            });

            if (sessionError) {
               Alert.alert("Gagal Set Sesi", sessionError.message);
               return;
            }

            const { data: userData } = await supabase.auth.getUser();
            const userName = userData.user?.user_metadata?.full_name || "Pengguna Google";
            const userEmail = userData.user?.email || "google@user.com";

            await signIn(userName, userEmail, selectedRole!);
            router.replace("/(tabs)");
          } else {
             Alert.alert("Login Dibatalkan / Gagal", "Pesan dari server:\n" + result.url);
          }
        } else {
           if (result.type !== "cancel") {
             Alert.alert("Info", "Login dibatalkan atau gagal diproses browser. (" + result.type + ")");
           }
        }
      }
    } catch (e) {
      Alert.alert("Error", "Gagal membuka autentikasi Google.");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const role = selectedRole || "murid";
    const defaultNames: Record<UserRole, string> = {
      murid: "Thalibul Ilmi",
      pengajar: "Ustadzah Rubeya Litiloly",
      admin: "Pengelola Mulazamah",
    };
    await StorageService.set(StorageService.ACCESS_GATE_KEY, role);
    await signIn(defaultNames[role], `${role}@mulazamahku.com`, role);
    router.replace("/(tabs)");
  };

  // ── Loading state ───────────────────────────────────────────
  if (gateVerified === null) {
    return (
      <View style={[styles.loadingRoot, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={[styles.root, { backgroundColor: colors.background }]}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + 40,
            paddingBottom: insets.bottom + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandArea}>
          <View style={styles.logoContainer}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>
          <Text style={[styles.appName, { color: colors.isDark ? "#FFFFFF" : colors.primary }]}>
            Mulazamahku
          </Text>
          <Text style={[styles.tagline, { color: colors.isDark ? "#F5E6A3" : "#3399B8", fontSize: 12.5 }]}>
            Bersama Ustadzah Rubeya Litiloly, S.Kom. حفظها الله
          </Text>
        </View>

        {/* ════════════════════════════════════════════════════════════════
            LANDING PAGE — KONTEN MUTIARA MULAZAMAHKU (MORPHING & ELEGAN)
            ════════════════════════════════════════════════════════════════ */}
        {showLanding ? (
          <View style={{ width: "100%", maxWidth: 640, alignSelf: "center", gap: 18 }}>
            {/* Hero Morphing Spotlight Banner */}
            <LinearGradient
              colors={colors.isDark ? ["#0D152B", "#1E2F5D"] : ["#14203B", "#2B4073"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              {/* Cahaya latar belakang yang bergerak halus (morph glow) */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.heroGlowOrb,
                  {
                    opacity: orbAnim.interpolate({ inputRange: [0, 1], outputRange: [0.14, 0.28] }),
                    transform: [
                      { scale: orbAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.18] }) },
                      { translateY: orbAnim.interpolate({ inputRange: [0, 1], outputRange: [-8, 10] }) },
                    ],
                  },
                ]}
              />

              <View style={styles.heroBadge}>
                <Text style={styles.heroBadgeText}>✦ الملازمة وطلب العلم ✦</Text>
              </View>

              {/* Bait Utama Diwan Asy-Syafi'i & Motto */}
              <Text style={styles.heroArabicMain}>
                وصحبة أستاذ • وطول زمان{"\n"}وملازمة أستاذ • وطول زمان
              </Text>
              <Text style={styles.heroArabicAuthor}>— ديوان الشافعي —</Text>

              <View style={styles.heroDivider} />

              <Text style={styles.heroMottoArabic}>من ثبت نبت</Text>
              <Text style={styles.heroMottoMeaning}>
                "Barang siapa yang menetap, maka dia akan tumbuh."
              </Text>

              {/* Panggung Morphing Kalam Ulama (berganti halus otomatis & bisa diklik) */}
              <View style={styles.morphStageWrap}>
                <Animated.View
                  style={[
                    styles.morphStageInner,
                    {
                      opacity: morphAnim,
                      transform: [
                        {
                          scale: morphAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.93, 1],
                          }),
                        },
                        {
                          translateY: morphAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [12, 0],
                          }),
                        },
                      ],
                    },
                  ]}
                >
                  {MULAZAMAH_MUTIARA[activeMutiaraIdx].arabic && (
                    <Text style={styles.morphStageArabic}>
                      {MULAZAMAH_MUTIARA[activeMutiaraIdx].arabic}
                    </Text>
                  )}
                  {MULAZAMAH_MUTIARA[activeMutiaraIdx].text && (
                    <Text style={styles.morphStageText}>
                      {MULAZAMAH_MUTIARA[activeMutiaraIdx].text}
                    </Text>
                  )}
                  {MULAZAMAH_MUTIARA[activeMutiaraIdx].source && (
                    <Text style={styles.morphStageSource}>
                      — {MULAZAMAH_MUTIARA[activeMutiaraIdx].source}
                    </Text>
                  )}
                </Animated.View>

                {/* Indikator pill yang membesar/mengecil (morphing dots) */}
                <View style={styles.morphDotsRow}>
                  {MULAZAMAH_MUTIARA.map((_, i) => {
                    const isActive = i === activeMutiaraIdx;
                    return (
                      <Pressable
                        key={i}
                        onPress={() => morphToIndex(i)}
                        hitSlop={6}
                        style={[
                          styles.morphDot,
                          isActive ? styles.morphDotActive : styles.morphDotInactive,
                        ]}
                      />
                    );
                  })}
                </View>
              </View>

              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowLanding(false);
                }}
                style={({ pressed }) => [
                  styles.heroCtaBtn,
                  { opacity: pressed ? 0.9 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
                ]}
              >
                <Text style={styles.heroCtaText}>Masuk ke Aplikasi</Text>
                <Feather name="arrow-right" size={17} color="#1A2744" />
              </Pressable>
            </LinearGradient>

            {/* Daftar Lengkap Kalam Ulama & Adab Menuntut Ilmu */}
            <View style={[styles.mutiaraSectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.mutiaraHeaderRow}>
                <View style={[styles.mutiaraLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.mutiaraSectionTitle, { color: colors.gold }]}>
                  ✦ UNTAIAN MUTIARA MULAZAMAH ✦
                </Text>
                <View style={[styles.mutiaraLine, { backgroundColor: colors.border }]} />
              </View>

              <View style={{ gap: 14 }}>
                {MULAZAMAH_MUTIARA.map((item, idx) => {
                  const isSpotlit = idx === activeMutiaraIdx;
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => morphToIndex(idx)}
                      style={({ pressed }) => [
                        styles.mutiaraBox,
                        {
                          backgroundColor: isSpotlit ? colors.highlight : colors.surface,
                          borderColor: isSpotlit ? colors.gold : colors.border,
                          borderLeftColor: colors.gold,
                          transform: [{ scale: pressed ? 0.985 : isSpotlit ? 1.01 : 1 }],
                        },
                      ]}
                    >
                      {item.arabic && (
                        <Text
                          style={[
                            styles.mutiaraArabic,
                            { color: colors.isDark ? "#F5E6A3" : colors.primary },
                          ]}
                        >
                          {item.arabic}
                        </Text>
                      )}
                      {item.text && (
                        <Text style={[styles.mutiaraText, { color: colors.foreground }]}>
                          {item.text}
                        </Text>
                      )}
                      {item.source && (
                        <View style={styles.mutiaraSourceRow}>
                          <View style={[styles.mutiaraSourcePill, { backgroundColor: "rgba(201,162,39,0.16)" }]}>
                            <Text style={[styles.mutiaraSource, { color: colors.gold }]}>
                              {item.source}
                            </Text>
                          </View>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>

              <Pressable
                onPress={() => {
                  if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setShowLanding(false);
                }}
                style={({ pressed }) => [
                  styles.btn,
                  { backgroundColor: colors.primary, marginTop: 20, opacity: pressed ? 0.88 : 1 },
                ]}
              >
                <View style={styles.btnInner}>
                  <Text style={[styles.btnText, { color: "#FFFFFF" }]}>Mulai Menuntut Ilmu</Text>
                  <Feather name="arrow-right" size={17} color="#FFFFFF" />
                </View>
              </Pressable>
            </View>
          </View>
        ) : !selectedRole && !isDevGate ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Pressable
              onPress={() => setShowLanding(true)}
              style={styles.backBtn}
            >
              <Feather name="arrow-left" size={15} color={colors.accentText} />
              <Text style={[styles.backText, { color: colors.accentText }]}>Halaman Mutiara Mulazamah</Text>
            </Pressable>
            <Text style={[styles.cardTitle, { color: colors.foreground, textAlign: "center", marginTop: 8 }]}>
              Pilih Peran Anda
            </Text>
            <Text style={[styles.gateSubtitle, { color: colors.mutedForeground }]}>
              Pilih peran sesuai dengan posisi Anda di halaqah kajian
            </Text>

            {(["murid", "pengajar", "admin"] as UserRole[]).map((role) => {
              const info = ROLE_INFO[role];
              return (
                <Pressable
                  key={role}
                  onPress={() => {
                    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedRole(role);
                  }}
                  style={({ pressed }) => [
                    styles.roleCard,
                    {
                      backgroundColor: pressed ? colors.highlight : colors.surface,
                      borderColor: colors.border,
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }],
                    },
                  ]}
                >
                  <View style={[styles.roleIconWrap, { backgroundColor: `${colors.primary}15` }]}>
                    <Feather name={info.icon as any} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.roleTextWrap}>
                    <Text style={[styles.roleLabel, { color: colors.foreground }]}>{info.label}</Text>
                    <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>{info.desc}</Text>
                  </View>
                  <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                </Pressable>
              );
            })}

            {/* Opsi Akun Developer */}
            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsDevGate(true);
              }}
              style={({ pressed }) => [
                styles.roleCard,
                {
                  backgroundColor: pressed ? colors.highlight : "transparent",
                  borderColor: colors.gold,
                  borderStyle: "dashed",
                  marginTop: 4,
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <View style={[styles.roleIconWrap, { backgroundColor: "rgba(201,162,39,0.16)" }]}>
                <Feather name="terminal" size={18} color={colors.gold} />
              </View>
              <View style={styles.roleTextWrap}>
                <Text style={[styles.roleLabel, { color: colors.foreground }]}>Akun Developer</Text>
                <Text style={[styles.roleDesc, { color: colors.mutedForeground }]}>
                  Switch peran instan & pantau pengguna bergabung
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.gold} />
            </Pressable>
          </View>
        ) : !gateVerified ? (
          /* ════════════════════════════════════════════════════════════════
             STEP 2 — ACCESS GATE (Kode Akses per Peran / Developer)
             ════════════════════════════════════════════════════════════════ */
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                transform: [{ translateX: shakeAnim }],
              },
            ]}
          >
            <Pressable
              onPress={() => {
                setSelectedRole(null);
                setIsDevGate(false);
                setAccessCode("");
                setGateError(false);
              }}
              style={styles.backBtn}
            >
              <Feather name="arrow-left" size={16} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>Kembali</Text>
            </Pressable>

            <View style={styles.gateIconRow}>
              <View style={[styles.gateIconCircle, { backgroundColor: isDevGate ? "rgba(201,162,39,0.16)" : `${colors.primary}15` }]}>
                <Feather name={isDevGate ? "terminal" : "lock"} size={24} color={isDevGate ? colors.gold : colors.primary} />
              </View>
            </View>

            <Text style={[styles.cardTitle, { color: colors.foreground, textAlign: "center" }]}>
              {isDevGate ? "Akses Akun Developer" : `Kode Akses ${ROLE_INFO[selectedRole!].label}`}
            </Text>
            <Text
              style={[styles.gateSubtitle, { color: colors.mutedForeground }]}
            >
              {isDevGate
                ? "Masukkan kode akses developer untuk masuk dan berpindah peran tanpa kode akses."
                : `Masukkan kode akses ${ROLE_INFO[selectedRole!].label.toLowerCase()} yang diberikan oleh pengelola untuk melanjutkan.`}
            </Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Kode Akses</Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.surface,
                    borderColor: gateError
                      ? "#EF4444"
                      : gateFocus
                      ? colors.primary
                      : colors.border,
                  },
                ]}
              >
                <Feather
                  name="key"
                  size={16}
                  color={
                    gateError
                      ? "#EF4444"
                      : gateFocus
                      ? colors.primary
                      : colors.mutedForeground
                  }
                />
                <TextInput
                  value={accessCode}
                  onChangeText={(t) => {
                    setAccessCode(t);
                    if (gateError) setGateError(false);
                  }}
                  placeholder="Masukkan kode akses"
                  placeholderTextColor={colors.mutedForeground}
                  onFocus={() => setGateFocus(true)}
                  onBlur={() => setGateFocus(false)}
                  style={[styles.input, { color: colors.foreground }]}
                  autoCapitalize="none"
                  secureTextEntry
                  onSubmitEditing={handleGateSubmit}
                  returnKeyType="go"
                />
              </View>
              {gateError && (
                <View style={styles.errorRow}>
                  <Feather name="alert-circle" size={13} color="#EF4444" />
                  <Text style={styles.errorText}>
                    Kode akses salah. Silakan coba lagi.
                  </Text>
                </View>
              )}
            </View>

            <Pressable
              onPress={handleGateSubmit}
              disabled={!accessCode.trim() || gateLoading}
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: accessCode.trim()
                    ? colors.primary
                    : colors.muted,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              {gateLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.btnInner}>
                  <Feather name="unlock" size={16} color={accessCode.trim() ? "#FFFFFF" : colors.mutedForeground} />
                  <Text
                    style={[
                      styles.btnText,
                      {
                        color: accessCode.trim()
                          ? colors.primaryForeground
                          : colors.mutedForeground,
                      },
                    ]}
                  >
                    Verifikasi
                  </Text>
                </View>
              )}
            </Pressable>
          </Animated.View>
        ) : (
          /* ════════════════════════════════════════════════════════════════
             STEP 3 — LOGIN FORM
             ════════════════════════════════════════════════════════════════ */
          <View style={styles.loginFormContainer}>
            <Pressable
              onPress={() => {
                setSelectedRole(null);
                setGateVerified(false);
              }}
              style={[styles.backBtn, { alignSelf: "center", marginBottom: 16 }]}
            >
              <Feather name="arrow-left" size={15} color={colors.accentText} />
              <Text style={[styles.backText, { color: colors.accentText }]}>Ganti Peran / Mutiara Mulazamah</Text>
            </Pressable>
            <View style={{ alignItems: "center", marginBottom: 32 }}>
              <Feather name="log-in" size={36} color="#3399B8" style={{ marginBottom: 12 }} />
              <Text style={{ fontSize: 18, fontFamily: "Inter_600SemiBold", color: colors.foreground, textAlign: "center", marginBottom: 6 }}>
                Masuk ke Aplikasi
              </Text>
              <Text style={{ fontSize: 14, fontFamily: "Inter_400Regular", color: colors.mutedForeground, textAlign: "center", paddingHorizontal: 12 }}>
                Gunakan akun Google Anda untuk melanjutkan.
              </Text>
            </View>

            <Pressable
              onPress={handleGoogleSignIn}
              disabled={loading}
              style={({ pressed }) => [
                {
                  backgroundColor: "#FFFFFF",
                  borderWidth: 1.5,
                  borderColor: "#E5E7EB",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  height: 50,
                  borderRadius: 25,
                  paddingHorizontal: 20,
                  alignSelf: "center",
                  minWidth: 260,
                  shadowColor: "#000",
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 3,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#555555" size="small" />
              ) : (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Ionicons name="logo-google" size={18} color="#EA4335" />
                  <Text numberOfLines={1} style={{ color: "#374151", fontSize: 14, fontFamily: "Inter_600SemiBold" }}>
                    Masuk dengan Google
                  </Text>
                </View>
              )}
            </Pressable>

            <Pressable
              onPress={handleDemoSignIn}
              style={({ pressed }) => [
                {
                  marginTop: 14,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  borderRadius: 25,
                  borderWidth: 1.5,
                  borderColor: colors.primary,
                  backgroundColor: pressed ? "rgba(43, 90, 142, 0.08)" : "transparent",
                  alignSelf: "center",
                },
              ]}
            >
              <Feather name="arrow-right-circle" size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: 13, fontFamily: "Inter_600SemiBold" }}>
                Masuk Langsung ({ROLE_INFO[selectedRole || "murid"].label})
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.quoteRow}>
          <Text style={[styles.quoteText, { color: colors.foreground }]}>
            "Belajar sistematis di bawah bimbingan{"\n"}seorang guru."
          </Text>
        </View>

        <View style={styles.copyrightRow}>
          <Text style={[styles.copyrightText, { color: colors.foreground }]}>
            © Mulazamahku 1447 H
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  root: { flex: 1 },
  container: {
    paddingHorizontal: 24,
    alignItems: "center",
  },
  brandArea: {
    alignItems: "center",
    marginBottom: 22,
  },
  logoContainer: {
    width: 92,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  logoImage: {
    width: "100%",
    height: "100%",
  },
  appName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 2,
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    marginTop: 0,
  },
  loginFormContainer: {
    width: "100%",
    paddingHorizontal: 16,
    marginTop: 24,
  },
  mockupInputWrap: {
    borderWidth: 2,
    borderRadius: 30,
    height: 52,
    paddingHorizontal: 20,
    marginBottom: 16,
    justifyContent: "center",
  },
  mockupInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
  forgotText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#888888",
    textAlign: "center",
    marginBottom: 24,
  },
  mockupBtn: {
    height: 52,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    paddingHorizontal: 48,
    marginBottom: 40,
  },
  mockupBtnText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  quoteRow: {
    marginTop: 32,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  quoteText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    textAlign: "center",
  },
  copyrightRow: {
    marginTop: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  copyrightText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  card: {
    width: "100%",
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    marginBottom: 20,
  },

  // ── Role selection ──────────────────────────────────────────
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 10,
    gap: 14,
  },
  roleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  roleTextWrap: {
    flex: 1,
  },
  roleLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
  },
  roleDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },

  // ── Role badge (login form) ─────────────────────────────────
  roleBadgeRow: {
    alignItems: "center",
    marginBottom: 12,
  },
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },

  // ── Back button ─────────────────────────────────────────────
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  backText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },

  // ── Gate specific ───────────────────────────────────────────
  gateIconRow: {
    alignItems: "center",
    marginBottom: 16,
  },
  gateIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  gateSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#EF4444",
  },

  // ── Shared ──────────────────────────────────────────────────
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 12,
    gap: 10,
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  btn: {
    height: 50,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  btnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  infoText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
    paddingRight: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#A1A1AA",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxLabel: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
  },
  heroCard: {
    width: "100%",
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: "rgba(201,162,39,0.55)",
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
  heroGlowOrb: {
    position: "absolute",
    top: -40,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: "#E8C766",
  },
  heroBadge: {
    backgroundColor: "rgba(201,162,39,0.22)",
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.55)",
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 18,
  },
  heroBadgeText: {
    fontSize: 13.5,
    fontFamily: "Inter_700Bold",
    color: "#F5E6A3",
    letterSpacing: 0.6,
  },
  heroArabicMain: {
    fontSize: 27,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    lineHeight: 44,
    textAlign: "center",
  },
  heroArabicAuthor: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#E8C766",
    marginTop: 8,
  },
  heroDivider: {
    width: 72,
    height: 1.5,
    backgroundColor: "rgba(201,162,39,0.5)",
    marginVertical: 18,
  },
  heroMottoArabic: {
    fontSize: 29,
    fontFamily: "Inter_700Bold",
    color: "#F5E6A3",
    lineHeight: 42,
    textAlign: "center",
  },
  heroMottoMeaning: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    color: "rgba(255,255,255,0.88)",
    textAlign: "center",
    marginTop: 4,
    marginBottom: 18,
  },
  morphStageWrap: {
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,162,39,0.38)",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 20,
    minHeight: 136,
    justifyContent: "space-between",
  },
  morphStageInner: {
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  morphStageArabic: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FFF9E6",
    lineHeight: 36,
    textAlign: "center",
  },
  morphStageText: {
    fontSize: 14.5,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.92)",
    lineHeight: 22,
    textAlign: "center",
  },
  morphStageSource: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#E8C766",
    marginTop: 2,
  },
  morphDotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 14,
  },
  morphDot: {
    height: 7,
    borderRadius: 4,
  },
  morphDotActive: {
    width: 24,
    backgroundColor: "#E8C766",
  },
  morphDotInactive: {
    width: 7,
    backgroundColor: "rgba(255,255,255,0.28)",
  },
  heroCtaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#E8C766",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 26,
    width: "100%",
  },
  heroCtaText: {
    fontSize: 15.5,
    fontFamily: "Inter_700Bold",
    color: "#1A2744",
  },
  mutiaraSectionCard: {
    width: "100%",
    borderRadius: 22,
    borderWidth: 1,
    padding: 20,
  },
  mutiaraHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  mutiaraLine: {
    flex: 1,
    height: 1,
  },
  mutiaraSectionTitle: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  mutiaraBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderLeftWidth: 4,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 8,
  },
  mutiaraArabic: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    lineHeight: 37,
    textAlign: "right",
  },
  mutiaraText: {
    fontSize: 14.5,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    textAlign: "left",
  },
  mutiaraSourceRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  mutiaraSourcePill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 10,
  },
  mutiaraSource: {
    fontSize: 12.5,
    fontFamily: "Inter_600SemiBold",
  },
});
