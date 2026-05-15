import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useNotes } from "@/context/NotesContext";
import { useMudzakarah } from "@/context/MudzakarahContext";
import { useColors } from "@/hooks/useColors";
import { DUMMY_KAJIAN } from "@/services/dummyData";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

interface SettingItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingItem({ icon, label, value, onPress, danger }: SettingItemProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.settingItem,
        { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.settingIcon, { backgroundColor: danger ? "#FEE8E8" : colors.highlight }]}>
        <Feather name={icon} size={16} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.settingLabel, { color: danger ? colors.destructive : colors.foreground }]}>
        {label}
      </Text>
      <View style={styles.settingRight}>
        {value && (
          <Text style={[styles.settingValue, { color: colors.mutedForeground }]}>{value}</Text>
        )}
        {onPress && (
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        )}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, signOut } = useAuth();
  const { notes } = useNotes();
  const { topics } = useMudzakarah();

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);
  const bottomInset = insets.bottom + (Platform.OS === "web" ? 34 : 0);

  const handleLogout = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      Alert.alert("Keluar", "Yakin ingin keluar dari akun?", [
        { text: "Batal", style: "cancel" },
        {
          text: "Keluar",
          style: "destructive",
          onPress: () => signOut(),
        },
      ]);
    } else {
      const ok = window.confirm("Yakin ingin keluar dari akun?");
      if (ok) signOut();
    }
  };

  const activeKajian = DUMMY_KAJIAN.filter((k) => k.status === "aktif").length;
  const myTopics = topics.filter((t) => t.authorName === user?.nama).length;

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 90 }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={[
          styles.profileHeader,
          { backgroundColor: colors.primary, paddingTop: topInset + 16 },
        ]}
      >
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <View style={[styles.avatar, { backgroundColor: "rgba(255,255,255,0.25)" }]}>
          <Text style={styles.avatarLetter}>
            {(user?.nama ?? "M").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.nama ?? "Muslimah"}</Text>
        <Text style={styles.email}>{user?.email ?? ""}</Text>
        {user?.bergabungSejak && (
          <Text style={styles.since}>
            Bergabung {formatDate(user.bergabungSejak)}
          </Text>
        )}
      </View>

      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statCol}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{activeKajian}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Kajian Rutin</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.statCol}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{notes.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Catatan</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.statCol}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{myTopics}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Mudzakarah</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AKTIVITAS</Text>
        <View style={[styles.settingGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingItem
            icon="book-open"
            label="Semua Kajian"
            value={`${DUMMY_KAJIAN.length} kajian`}
            onPress={() => router.push("/(tabs)")}
          />
          <SettingItem
            icon="edit-3"
            label="Catatan Saya"
            value={`${notes.length} catatan`}
            onPress={() => router.push("/(tabs)/notes")}
          />
          <SettingItem
            icon="message-circle"
            label="Mudzakarah"
            value={`${topics.length} topik`}
            onPress={() => router.push("/(tabs)/mudzakarah")}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TENTANG</Text>
        <View style={[styles.settingGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingItem icon="info" label="Versi Aplikasi" value="1.0.0" />
          <SettingItem icon="heart" label="Mulazamahku" value="Thalabul 'Ilmi" />
        </View>
      </View>

      <View style={styles.section}>
        <View style={[styles.settingGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingItem
            icon="log-out"
            label="Keluar"
            onPress={handleLogout}
            danger
          />
        </View>
      </View>

      <Text style={[styles.footer, { color: colors.mutedForeground }]}>
        "Menuntut ilmu itu wajib atas setiap muslim."
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  profileHeader: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  headerLogo: {
    width: 64,
    height: 64,
    marginBottom: 12,
    opacity: 0.9,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  avatarLetter: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  name: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.75)",
    marginBottom: 4,
  },
  since: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.6)",
  },
  statsCard: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: -20,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statCol: {
    flex: 1,
    alignItems: "center",
  },
  statNum: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    textAlign: "center",
  },
  divider: {
    width: 1,
    marginVertical: 4,
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  settingGroup: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    gap: 12,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
  settingRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  settingValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  footer: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    fontStyle: "italic",
    marginHorizontal: 32,
    marginTop: 28,
    lineHeight: 18,
  },
});
