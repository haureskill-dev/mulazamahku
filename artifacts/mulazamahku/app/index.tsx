import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { UserRole } from "@/types";

// Kode akses per peran
const ACCESS_CODES: Record<UserRole, string> = {
  murid: "fiqh akbar",
  pengajar: "unta merah",
  admin: "khidmat ustadzah",
};

const ROLE_INFO: Record<UserRole, { label: string; icon: string; desc: string }> = {
  murid: { label: "Murid", icon: "book-open", desc: "Ikuti kajian & lihat jadwal" },
  pengajar: { label: "Pengajar", icon: "award", desc: "Catat progress materi" },
  admin: { label: "Admin", icon: "settings", desc: "Kelola jadwal & flyer" },
};

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  // ── Step state ──────────────────────────────────────────────
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // ── Gate state ──────────────────────────────────────────────
  const [gateVerified, setGateVerified] = useState<boolean | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [gateError, setGateError] = useState(false);
  const [gateFocus, setGateFocus] = useState(false);
  const [gateLoading, setGateLoading] = useState(false);
  const [shakeAnim] = useState(() => new Animated.Value(0));

  // ── Login state ─────────────────────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isMuslimah, setIsMuslimah] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nameFocus, setNameFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);

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
    if (!accessCode.trim() || !selectedRole) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGateLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    if (accessCode.trim().toLowerCase() === ACCESS_CODES[selectedRole]) {
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

  // ── Login handler ───────────────────────────────────────────
  const handleSignIn = async () => {
    if (!name.trim() || !email.trim() || !isMuslimah || !selectedRole) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    await signIn(name.trim(), email.trim(), selectedRole);
    router.replace("/(tabs)");
  };

  const isValid = name.trim().length > 0 && email.trim().length > 2 && isMuslimah;

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
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) + 40,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandArea}>
          <Image
            source={require("@/assets/images/logo.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.primary }]}>Mulazamahku</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            Pendamping setia perjalanan menuntut ilmu
          </Text>
        </View>

        {/* ════════════════════════════════════════════════════════════════
            STEP 1 — PILIH PERAN
            ════════════════════════════════════════════════════════════════ */}
        {!selectedRole ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.gateIconRow}>
              <View style={[styles.gateIconCircle, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="users" size={24} color={colors.primary} />
              </View>
            </View>

            <Text style={[styles.cardTitle, { color: colors.foreground, textAlign: "center" }]}>
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
          </View>
        ) : !gateVerified ? (
          /* ════════════════════════════════════════════════════════════════
             STEP 2 — ACCESS GATE (Kode Akses per Peran)
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
                setAccessCode("");
                setGateError(false);
              }}
              style={styles.backBtn}
            >
              <Feather name="arrow-left" size={16} color={colors.primary} />
              <Text style={[styles.backText, { color: colors.primary }]}>Kembali</Text>
            </Pressable>

            <View style={styles.gateIconRow}>
              <View style={[styles.gateIconCircle, { backgroundColor: `${colors.primary}15` }]}>
                <Feather name="lock" size={24} color={colors.primary} />
              </View>
            </View>

            <Text style={[styles.cardTitle, { color: colors.foreground, textAlign: "center" }]}>
              Kode Akses {ROLE_INFO[selectedRole].label}
            </Text>
            <Text
              style={[styles.gateSubtitle, { color: colors.mutedForeground }]}
            >
              Masukkan kode akses {ROLE_INFO[selectedRole].label.toLowerCase()} yang diberikan oleh pengelola untuk melanjutkan.
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
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {/* Role badge */}
            <View style={styles.roleBadgeRow}>
              <View style={[styles.roleBadge, { backgroundColor: `${colors.primary}15`, borderColor: `${colors.primary}30` }]}>
                <Feather name={ROLE_INFO[selectedRole].icon as any} size={12} color={colors.primary} />
                <Text style={[styles.roleBadgeText, { color: colors.primary }]}>
                  {ROLE_INFO[selectedRole].label}
                </Text>
              </View>
            </View>

            <Text style={[styles.cardTitle, { color: colors.foreground }]}>Masuk ke Akun</Text>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Nama</Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.surface,
                    borderColor: nameFocus ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name="user"
                  size={16}
                  color={nameFocus ? colors.primary : colors.mutedForeground}
                />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Nama lengkap kamu"
                  placeholderTextColor={colors.mutedForeground}
                  onFocus={() => setNameFocus(true)}
                  onBlur={() => setNameFocus(false)}
                  style={[styles.input, { color: colors.foreground }]}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.foreground }]}>Email</Text>
              <View
                style={[
                  styles.inputWrap,
                  {
                    backgroundColor: colors.surface,
                    borderColor: emailFocus ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather
                  name="mail"
                  size={16}
                  color={emailFocus ? colors.primary : colors.mutedForeground}
                />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.mutedForeground}
                  onFocus={() => setEmailFocus(true)}
                  onBlur={() => setEmailFocus(false)}
                  style={[styles.input, { color: colors.foreground }]}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>
            </View>

            <Pressable
              onPress={() => {
                if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsMuslimah(!isMuslimah);
              }}
              style={styles.checkboxContainer}
            >
              <View style={[styles.checkbox, isMuslimah && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                {isMuslimah && <Feather name="check" size={14} color="#FFFFFF" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: colors.foreground }]}>
                Saya mengonfirmasi bahwa saya adalah seorang muslimah
              </Text>
            </Pressable>

            <Pressable
              onPress={handleSignIn}
              disabled={!isValid || loading}
              style={({ pressed }) => [
                styles.btn,
                {
                  backgroundColor: isValid ? colors.primary : colors.muted,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text
                  style={[
                    styles.btnText,
                    { color: isValid ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  Masuk
                </Text>
              )}
            </Pressable>
          </View>
        )}

        <View style={styles.infoRow}>
          <Feather name="shield" size={12} color={colors.mutedForeground} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Data tersimpan aman di perangkatmu
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
    marginBottom: 36,
  },
  logoImage: {
    width: 100,
    height: 100,
    marginBottom: 14,
  },
  appName: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 6,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
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
});
