import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  FlatList,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "@/components/EmptyState";
import { NoteCard } from "@/components/NoteCard";
import { useNotes } from "@/context/NotesContext";
import { useColors } from "@/hooks/useColors";
import { Note } from "@/types";
import { DUMMY_KAJIAN } from "@/services/dummyData";

export default function NotesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notes, addNote, updateNote, deleteNote } = useNotes();
  const [modalVisible, setModalVisible] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);
  const [judul, setJudul] = useState("");
  const [isi, setIsi] = useState("");
  const [selectedKajianId, setSelectedKajianId] = useState<string | undefined>();
  const [search, setSearch] = useState("");

  const filtered = notes.filter(
    (n) =>
      n.judul.toLowerCase().includes(search.toLowerCase()) ||
      n.isi.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditNote(null);
    setJudul("");
    setIsi("");
    setSelectedKajianId(undefined);
    setModalVisible(true);
  };

  const openEdit = (note: Note) => {
    setEditNote(note);
    setJudul(note.judul);
    setIsi(note.isi);
    setSelectedKajianId(note.kajianId);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!judul.trim() || !isi.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const kajian = DUMMY_KAJIAN.find((k) => k.id === selectedKajianId);
    if (editNote) {
      await updateNote(editNote.id, {
        judul: judul.trim(),
        isi: isi.trim(),
        kajianId: selectedKajianId,
        kajianJudul: kajian?.judul,
      });
    } else {
      await addNote({
        judul: judul.trim(),
        isi: isi.trim(),
        kajianId: selectedKajianId,
        kajianJudul: kajian?.judul,
        tags: [],
      });
    }
    setModalVisible(false);
  };

  const topInset = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
            paddingTop: topInset + 8,
          },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Catatan Faedah</Text>
        <Pressable
          onPress={openAdd}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <View
        style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Cari catatan..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <NoteCard note={item} onEdit={openEdit} onDelete={deleteNote} />
        )}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 90,
          },
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="edit-3"
            title="Belum ada catatan"
            subtitle="Catat faedah ilmu dari kajian yang kamu ikuti"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setModalVisible(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              {editNote ? "Edit Catatan" : "Catatan Baru"}
            </Text>
            <Pressable
              onPress={handleSave}
              disabled={!judul.trim() || !isi.trim()}
              style={[
                styles.saveBtn,
                {
                  backgroundColor:
                    judul.trim() && isi.trim() ? colors.primary : colors.muted,
                },
              ]}
            >
              <Text
                style={[
                  styles.saveBtnText,
                  {
                    color:
                      judul.trim() && isi.trim()
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                  },
                ]}
              >
                Simpan
              </Text>
            </Pressable>
          </View>

          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Judul</Text>
            <TextInput
              value={judul}
              onChangeText={setJudul}
              placeholder="Judul catatan..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.textField,
                { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Isi Catatan</Text>
            <TextInput
              value={isi}
              onChangeText={setIsi}
              placeholder="Tulis faedah ilmu di sini..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={8}
              textAlignVertical="top"
              style={[
                styles.textArea,
                { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
              ]}
            />

            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Kajian (opsional)
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                <Pressable
                  onPress={() => setSelectedKajianId(undefined)}
                  style={[
                    styles.kajianChip,
                    {
                      backgroundColor: !selectedKajianId ? colors.primary : colors.card,
                      borderColor: !selectedKajianId ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.kajianChipText,
                      { color: !selectedKajianId ? "#FFFFFF" : colors.foreground },
                    ]}
                  >
                    Tidak ada
                  </Text>
                </Pressable>
                {DUMMY_KAJIAN.map((k) => (
                  <Pressable
                    key={k.id}
                    onPress={() => setSelectedKajianId(k.id)}
                    style={[
                      styles.kajianChip,
                      {
                        backgroundColor:
                          selectedKajianId === k.id ? colors.primary : colors.card,
                        borderColor:
                          selectedKajianId === k.id ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.kajianChipText,
                        {
                          color:
                            selectedKajianId === k.id ? "#FFFFFF" : colors.foreground,
                        },
                      ]}
                      numberOfLines={1}
                    >
                      {k.judul}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    margin: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  modal: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  saveBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  modalBody: {
    padding: 20,
  },
  fieldLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 6,
    marginTop: 4,
  },
  textField: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
  },
  textArea: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 16,
    minHeight: 160,
  },
  kajianChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    maxWidth: 180,
  },
  kajianChipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
