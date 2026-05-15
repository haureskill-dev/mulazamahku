import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [nameFocus, setNameFocus] = useState(false);
  const [emailFocus, setEmailFocus] = useState(false);

  const handleSignIn = async () => {
    if (!name.trim() || !email.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    await signIn(name.trim(), email.trim());
    router.replace("/(tabs)");
  };

  const isValid = name.trim().length > 0 && email.trim().length > 2;

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

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
});
