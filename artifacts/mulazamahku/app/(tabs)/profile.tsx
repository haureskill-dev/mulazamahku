import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useNotes } from "@/context/NotesContext";
import { useMudzakarah } from "@/context/MudzakarahContext";
import { useColors } from "@/hooks/useColors";
import { DUMMY_KAJIAN } from "@/services/dummyData";
import * as Updates from "expo-updates";

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
  const { user, signOut, updateProfile } = useAuth();
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
  const [updating, setUpdating] = useState(false);

  // Edit Name State
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [newName, setNewName] = useState("");
  const [savingName, setSavingName] = useState(false);

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSavingName(true);
    await updateProfile({ nama: newName.trim() });
    setSavingName(false);
    setEditModalVisible(false);
  };

  const handleCheckUpdate = async () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUpdating(true);

    if (Platform.OS === "web") {
      // Web tidak mendukung expo-updates, cukup reload halaman
      setTimeout(() => {
        setUpdating(false);
        const ok = window.confirm("Muat ulang halaman untuk mendapatkan versi terbaru?");
        if (ok) window.location.reload();
      }, 800);
      return;
    }

    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        await Updates.fetchUpdateAsync();
        Alert.alert("Pembaruan Tersedia", "Aplikasi akan dimuat ulang untuk menerapkan pembaruan.", [
          { text: "Muat Ulang", onPress: () => Updates.reloadAsync() },
        ]);
      } else {
        Alert.alert("Sudah Terbaru", "Aplikasi Anda sudah menggunakan versi terbaru.");
      }
    } catch (e) {
      Alert.alert("Gagal", "Tidak dapat memeriksa pembaruan. Pastikan Anda terhubung ke internet.");
    } finally {
      setUpdating(false);
    }
  };

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

        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <Text style={styles.name}>{user?.nama ?? "Muslimah"}</Text>
          <Pressable 
            onPress={() => {
              setNewName(user?.nama ?? "");
              setEditModalVisible(true);
            }}
            hitSlop={12}
            style={({pressed}) => ({ opacity: pressed ? 0.5 : 0.9 })}
          >
            <Feather name="edit-2" size={14} color="#FFFFFF" />
          </Pressable>
        </View>

        <Text style={styles.email}>{user?.email ?? ""}</Text>
        {user?.bergabungSejak && (
          <Text style={[styles.since, { marginBottom: 8 }]}>
            Bergabung {formatDate(user.bergabungSejak)}
          </Text>
        )}
        {user?.role && (
          <View style={styles.roleBadge}>
            <Feather 
              name={user.role === "pengajar" ? "award" : user.role === "admin" ? "settings" : "book-open"} 
              size={12} 
              color="#C9A227" 
            />
            <Text style={styles.roleBadgeText}>
              {user.role === "pengajar" ? "Pengajar" : user.role === "admin" ? "Admin" : "Murid"}
            </Text>
          </View>
        )}
      </View>

      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statCol}>
          <Text style={[styles.statNum, { color: colors.primary }]}>{activeKajian}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Kajian Rutin</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.statCol}>
          <Text style={[styles.statNum, { color: colors.primary }]}>0</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Faedah</Text>
        </View>
        {user?.role !== "pengajar" && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{notes.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Catatan</Text>
            </View>
          </>
        )}
        {user?.role !== "pengajar" && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.statCol}>
              <Text style={[styles.statNum, { color: colors.primary }]}>{myTopics}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Mudzakarah</Text>
            </View>
          </>
        )}
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
            icon="image"
            label="Desain Faedah"
            value="0 desain"
            onPress={() => router.push("/(tabs)/faedah")}
          />
          {user?.role !== "pengajar" && (
            <SettingItem
              icon="edit-3"
              label="Catatan Saya"
              value={`${notes.length} catatan`}
              onPress={() => router.push("/(tabs)/notes")}
            />
          )}
          {user?.role !== "pengajar" && (
            <SettingItem
              icon="message-circle"
              label="Mudzakarah"
              value={`${topics.length} topik`}
              onPress={() => router.push("/(tabs)/mudzakarah")}
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TENTANG</Text>
        <View style={[styles.settingGroup, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingItem icon="info" label="Versi Aplikasi" value="1.0.0" />
          <SettingItem icon="heart" label="Mulazamahku" value="Thalabul 'Ilmi" />
          <Pressable
            onPress={handleCheckUpdate}
            disabled={updating}
            style={({ pressed }) => [
              styles.settingItem,
              { borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <View style={[styles.settingIcon, { backgroundColor: colors.highlight }]}>
              {updating ? (
                <ActivityIndicator size={16} color={colors.primary} />
              ) : (
                <Feather name="refresh-cw" size={16} color={colors.primary} />
              )}
            </View>
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>
              {updating ? "Memeriksa..." : "Cek Pembaruan"}
            </Text>
            <View style={styles.settingRight}>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </View>
          </Pressable>
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

      <Modal
        visible={editModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Edit Nama</Text>
            <TextInput
              style={[
                styles.modalInput,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.surface }
              ]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Masukkan nama Anda"
              placeholderTextColor={colors.mutedForeground}
              autoFocus
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.surface }]}
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={[styles.modalBtnText, { color: colors.foreground }]}>Batal</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                onPress={handleSaveName}
                disabled={savingName || !newName.trim()}
              >
                {savingName ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={[styles.modalBtnText, { color: "#FFFFFF" }]}>Simpan</Text>
                )}
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  roleBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(201,162,39,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 6,
    marginBottom: 4,
  },
  roleBadgeText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: "#C9A227",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  modalBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: "center",
  },
  modalBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
