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
import { MudzakarahCard } from "@/components/MudzakarahCard";
import { useMudzakarah } from "@/context/MudzakarahContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { MudzakarahTopic, MudzakarahJawaban } from "@/types";

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return "Baru saja";
  if (hours < 24) return `${hours} jam lalu`;
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
}

export default function MudzakarahScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { topics, addTopic, addJawaban } = useMudzakarah();

  const [addTopicModal, setAddTopicModal] = useState(false);
  const [detailModal, setDetailModal] = useState<MudzakarahTopic | null>(null);
  const [newJudul, setNewJudul] = useState("");
  const [newPertanyaan, setNewPertanyaan] = useState("");
  const [jawabanText, setJawabanText] = useState("");

  const topInset = insets.top;

  const handleAddTopic = async () => {
    if (!newJudul.trim() || !newPertanyaan.trim()) return;
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await addTopic({
      judul: newJudul.trim(),
      pertanyaan: newPertanyaan.trim(),
      authorName: user?.nama ?? "Anonim",
    });
    setNewJudul("");
    setNewPertanyaan("");
    setAddTopicModal(false);
  };

  const handleAddJawaban = async () => {
    if (!jawabanText.trim() || !detailModal) return;
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await addJawaban(detailModal.id, {
      isi: jawabanText.trim(),
      authorName: user?.nama ?? "Anonim",
    });
    const updatedTopic = topics.find((t) => t.id === detailModal.id);
    if (updatedTopic) setDetailModal({ ...updatedTopic });
    setJawabanText("");
  };

  const openDetail = (topic: MudzakarahTopic) => {
    setDetailModal(topic);
  };

  React.useEffect(() => {
    if (detailModal) {
      const updated = topics.find((t) => t.id === detailModal.id);
      if (updated) setDetailModal(updated);
    }
  }, [topics]);

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
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Mudzakarah</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Diskusi bersama sahabat
          </Text>
        </View>
        <Pressable
          onPress={() => setAddTopicModal(true)}
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <FlatList
        data={topics}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MudzakarahCard topic={item} onPress={openDetail} />
        )}
        contentContainerStyle={[
          styles.list,
          {
            paddingBottom: insets.bottom + 90,
          },
        ]}
        ListEmptyComponent={
          <EmptyState
            icon="message-circle"
            title="Belum ada diskusi"
            subtitle="Mulai mudzakarah dengan mengajukan pertanyaan"
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <Modal
        visible={addTopicModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setAddTopicModal(false)}
      >
        <View style={[styles.modal, { backgroundColor: colors.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setAddTopicModal(false)}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Topik Baru</Text>
            <Pressable
              onPress={handleAddTopic}
              disabled={!newJudul.trim() || !newPertanyaan.trim()}
              style={[
                styles.saveBtn,
                {
                  backgroundColor:
                    newJudul.trim() && newPertanyaan.trim() ? colors.primary : colors.muted,
                },
              ]}
            >
              <Text
                style={[
                  styles.saveBtnText,
                  {
                    color:
                      newJudul.trim() && newPertanyaan.trim()
                        ? "#FFFFFF"
                        : colors.mutedForeground,
                  },
                ]}
              >
                Kirim
              </Text>
            </Pressable>
          </View>
          <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Judul Topik</Text>
            <TextInput
              value={newJudul}
              onChangeText={setNewJudul}
              placeholder="Misal: Hukum shalat jamak..."
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.textField,
                { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
              ]}
            />
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Pertanyaan</Text>
            <TextInput
              value={newPertanyaan}
              onChangeText={setNewPertanyaan}
              placeholder="Jelaskan pertanyaanmu..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              style={[
                styles.textArea,
                { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border },
              ]}
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal
        visible={!!detailModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetailModal(null)}
      >
        {detailModal && (
          <View style={[styles.modal, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <Pressable onPress={() => setDetailModal(null)}>
                <Feather name="arrow-left" size={22} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.foreground }]} numberOfLines={1}>
                Diskusi
              </Text>
              <View style={{ width: 22 }} />
            </View>

            <ScrollView style={styles.modalBody} keyboardShouldPersistTaps="handled">
              <View
                style={[
                  styles.topicBox,
                  { backgroundColor: colors.highlight, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.topicJudul, { color: colors.foreground }]}>
                  {detailModal.judul}
                </Text>
                <Text style={[styles.topicPertanyaan, { color: colors.foreground }]}>
                  {detailModal.pertanyaan}
                </Text>
                <View style={styles.topicMeta}>
                  <View style={[styles.avatarSmall, { backgroundColor: colors.primary }]}>
                    <Text style={styles.avatarSmallText}>
                      {detailModal.authorName.charAt(0)}
                    </Text>
                  </View>
                  <Text style={[styles.topicAuthor, { color: colors.mutedForeground }]}>
                    {detailModal.authorName} · {formatRelative(detailModal.createdAt)}
                  </Text>
                </View>
              </View>

              {detailModal.jawaban.length > 0 && (
                <Text style={[styles.replyHeader, { color: colors.mutedForeground }]}>
                  {detailModal.jawaban.length} Jawaban
                </Text>
              )}

              {detailModal.jawaban.map((j) => (
                <View
                  key={j.id}
                  style={[
                    styles.replyCard,
                    { backgroundColor: colors.card, borderColor: colors.border },
                  ]}
                >
                  <View style={styles.replyTop}>
                    <View
                      style={[styles.avatarSmall, { backgroundColor: colors.muted }]}
                    >
                      <Text
                        style={[styles.avatarSmallText, { color: colors.foreground }]}
                      >
                        {j.authorName.charAt(0)}
                      </Text>
                    </View>
                    <Text style={[styles.replyAuthor, { color: colors.foreground }]}>
                      {j.authorName}
                    </Text>
                    <Text style={[styles.replyTime, { color: colors.mutedForeground }]}>
                      · {formatRelative(j.createdAt)}
                    </Text>
                  </View>
                  <Text style={[styles.replyIsi, { color: colors.foreground }]}>{j.isi}</Text>
                </View>
              ))}

              <View style={styles.addReplySection}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Tambah Jawaban</Text>
                <TextInput
                  value={jawabanText}
                  onChangeText={setJawabanText}
                  placeholder="Tuliskan jawabanmu..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  style={[
                    styles.textArea,
                    {
                      color: colors.foreground,
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                  ]}
                />
                <Pressable
                  onPress={handleAddJawaban}
                  disabled={!jawabanText.trim()}
                  style={({ pressed }) => [
                    styles.replyBtn,
                    {
                      backgroundColor: jawabanText.trim() ? colors.primary : colors.muted,
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.replyBtnText,
                      {
                        color: jawabanText.trim()
                          ? colors.primaryForeground
                          : colors.mutedForeground,
                      },
                    ]}
                  >
                    Kirim Jawaban
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        )}
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
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  list: {
    padding: 16,
    paddingTop: 12,
  },
  modal: { flex: 1 },
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
    flex: 1,
    textAlign: "center",
    marginHorizontal: 8,
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
  modalBody: { padding: 20 },
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
    minHeight: 100,
  },
  topicBox: {
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  topicJudul: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
    lineHeight: 24,
  },
  topicPertanyaan: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 21,
    marginBottom: 12,
  },
  topicMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  topicAuthor: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  replyHeader: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 10,
  },
  replyCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  replyTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 8,
  },
  avatarSmall: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarSmallText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#FFFFFF",
  },
  replyAuthor: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  replyTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  replyIsi: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  addReplySection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#E5E5E5",
  },
  replyBtn: {
    height: 46,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  replyBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
