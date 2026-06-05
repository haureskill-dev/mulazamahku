import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  Image,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { FlyerService } from "@/services/flyerService";
import { DUMMY_KAJIAN } from "@/services/dummyData";
import { Flyer } from "@/types";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function FlyerScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();

  const [flyerList, setFlyerList] = useState<Flyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // State form upload
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [selectedKajian, setSelectedKajian] = useState<string>("");
  const [keterangan, setKeterangan] = useState<string>("");
  const [editingFlyerId, setEditingFlyerId] = useState<string | null>(null);
  const [showKajianPicker, setShowKajianPicker] = useState(false);

  const fetchFlyers = useCallback(async () => {
    const data = await FlyerService.getAllFlyers();
    setFlyerList(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFlyers();
  }, [fetchFlyers]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFlyers();
    setRefreshing(false);
  };

  const pickImage = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin ditolak", "Maaf, kami membutuhkan izin untuk mengakses galeri Anda.");
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) return;

    setPreviewUri(result.assets[0].uri);
    setShowUploadForm(true);
  };

  const handleEditFlyer = (flyer: Flyer) => {
    setEditingFlyerId(flyer.id);
    setSelectedKajian(flyer.kajian_id);
    setKeterangan(flyer.keterangan || "");
    setPreviewUri(flyer.image_url);
    setShowUploadForm(true);
  };

  const confirmUpload = async () => {
    if (!selectedKajian || (!previewUri && !editingFlyerId)) {
      Alert.alert("Data belum lengkap", "Pilih kajian terlebih dahulu.");
      return;
    }

    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setUploading(true);

    let success = false;
    let error: string | undefined = undefined;

    if (editingFlyerId) {
      const res = await FlyerService.updateFlyer(
        editingFlyerId,
        selectedKajian,
        keterangan,
        new Date().toISOString().split("T")[0]
      );
      success = res.success;
      error = res.error;
    } else {
      if (!previewUri) return;
      const res = await FlyerService.uploadFlyer(
        previewUri,
        selectedKajian,
        keterangan,
        new Date().toISOString().split("T")[0],
        user?.nama ?? "Admin"
      );
      success = res.success;
      error = res.error;
    }

    setUploading(false);
    setShowUploadForm(false);
    setPreviewUri(null);
    setSelectedKajian("");
    setKeterangan("");
    setEditingFlyerId(null);

    if (success) {
      Alert.alert("Berhasil ✓", editingFlyerId ? "Flyer berhasil diperbarui." : "Flyer berhasil diupload.");
      fetchFlyers();
    } else {
      Alert.alert("Gagal", error || "Terjadi kesalahan.");
    }
  };

  const cancelUpload = () => {
    setShowUploadForm(false);
    setPreviewUri(null);
    setSelectedKajian("");
    setKeterangan("");
    setEditingFlyerId(null);
  };

  const getKajianTitle = (id: string) => {
    const k = DUMMY_KAJIAN.find((x) => x.id === id);
    return k ? k.judul : id;
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleDeleteFlyer = async (id: string) => {
    Alert.alert(
      "Hapus Flyer",
      "Yakin ingin menghapus flyer ini?",
      [
        { text: "Batal", style: "cancel" },
        {
          text: "Hapus",
          style: "destructive",
          onPress: async () => {
            const { success, error } = await FlyerService.deleteFlyer(id);
            if (success) {
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              fetchFlyers();
            } else {
              Alert.alert("Gagal", error || "Gagal menghapus flyer.");
            }
          },
        },
      ]
    );
  };

  const renderFlyerItem = ({ item }: { item: Flyer }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Image source={{ uri: item.image_url }} style={styles.cardImage} resizeMode="cover" />
      <View style={styles.cardBody}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>
              {getKajianTitle(item.kajian_id)}
            </Text>
            {item.keterangan ? (
              <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>
                {item.keterangan}
              </Text>
            ) : null}
          </View>
          {user?.role === "admin" && (
            <View style={{ flexDirection: "row", gap: 6 }}>
              <Pressable
                onPress={() => handleEditFlyer(item)}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  { backgroundColor: pressed ? "#E5E7EB" : "#F3F4F6", borderColor: "#D1D5DB" },
                ]}
                hitSlop={8}
              >
                <Feather name="edit-2" size={14} color="#4B5563" />
              </Pressable>
              <Pressable
                onPress={() => handleDeleteFlyer(item.id)}
                style={({ pressed }) => [
                  styles.deleteBtn,
                  { backgroundColor: pressed ? "#FEE2E2" : "#FFF1F2", borderColor: "#FECACA" },
                ]}
                hitSlop={8}
              >
                <Feather name="trash-2" size={14} color="#EF4444" />
              </Pressable>
            </View>
          )}
        </View>
        <View style={styles.cardMeta}>
          <Feather name="user" size={11} color={colors.mutedForeground} />
          <Text style={[styles.cardMetaText, { color: colors.mutedForeground }]}>
            {item.dibuat_oleh} · {formatDate(item.created_at)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Flyer Kajian</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Poster informasi dan pengumuman kajian terbaru.
        </Text>
      </View>

      {/* Tombol Upload untuk Admin */}
      {user?.role === "admin" && (
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Pressable
            style={({ pressed }) => [
              styles.uploadBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={pickImage}
          >
            <Feather name="upload-cloud" size={18} color="#FFFFFF" />
            <Text style={styles.uploadBtnText}>Upload Flyer Baru</Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Memuat flyer...
          </Text>
        </View>
      ) : flyerList.length === 0 ? (
        <View style={styles.centerContent}>
          <Feather name="image" size={48} color={colors.primary} style={{ opacity: 0.5, marginBottom: 16 }} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Belum ada flyer yang diupload.
          </Text>
        </View>
      ) : (
        <FlatList
          data={flyerList}
          keyExtractor={(item) => item.id}
          renderItem={renderFlyerItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
      )}

      {/* ── Modal Form Upload ─────────────────────── */}
      <Modal visible={showUploadForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={cancelUpload}>
        <KeyboardAvoidingView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
            <Pressable onPress={cancelUpload} hitSlop={8}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editingFlyerId ? "Edit Flyer" : "Upload Flyer Baru"}
            </Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
            {/* Preview gambar */}
            {editingFlyerId ? (
                <View style={styles.imagePlaceholder}>
                  <Image source={{ uri: previewUri! }} style={{ width: "100%", height: "100%", borderRadius: 10 }} resizeMode="cover" />
                </View>
              ) : previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.previewImage} resizeMode="contain" />
            ) : null}

            {/* Pilih Kajian */}
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Kajian *</Text>
            <Pressable
              style={[styles.formSelect, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowKajianPicker(true)}
            >
              <Text style={[styles.formSelectText, { color: selectedKajian ? colors.foreground : colors.mutedForeground }]}>
                {selectedKajian ? getKajianTitle(selectedKajian) : "Pilih kajian..."}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
            </Pressable>

            {/* Keterangan */}
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Keterangan</Text>
            <TextInput
              value={keterangan}
              onChangeText={setKeterangan}
              placeholder="Tulis keterangan flyer..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              multiline
            />

            {/* Tombol Kirim */}
            <Pressable
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={confirmUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.sendBtnText}>{editingFlyerId ? "Simpan Perubahan" : "Upload Flyer"}</Text>
                </>
              )}
            </Pressable>
          </ScrollView>

          {/* Picker Kajian */}
          <Modal visible={showKajianPicker} animationType="slide" transparent>
            <View style={styles.pickerOverlay}>
              <View style={[styles.pickerContent, { backgroundColor: colors.card }]}>
                <View style={[styles.pickerHeader, { borderBottomColor: colors.border }]}>
                  <Text style={[styles.pickerTitle, { color: colors.foreground }]}>Pilih Kajian</Text>
                  <Pressable onPress={() => setShowKajianPicker(false)}>
                    <Feather name="x" size={20} color={colors.foreground} />
                  </Pressable>
                </View>
                <ScrollView>
                  {DUMMY_KAJIAN.filter((k) => k.status === "aktif").map((k) => (
                    <Pressable
                      key={k.id}
                      style={({ pressed }) => [
                        styles.pickerItem,
                        {
                          borderBottomColor: colors.border,
                          backgroundColor: pressed ? colors.highlight : "transparent",
                        },
                      ]}
                      onPress={() => {
                        setSelectedKajian(k.id);
                        setShowKajianPicker(false);
                      }}
                    >
                      <Text style={[styles.pickerItemText, { color: colors.foreground }]}>{k.judul}</Text>
                      <Text style={[styles.pickerItemSub, { color: colors.mutedForeground }]}>
                        {k.hari} · {k.ustadz}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>
          </Modal>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", marginBottom: 4 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  loadingText: { marginTop: 12, fontSize: 14, fontFamily: "Inter_400Regular" },
  emptyText: { fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center" },
  uploadBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 14, borderRadius: 12,
  },
  uploadBtnText: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 15 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  cardImage: { width: "100%", height: 280, backgroundColor: "#F0F0F0" },
  cardBody: { padding: 14 },
  cardTitle: { fontSize: 15, fontFamily: "Inter_700Bold", marginBottom: 4 },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 8 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  deleteBtn: {
    width: 32, height: 32, borderRadius: 8, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginLeft: 8,
  },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center", marginHorizontal: 8 },
  previewImage: { width: "100%", height: 220, borderRadius: 12, marginBottom: 20, backgroundColor: "#F0F0F0" },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6, marginTop: 12 },
  formSelect: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderRadius: 10, padding: 12,
  },
  formSelectText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  formInput: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 80, textAlignVertical: "top", fontFamily: "Inter_400Regular", fontSize: 14 },
  sendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14, marginTop: 20,
  },
  sendBtnText: { color: "#FFFFFF", fontFamily: "Inter_700Bold", fontSize: 17 },

  // Picker
  pickerOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  pickerContent: { borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: "60%" },
  pickerHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    padding: 16, borderBottomWidth: 1,
  },
  pickerTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  pickerItem: { padding: 16, borderBottomWidth: 1 },
  pickerItemText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  pickerItemSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
