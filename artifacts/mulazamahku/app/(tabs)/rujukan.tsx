import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Linking,
  Switch,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { RujukanService } from "@/services/rujukanService";
import { DUMMY_KAJIAN } from "@/services/dummyData";
import { RujukanKitab } from "@/types";

export default function RujukanScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();

  const [rujukanList, setRujukanList] = useState<RujukanKitab[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // State form
  const [showForm, setShowForm] = useState(false);
  const [judulKitab, setJudulKitab] = useState("");
  const [penulis, setPenulis] = useState("");
  const [deskripsi, setDeskripsi] = useState("");
  const [selectedKajian, setSelectedKajian] = useState("");
  const [izinPenggunaan, setIzinPenggunaan] = useState(false);
  const [catatanIzin, setCatatanIzin] = useState("");
  const [pdfUri, setPdfUri] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState("");
  const [showKajianPicker, setShowKajianPicker] = useState(false);

  const fetchRujukan = useCallback(async () => {
    const data = await RujukanService.getAllRujukan();
    setRujukanList(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRujukan();
  }, [fetchRujukan]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRujukan();
    setRefreshing(false);
  };

  const pickPdf = () => {
    // Diganti dengan input manual URL untuk menghindari crash modul native (white screen)
  };

  const submitRujukan = async () => {
    if (!judulKitab.trim()) {
      Alert.alert("Data belum lengkap", "Judul kitab wajib diisi.");
      return;
    }

    if (Platform.OS !== "web")
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    setUploading(true);

    const { success, error } = await RujukanService.addRujukan(
      judulKitab,
      penulis,
      deskripsi,
      selectedKajian || null,
      izinPenggunaan,
      catatanIzin,
      user?.nama ?? "Anonim",
      pdfUri || undefined
    );

    setUploading(false);

    if (success) {
      Alert.alert("Berhasil ✓", "Rujukan kitab berhasil ditambahkan.");
      resetForm();
      fetchRujukan();
    } else {
      Alert.alert("Gagal", error || "Terjadi kesalahan.");
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setJudulKitab("");
    setPenulis("");
    setDeskripsi("");
    setSelectedKajian("");
    setIzinPenggunaan(false);
    setCatatanIzin("");
    setPdfUri(null);
    setPdfName("");
  };

  const openPdf = (url: string) => {
    Linking.openURL(url);
  };

  const getKajianTitle = (id: string) => {
    const k = DUMMY_KAJIAN.find((x) => x.id === id);
    return k ? k.judul : "";
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

  const canAdd = user?.role === "pengajar" || user?.role === "admin";

  const renderRujukanItem = ({ item }: { item: RujukanKitab }) => (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <View style={[styles.bookIcon, { backgroundColor: colors.highlight }]}>
            <Feather name="book" size={20} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{item.judul_kitab}</Text>
            {item.penulis ? (
              <Text style={[styles.cardAuthor, { color: colors.mutedForeground }]}>{item.penulis}</Text>
            ) : null}
          </View>
        </View>

        {item.deskripsi ? (
          <Text style={[styles.cardDesc, { color: colors.mutedForeground }]}>{item.deskripsi}</Text>
        ) : null}

        {item.kajian_id ? (
          <View style={[styles.kajianBadge, { backgroundColor: colors.highlight, borderColor: colors.border }]}>
            <Feather name="bookmark" size={12} color={colors.primary} />
            <Text style={[styles.kajianBadgeText, { color: colors.primary }]}>
              {getKajianTitle(item.kajian_id)}
            </Text>
          </View>
        ) : null}

        {/* Izin Penggunaan */}
        <View style={styles.izinRow}>
          <Feather
            name={item.izin_penggunaan ? "check-circle" : "alert-circle"}
            size={14}
            color={item.izin_penggunaan ? "#22C55E" : "#E5A100"}
          />
          <Text style={[styles.izinText, { color: item.izin_penggunaan ? "#22C55E" : "#E5A100" }]}>
            {item.izin_penggunaan ? "Izin penggunaan diperoleh" : "Menunggu izin penggunaan"}
          </Text>
        </View>
        {item.catatan_izin ? (
          <Text style={[styles.izinNote, { color: colors.mutedForeground }]}>
            {item.catatan_izin}
          </Text>
        ) : null}

        {/* Tombol Buka PDF */}
        {item.file_url ? (
          <Pressable
            style={({ pressed }) => [
              styles.pdfBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => openPdf(item.file_url!)}
          >
            <Feather name="file-text" size={16} color="#FFFFFF" />
            <Text style={styles.pdfBtnText}>Buka File PDF</Text>
          </Pressable>
        ) : null}

        {/* Meta */}
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
        <Text style={[styles.title, { color: colors.foreground }]}>Rujukan Kitab</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Daftar kitab referensi yang digunakan dalam kajian.
        </Text>
      </View>

      {/* Tombol Tambah untuk Pengajar & Admin */}
      {canAdd && (
        <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <Pressable
            style={({ pressed }) => [
              styles.uploadBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => setShowForm(true)}
          >
            <Feather name="plus-circle" size={18} color="#FFFFFF" />
            <Text style={styles.uploadBtnText}>Tambah Rujukan Baru</Text>
          </Pressable>
        </View>
      )}

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Memuat rujukan...
          </Text>
        </View>
      ) : rujukanList.length === 0 ? (
        <View style={styles.centerContent}>
          <Feather name="book-open" size={48} color={colors.primary} style={{ opacity: 0.5, marginBottom: 16 }} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Belum ada rujukan kitab.
          </Text>
        </View>
      ) : (
        <FlatList
          data={rujukanList}
          keyExtractor={(item) => item.id}
          renderItem={renderRujukanItem}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />
          }
        />
      )}

      {/* ── Modal Form Tambah Rujukan ─────────────────────── */}
      <Modal visible={showForm} animationType="slide" presentationStyle="pageSheet" onRequestClose={resetForm}>
        <KeyboardAvoidingView
          style={[styles.modalContainer, { backgroundColor: colors.background }]}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={[styles.modalHeader, { backgroundColor: colors.background, borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
            <Pressable onPress={resetForm} hitSlop={8}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Tambah Rujukan</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 40 }}>
            {/* Judul Kitab */}
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Judul Kitab *</Text>
            <TextInput
              value={judulKitab}
              onChangeText={setJudulKitab}
              placeholder="Masukkan judul kitab..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, minHeight: 44 }]}
            />

            {/* Penulis */}
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Penulis / Mushannif</Text>
            <TextInput
              value={penulis}
              onChangeText={setPenulis}
              placeholder="Nama penulis kitab..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, minHeight: 44 }]}
            />

            {/* Deskripsi */}
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Deskripsi</Text>
            <TextInput
              value={deskripsi}
              onChangeText={setDeskripsi}
              placeholder="Deskripsi singkat tentang kitab..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
              multiline
            />

            {/* Pilih Kajian */}
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Kajian Terkait (Opsional)</Text>
            <Pressable
              style={[styles.formSelect, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setShowKajianPicker(true)}
            >
              <Text style={[styles.formSelectText, { color: selectedKajian ? colors.foreground : colors.mutedForeground }]}>
                {selectedKajian ? getKajianTitle(selectedKajian) : "Pilih kajian (opsional)..."}
              </Text>
              <Feather name="chevron-down" size={16} color={colors.mutedForeground} />
            </Pressable>

            {/* Izin Penggunaan */}
            <View style={[styles.switchRow, { marginTop: 16 }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.formLabel, { color: colors.foreground, marginTop: 0 }]}>Izin Penggunaan</Text>
                <Text style={[styles.switchDesc, { color: colors.mutedForeground }]}>
                  Apakah sudah mendapat izin penggunaan kitab?
                </Text>
              </View>
              <Switch
                value={izinPenggunaan}
                onValueChange={setIzinPenggunaan}
                trackColor={{ false: colors.muted, true: colors.primary }}
              />
            </View>

            {/* Catatan Izin */}
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Catatan Izin</Text>
            <TextInput
              value={catatanIzin}
              onChangeText={setCatatanIzin}
              placeholder="Keterangan tentang izin penggunaan..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, minHeight: 44 }]}
            />

            {/* Upload PDF */}
            <Text style={[styles.formLabel, { color: colors.foreground }]}>Link / URL File Kitab (Opsional)</Text>
            <TextInput
              value={pdfUri || ""}
              onChangeText={setPdfUri}
              placeholder="Masukkan link PDF (Google Drive, dll)..."
              placeholderTextColor={colors.mutedForeground}
              style={[styles.formInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground, minHeight: 44 }]}
            />

            {/* Tombol Kirim */}
            <Pressable
              style={({ pressed }) => [
                styles.sendBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={submitRujukan}
              disabled={uploading}
            >
              {uploading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Feather name="save" size={18} color="#FFFFFF" />
                  <Text style={styles.sendBtnText}>Simpan Rujukan</Text>
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
                  <Pressable
                    style={({ pressed }) => [styles.pickerItem, { borderBottomColor: colors.border, backgroundColor: pressed ? colors.highlight : "transparent" }]}
                    onPress={() => { setSelectedKajian(""); setShowKajianPicker(false); }}
                  >
                    <Text style={[styles.pickerItemText, { color: colors.mutedForeground, fontStyle: "italic" }]}>
                      Tidak terkait kajian tertentu
                    </Text>
                  </Pressable>
                  {DUMMY_KAJIAN.filter((k) => k.status === "aktif").map((k) => (
                    <Pressable
                      key={k.id}
                      style={({ pressed }) => [styles.pickerItem, { borderBottomColor: colors.border, backgroundColor: pressed ? colors.highlight : "transparent" }]}
                      onPress={() => { setSelectedKajian(k.id); setShowKajianPicker(false); }}
                    >
                      <Text style={[styles.pickerItemText, { color: colors.foreground }]}>{k.judul}</Text>
                      <Text style={[styles.pickerItemSub, { color: colors.mutedForeground }]}>{k.ustadz}</Text>
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

  // Card
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginBottom: 16 },
  cardBody: { padding: 16 },
  cardTopRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 10 },
  bookIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  cardTitle: { fontSize: 16, fontFamily: "Inter_700Bold", lineHeight: 22 },
  cardAuthor: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },
  cardDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, marginBottom: 10 },
  kajianBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
    alignSelf: "flex-start", marginBottom: 10,
  },
  kajianBadgeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  izinRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 4 },
  izinText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  izinNote: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 10, marginLeft: 20 },
  pdfBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 10, borderRadius: 8, marginBottom: 10,
  },
  pdfBtnText: { color: "#FFFFFF", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  cardMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  cardMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },

  // Modal
  modalContainer: { flex: 1 },
  modalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 17, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center", marginHorizontal: 8 },
  formLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginBottom: 6, marginTop: 12 },
  formInput: { borderWidth: 1, borderRadius: 10, padding: 12, minHeight: 80, textAlignVertical: "top", fontFamily: "Inter_400Regular", fontSize: 14 },
  formSelect: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    borderWidth: 1, borderRadius: 10, padding: 12,
  },
  formSelectText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  switchRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  switchDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  pdfPickBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1.5, borderStyle: "dashed", borderRadius: 10, padding: 14,
  },
  pdfPickText: { fontSize: 14, fontFamily: "Inter_400Regular", flex: 1 },
  sendBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14, marginTop: 24,
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
