import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { MudzakarahTopic } from "@/types";

interface Props {
  topic: MudzakarahTopic;
  onPress: (topic: MudzakarahTopic) => void;
}

function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (hours < 1) return "Baru saja";
  if (hours < 24) return `${hours} jam lalu`;
  if (days === 1) return "Kemarin";
  return `${days} hari lalu`;
}

export function MudzakarahCard({ topic, onPress }: Props) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress(topic);
      }}
      style={({ pressed }) => [
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.92 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
      ]}
    >
      <Text style={[styles.judul, { color: colors.foreground }]} numberOfLines={2}>
        {topic.judul}
      </Text>
      <Text style={[styles.pertanyaan, { color: colors.mutedForeground }]} numberOfLines={2}>
        {topic.pertanyaan}
      </Text>
      <View style={styles.footer}>
        <View style={styles.authorRow}>
          <View style={[styles.avatar, { backgroundColor: colors.highlight }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {topic.authorName.charAt(0)}
            </Text>
          </View>
          <Text style={[styles.author, { color: colors.mutedForeground }]}>{topic.authorName}</Text>
          <Text style={[styles.time, { color: colors.mutedForeground }]}>
            · {formatRelative(topic.createdAt)}
          </Text>
        </View>
        <View style={[styles.replyBadge, { backgroundColor: colors.muted }]}>
          <Feather name="message-circle" size={12} color={colors.mutedForeground} />
          <Text style={[styles.replyCount, { color: colors.mutedForeground }]}>
            {topic.jawaban.length}
          </Text>
        </View>
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
  judul: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 5,
    lineHeight: 21,
  },
  pertanyaan: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 19,
    marginBottom: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  avatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  author: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  time: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  replyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  replyCount: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
