import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, TextInput, Pressable, ScrollView, Alert, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { KajianTambahanService, KajianTambahan } from "@/services/kajianTambahanService";
import { DUMMY_KAJIAN } from "@/services/dummyData";

export default function EditJadwalScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { user } = useAuth();

  const [form, setForm] = useState({
    judul: "",
    hari: "",
    waktu: "",
    lokasi: "",
    deskripsi: "",
    cp_nama: "",
    cp_telepon: "",
    is_public: false,
  });

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await KajianTambahanService.getAll();
      const found = data.find(d => d.id === id) || DUMMY_KAJIAN.find(d => d.id === id);
      if (found) {
        setForm({
          judul: found.judul,
          hari: found.hari,
          waktu: found.waktu,
          lokasi: found.lokasi,
          deskripsi: found.deskripsi || "",
          cp_nama: found.cp_nama || "",
          cp_telepon: found.cp_telepon || "",
          is_public: found.is_public || false,
        });
      } else {
        Alert.alert("Error", "Data tidak ditemukan");
        router.back();
      }
      setFetching(false);
    }
    loadData();
  }, [id]);

  const handleSubmit = async () => {
    if (!form.judul || !form.hari || !form.waktu || !form.lokasi) {
      Alert.alert("Data Tidak Lengkap", "Harap isi semua kolom wajib (yang bertanda bintang).");
      return;
    }

    setLoading(true);
    const data = await KajianTambahanService.getAll();
    const isCustomExists = data.some(d => d.id === id);

    let success, error;
    if (!isCustomExists) {
      // Create new with specific ID
      const res = await KajianTambahanService.create({
        id: id as string,
        ...form,
        ustadz: "Ustadzah Rubeya Litiloly",
        created_by_email: user?.email || "",
        created_by_role: user?.role || "",
      } as any);
      success = res.success;
      error = res.error;
    } else {
      const res = await KajianTambahanService.update(id as string, {
        ...form,
        ustadz: "Ustadzah Rubeya Litiloly",
      });
      success = res.success;
      error = res.error;
    }
    setLoading(false);

    if (success) {
      Alert.alert("Berhasil", "Jadwal kajian berhasil diperbarui.", [
        { text: "OK", onPress: () => router.back() }
      ]);
    } else {
      Alert.alert("Gagal Menyimpan", error || "Terjadi kesalahan sistem.");
    }
  };

  if (fetching) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
          <Feather name="arrow-left" size={24} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Edit Jadwal Kajian</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
          Ubah informasi kajian. Perubahan akan langsung terlihat oleh semua pengajar dan admin.
        </Text>

        <Text style={[styles.label, { color: colors.foreground }]}>Judul Kajian *</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
          placeholder="Misal: Kajian Fiqih RT 01"
          placeholderTextColor={colors.mutedForeground}
          value={form.judul}
          onChangeText={(val) => setForm({ ...form, judul: val })}
        />

        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.foreground }]}>Hari *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              placeholder="Misal: Ahad Pekan 1 & 3"
              placeholderTextColor={colors.mutedForeground}
              value={form.hari}
              onChangeText={(val) => setForm({ ...form, hari: val })}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.foreground }]}>Waktu *</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              placeholder="Misal: 16.00 WIB"
              placeholderTextColor={colors.mutedForeground}
              value={form.waktu}
              onChangeText={(val) => setForm({ ...form, waktu: val })}
            />
          </View>
        </View>

        <Text style={[styles.label, { color: colors.foreground }]}>Lokasi Lengkap *</Text>
        <TextInput
          style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
          placeholder="Misal: Masjid Al Ikhlas Perumahan A"
          placeholderTextColor={colors.mutedForeground}
          value={form.lokasi}
          onChangeText={(val) => setForm({ ...form, lokasi: val })}
        />

        <Text style={[styles.label, { color: colors.foreground }]}>Deskripsi Singkat / Ketentuan (Opsional)</Text>
        <TextInput
          style={[styles.input, styles.textArea, { borderColor: colors.border, color: colors.foreground }]}
          placeholder="Kajian khusus akhawat / ibu-ibu..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          value={form.deskripsi}
          onChangeText={(val) => setForm({ ...form, deskripsi: val })}
        />

        <Text style={[styles.label, { color: colors.foreground, marginTop: 12 }]}>Data Contact Person (Opsional)</Text>
        
        <View style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.foreground }]}>Nama CP</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              placeholder="Misal: Fulanah"
              placeholderTextColor={colors.mutedForeground}
              value={form.cp_nama}
              onChangeText={(val) => setForm({ ...form, cp_nama: val })}
            />
          </View>
          <View style={{ width: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.foreground }]}>No Telepon</Text>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
              placeholder="Misal: 0812345678"
              keyboardType="phone-pad"
              placeholderTextColor={colors.mutedForeground}
              value={form.cp_telepon}
              onChangeText={(val) => setForm({ ...form, cp_telepon: val })}
            />
          </View>
        </View>

        <Text style={[styles.label, { color: colors.foreground, marginTop: 12 }]}>Privasi Jadwal *</Text>
        <View style={styles.privacyContainer}>
          <Pressable
            style={[
              styles.privacyOption,
              {
                borderColor: form.is_public ? colors.primary : colors.border,
                backgroundColor: form.is_public ? "rgba(201, 162, 39, 0.1)" : "transparent",
              }
            ]}
            onPress={() => setForm({ ...form, is_public: true })}
          >
            <Feather name="globe" size={20} color={form.is_public ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.privacyTitle, { color: form.is_public ? colors.primary : colors.foreground }]}>Umum</Text>
            <Text style={[styles.privacyDesc, { color: colors.mutedForeground }]}>Semua pengguna (termasuk murid) dapat melihat</Text>
          </Pressable>

          <Pressable
            style={[
              styles.privacyOption,
              {
                borderColor: !form.is_public ? colors.primary : colors.border,
                backgroundColor: !form.is_public ? "rgba(201, 162, 39, 0.1)" : "transparent",
              }
            ]}
            onPress={() => setForm({ ...form, is_public: false })}
          >
            <Feather name="lock" size={20} color={!form.is_public ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.privacyTitle, { color: !form.is_public ? colors.primary : colors.foreground }]}>Privat</Text>
            <Text style={[styles.privacyDesc, { color: colors.mutedForeground }]}>Hanya pengajar dan admin yang dapat melihat</Text>
          </Pressable>
        </View>

        <Pressable
          style={({ pressed }) => [
            styles.submitBtn,
            { backgroundColor: colors.primary, opacity: pressed || loading ? 0.7 : 1 }
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={styles.submitText}>Simpan Perubahan</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  backBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
    paddingBottom: 60,
  },
  infoText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 20,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  submitBtn: {
    marginTop: 32,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  submitText: {
    color: "#FFF",
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  privacyContainer: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  privacyOption: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  privacyTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginTop: 8,
    marginBottom: 4,
  },
  privacyDesc: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
