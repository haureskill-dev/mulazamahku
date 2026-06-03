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
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { FaedahService, FaedahItem } from "@/services/faedahService";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function FaedahScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();

  const [faedahList, setFaedahList] = useState<FaedahItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // State untuk preview sebelum kirim
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [keterangan, setKeterangan] = useState("");

  // State untuk feedback pengajar
  const [feedbackItem, setFeedbackItem] = useState<FaedahItem | null>(null);
  const [feedbackAction, setFeedbackAction] = useState<"disetujui" | "ditolak" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  // State untuk full screen image viewer
  const [viewImageUri, setViewImageUri] = useState<string | null>(null);

  const fetchFaedah = useCallback(async () => {
    const data = await FaedahService.getAllFaedah();
    setFaedahList(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchFaedah();
  }, [fetchFaedah]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchFaedah();
    setRefreshing(false);
  };

  // Langkah 1: Pilih gambar → tampilkan preview
  const pickImage = async () => {
    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Izin ditolak",
        "Maaf, kami membutuhkan izin untuk mengakses galeri Anda."
      );
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.8,
    });

    if (result.canceled) return;

    // Tampilkan preview dulu, belum upload
    setPreviewUri(result.assets[0].uri);
    setShowPreview(true);
  };

  // Langkah 2: Konfirmasi kirim → upload ke server
  const confirmUpload = async () => {
    if (!previewUri) return;

    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setUploading(true);

    const { success, error } = await FaedahService.uploadFaedah(
      previewUri,
      user?.nama ?? "Anonim",
      user?.email ?? "",
      user?.role ?? "murid"
    );

    setUploading(false);
    setShowPreview(false);
    setPreviewUri(null);

    if (success) {
      Alert.alert(
        "Berhasil ✓",
        "Desain Anda telah berhasil dikirim dan sedang menunggu pengecekan pengajar."
      );
      fetchFaedah();
    } else {
      Alert.alert("Gagal Kirim", error || "Terjadi kesalahan saat mengirim.");
    }
  };

  // Batal preview
  const cancelPreview = () => {
    setShowPreview(false);
    setPreviewUri(null);
    setKeterangan("");
  };

  const handleApprove = (item: FaedahItem) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setFeedbackItem(item);
    setFeedbackAction("disetujui");
    setFeedbackText("");
  };

  const handleReject = (item: FaedahItem) => {
    if (Platform.OS !== "web") Haptics.selectionAsync();
    setFeedbackItem(item);
    setFeedbackAction("ditolak");
    setFeedbackText("");
  };

  const submitFeedback = async () => {
    if (!feedbackItem || !feedbackAction) return;

    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUploading(true);

    const { success } = await FaedahService.updateStatus(
      feedbackItem.id,
      feedbackAction,
      feedbackText.trim() || undefined
    );

    setUploading(false);
    
    if (success) {
      setFeedbackItem(null);
      setFeedbackAction(null);
      fetchFaedah();
    } else {
      Alert.alert("Gagal", "Terjadi kesalahan saat memproses data.");
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert("Hapus Desain", "Apakah Anda yakin ingin menghapus desain ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          setUploading(true);
          const { success, error } = await FaedahService.deleteFaedah(id);
          setUploading(false);
          if (success) {
            fetchFaedah();
          } else {
            Alert.alert("Gagal Menghapus", error || "Terjadi kesalahan.");
          }
        }
      }
    ]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "menunggu":
        return { icon: "clock" as const, label: "Menunggu Pengecekan", color: "#E5A100", bg: "rgba(229,161,0,0.12)" };
      case "disetujui":
        return { icon: "check-circle" as const, label: "Disetujui", color: "#22C55E", bg: "rgba(34,197,94,0.12)" };
      case "ditolak":
        return { icon: "x-circle" as const, label: "Ditolak", color: "#EF4444", bg: "rgba(239,68,68,0.12)" };
      default:
        return { icon: "clock" as const, label: status, color: "#888", bg: "#f0f0f0" };
    }
  };

  const formatDate = (iso: string) => {
    if (!iso) return "-";
    const date = new Date(iso);
    if (isNaN(date.getTime())) return "-";
    
    const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
    const d = date.getDate();
    const m = months[date.getMonth()];
    const y = date.getFullYear();
    const hh = date.getHours().toString().padStart(2, "0");
    const mm = date.getMinutes().toString().padStart(2, "0");
    
    return `${d} ${m} ${y}, ${hh}.${mm}`;
  };

  const renderFaedahItem = ({ item }: { item: FaedahItem }) => {
    const badge = getStatusBadge(item.status);
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable onPress={() => setViewImageUri(item.image_url || null)}>
          <Image
            source={{ uri: item.image_url || 'https://placehold.co/600x400/png' }}
            style={styles.cardImage}
            resizeMode="contain"
          />
        </Pressable>
        <View style={styles.cardBody}>
          <View style={styles.cardMeta}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardName, { color: colors.foreground }]}>
                {item.uploader_name}
              </Text>
              <Text style={[styles.cardDate, { color: colors.mutedForeground }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
              <Feather name={badge.icon} size={12} color={badge.color} />
              <Text style={[styles.statusText, { color: badge.color }]}>
                {badge.label}
              </Text>
            </View>
          </View>

          {/* Menampilkan feedback jika ada */}
          {!!item.catatan && (
            <View style={[styles.feedbackBox, { backgroundColor: colors.highlight, borderColor: colors.border }]}>
              <Text style={[styles.feedbackLabel, { color: colors.primary }]}>Catatan Pengajar:</Text>
              <Text style={[styles.feedbackTextContent, { color: colors.foreground }]}>{item.catatan}</Text>
            </View>
          )}

          {/* Tombol approve/reject untuk pengajar */}
          {user?.role === "pengajar" && item.status === "menunggu" && (
            <View style={styles.actionRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: "#22C55E", opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => handleApprove(item)}
              >
                <Feather name="check" size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Setujui</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: "#EF4444", opacity: pressed ? 0.8 : 1 },
                ]}
                onPress={() => handleReject(item)}
              >
                <Feather name="x" size={14} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Tolak</Text>
              </Pressable>
            </View>
          )}

          {/* Tombol Hapus untuk pengupload atau admin */}
          {(user?.role === "admin" || user?.email === item.uploader_email) && (
            <Pressable
              style={({ pressed }) => [
                styles.deleteBtn,
                { opacity: pressed ? 0.7 : 1 }
              ]}
              onPress={() => handleDelete(item.id)}
            >
              <Feather name="trash-2" size={14} color="#EF4444" />
              <Text style={styles.deleteBtnText}>Hapus</Text>
            </Pressable>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Faedah Kajian</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Kumpulan desain faedah yang dibuat dari materi kajian.
        </Text>
      </View>

      {/* Tombol Pilih Gambar untuk Murid & Admin */}
      {(user?.role === "murid" || user?.role === "admin") && (
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Pressable
            style={({ pressed }) => [
              styles.uploadBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={pickImage}
          >
            <Feather name="image" size={18} color="#FFFFFF" />
            <Text style={styles.uploadBtnText}>Pilih Desain dari Galeri</Text>
          </Pressable>
        </View>
      )}

      {/* Carousel faedah yang sudah disetujui */}
      {faedahList.filter(f => f.status === "disetujui").length > 0 && (
        <View style={{ marginBottom: 20 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 12 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Faedah Terbaru</Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}>
            {faedahList.filter(f => f.status === "disetujui").slice(0, 10).map((f) => (
              <Pressable key={f.id} onPress={() => setViewImageUri(f.image_url || null)}>
                <View style={[styles.carouselCard, { borderColor: colors.border, backgroundColor: colors.card }]}>
                  <Image
                    source={{ uri: f.image_url || 'https://placehold.co/300x400/png' }}
                    style={styles.carouselImage}
                    resizeMode="cover"
                  />
                  <View style={styles.carouselMeta}>
                    <Text style={[styles.carouselName, { color: colors.foreground }]} numberOfLines={1}>
                      {f.uploader_name}
                    </Text>
                    <Text style={[styles.carouselDate, { color: colors.mutedForeground }]}>
                      {formatDate(f.created_at)}
                    </Text>
                  </View>
                </View>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Memuat faedah...
          </Text>
        </View>
      ) : faedahList.length === 0 ? (
        <View style={styles.centerContent}>
          <Feather name="image" size={48} color={colors.primary} style={{ opacity: 0.5, marginBottom: 16 }} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Belum ada desain faedah yang dibagikan.
          </Text>
          <Text style={[styles.emptySubtext, { color: colors.mutedForeground }]}>
            Tarik ke bawah untuk memuat ulang.
          </Text>
        </View>
      ) : (
        <FlatList
          data={faedahList}
          keyExtractor={(item) => item.id}
          renderItem={renderFaedahItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
      )}

      {/* ── Modal Preview sebelum kirim ─────────────────────── */}
      <Modal
        visible={showPreview}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={cancelPreview}
      >
        <View style={[styles.previewContainer, { backgroundColor: colors.background }]}>
          {/* Header modal */}
          <View
            style={[
              styles.previewHeader,
              {
                backgroundColor: colors.background,
                borderBottomColor: colors.border,
                paddingTop: insets.top + 8,
              },
            ]}
          >
            <Pressable onPress={cancelPreview} style={styles.previewBackBtn} hitSlop={8}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.previewTitle, { color: colors.foreground }]}>
              Preview Faedah
            </Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Gambar preview */}
          <View style={styles.previewImageWrap}>
            {!!previewUri && (
              <Image
                source={{ uri: previewUri }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
          </View>

          {/* Info */}
          <View style={[styles.previewInfo, { backgroundColor: colors.highlight, borderColor: colors.border }]}>
            <Feather name="info" size={16} color={colors.primary} />
            <Text style={[styles.previewInfoText, { color: colors.mutedForeground }]}>
              Desain akan dikirim untuk dicek oleh pengajar sebelum ditampilkan.
            </Text>
          </View>

          {/* Keterangan Opsional */}
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground, marginBottom: 6 }}>
              Keterangan (Opsional)
            </Text>
            <TextInput
              value={keterangan}
              onChangeText={setKeterangan}
              placeholder="Tulis keterangan faedah..."
              placeholderTextColor={colors.mutedForeground}
              style={{
                borderWidth: 1,
                borderColor: colors.border,
                borderRadius: 10,
                padding: 12,
                minHeight: 80,
                textAlignVertical: "top",
                fontFamily: "Inter_400Regular",
                fontSize: 14,
                color: colors.foreground,
                backgroundColor: colors.card,
              }}
              multiline
            />
          </View>

          {/* Tombol Kirim & Batal */}
          <View style={[styles.previewActions, { paddingBottom: insets.bottom + 16 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.sendBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}
              onPress={confirmUpload}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="send" size={18} color="#FFFFFF" />
                  <Text style={styles.sendBtnText}>Kirim Faedah</Text>
                </>
              )}
            </Pressable>

            <Pressable
              style={({ pressed }) => [
                styles.cancelBtn,
                {
                  borderColor: colors.border,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
              onPress={cancelPreview}
              disabled={uploading}
            >
              <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
              <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>
                Pilih Gambar Lain
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Modal Feedback Pengajar ─────────────────────── */}
      <Modal
        visible={!!feedbackItem}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedbackItem(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.feedbackModalContent, { backgroundColor: colors.background }]}>
            <View style={[styles.feedbackHeader, { borderBottomColor: colors.border }]}>
              <Text style={[styles.feedbackTitle, { color: colors.foreground }]}>
                {feedbackAction === "disetujui" ? "Setujui Desain" : "Tolak Desain"}
              </Text>
              <Pressable onPress={() => setFeedbackItem(null)} hitSlop={8}>
                <Feather name="x" size={20} color={colors.foreground} />
              </Pressable>
            </View>
            
            <View style={styles.feedbackBody}>
              <Text style={[styles.feedbackInfo, { color: colors.mutedForeground }]}>
                Berikan catatan atau feedback untuk desain buatan {feedbackItem?.uploader_name} (opsional).
              </Text>
              
              <View style={[styles.feedbackInputWrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
                <TextInput
                  style={[styles.feedbackInput, { color: colors.foreground }]}
                  placeholder="Ketik catatan..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  value={feedbackText}
                  onChangeText={setFeedbackText}
                  autoFocus
                />
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.feedbackSubmitBtn,
                  { 
                    backgroundColor: feedbackAction === "disetujui" ? "#22C55E" : "#EF4444",
                    opacity: pressed || uploading ? 0.7 : 1 
                  }
                ]}
                onPress={submitFeedback}
                disabled={uploading}
              >
                {uploading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.feedbackSubmitText}>
                    {feedbackAction === "disetujui" ? "Setujui & Simpan" : "Tolak & Simpan"}
                  </Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Modal Full Screen Viewer ─────────────────────── */}
      <Modal
        visible={!!viewImageUri}
        transparent
        animationType="fade"
        onRequestClose={() => setViewImageUri(null)}
      >
        <View style={styles.fullScreenOverlay}>
          <Pressable 
            style={[styles.closeFullScreenBtn, { top: insets.top + 16 }]} 
            onPress={() => setViewImageUri(null)}
          >
            <Feather name="x" size={28} color="#FFFFFF" />
          </Pressable>
          {!!viewImageUri && (
            <Image 
              source={{ uri: viewImageUri }} 
              style={styles.fullScreenImage} 
              resizeMode="contain" 
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  centerContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginTop: 6,
  },
  uploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  uploadBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
  },
  cardImage: {
    width: "100%",
    height: 260,
    backgroundColor: "#F0F0F0",
  },
  cardBody: {
    padding: 14,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  cardDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  deleteBtnText: {
    color: "#EF4444",
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },

  // ── Preview Modal ──────────────────────────────
  previewContainer: {
    flex: 1,
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  previewBackBtn: {
    padding: 4,
  },
  previewTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
  },
  previewImageWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  previewImage: {
    width: SCREEN_WIDTH - 32,
    height: "100%",
    borderRadius: 12,
  },
  previewInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginHorizontal: 20,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  previewInfoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
  previewActions: {
    paddingHorizontal: 20,
    gap: 10,
  },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
  },
  sendBtnText: {
    color: "#FFFFFF",
    fontFamily: "Inter_700Bold",
    fontSize: 17,
  },
  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },

  // Feedback
  feedbackBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  feedbackLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  feedbackTextContent: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: 20,
  },
  feedbackModalContent: {
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  feedbackHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
  },
  feedbackTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  feedbackBody: {
    padding: 16,
  },
  feedbackInfo: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
    lineHeight: 18,
  },
  feedbackInputWrap: {
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 100,
    padding: 12,
    marginBottom: 20,
  },
  feedbackInput: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlignVertical: "top",
  },
  feedbackSubmitBtn: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  feedbackSubmitText: {
    color: "#FFFFFF",
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
  },

  // Full Screen Image Viewer
  fullScreenOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  closeFullScreenBtn: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 20,
  },

  // Carousel
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  carouselCard: {
    width: 200,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  carouselImage: {
    width: 200,
    height: 260,
    backgroundColor: "#F0F0F0",
  },
  carouselMeta: {
    padding: 10,
  },
  carouselName: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  carouselDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
