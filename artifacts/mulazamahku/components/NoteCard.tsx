import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Alert, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { Note } from "@/types";

interface Props {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export function NoteCard({ note, onEdit, onDelete }: Props) {
  const colors = useColors();

  const handleDelete = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert("Hapus Catatan", "Yakin ingin menghapus catatan ini?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => onDelete(note.id),
      },
    ]);
  };

  return (
    <Pressable
      onPress={() => onEdit(note)}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.93 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <View style={styles.topRow}>
        <Text style={[styles.judul, { color: colors.foreground }]} numberOfLines={1}>
          {note.judul}
        </Text>
        <Pressable onPress={handleDelete} hitSlop={10}>
          <Feather name="trash-2" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      <Text style={[styles.isi, { color: colors.mutedForeground }]} numberOfLines={3}>
        {note.isi}
      </Text>

      <View style={styles.footer}>
        {note.kajianJudul && (
          <View style={[styles.kajianTag, { backgroundColor: colors.highlight }]}>
            <Feather name="bookmark" size={10} color={colors.primary} />
            <Text style={[styles.kajianTagText, { color: colors.primary }]} numberOfLines={1}>
              {note.kajianJudul}
            </Text>
          </View>
        )}
        <Text style={[styles.date, { color: colors.mutedForeground }]}>
          {formatDate(note.updatedAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 15,
    marginBottom: 10,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
    gap: 8,
  },
  judul: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  isi: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    marginBottom: 10,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  kajianTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    flex: 1,
  },
  kajianTagText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  date: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
