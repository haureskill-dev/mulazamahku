import React, { useState } from "react";
import { View, Text, StyleSheet, Pressable, Platform, ScrollView, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

export interface CanvaCarouselItem {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  badge?: string;
  onPress?: () => void;
  aspectRatio?: number;
}

interface CanvaCarouselProps {
  items: CanvaCarouselItem[];
  title?: string;
  subtitle?: string;
  actionText?: string;
  onActionPress?: () => void;
  cardHeight?: number;
  emptyText?: string;
  onItemPress?: (item: CanvaCarouselItem) => void;
}

/**
 * Carousel bergaya Canva:
 * - Setiap kartu memiliki TINGGI YANG SAMA PERSIS (default 200px)
 * - Lebar menyesuaikan rasio aspek asli gambar (dibatasi min 140px & max 280px)
 * - Sudut membulat modern (borderRadius: 16), border halus, bayangan lembut
 * - Konsisten, rapi, dan seimbang seperti galeri template Canva.
 */
export function CanvaCarousel({
  items,
  title,
  subtitle,
  actionText,
  onActionPress,
  cardHeight = 200,
  emptyText = "Belum ada item",
  onItemPress,
}: CanvaCarouselProps) {
  const colors = useColors();
  const [aspectRatios, setAspectRatios] = useState<Record<string, number>>({});

  if (!items || items.length === 0) {
    return (
      <View style={styles.container}>
        {title && (
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
          </View>
        )}
        <View style={[styles.emptyBox, { borderColor: colors.border, backgroundColor: colors.card }]}>
          <Feather name="image" size={28} color={colors.mutedForeground} style={{ opacity: 0.5, marginBottom: 6 }} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>{emptyText}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {(title || actionText) && (
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            {title && <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>}
            {subtitle && <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>}
          </View>
          {actionText && (
            <Pressable
              onPress={onActionPress}
              style={({ pressed }) => [styles.actionBtn, { opacity: pressed ? 0.6 : 1 }]}
              hitSlop={8}
            >
              <Text style={[styles.actionText, { color: colors.primary }]}>{actionText}</Text>
              <Feather name="chevron-right" size={16} color={colors.primary} />
            </Pressable>
          )}
        </View>
      )}

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {items.map((item) => {
          const ratio = aspectRatios[item.id] || item.aspectRatio || 3 / 4;
          // Hitung lebar berdasarkan rasio dengan tinggi tetap
          const calculatedWidth = Math.round(cardHeight * ratio);
          const cardWidth = Math.min(Math.max(calculatedWidth, 140), 280);

          return (
            <Pressable
              key={item.id}
              onPress={() => (item.onPress ? item.onPress() : onItemPress ? onItemPress(item) : null)}
              style={({ pressed }) => [
                styles.card,
                {
                  width: cardWidth,
                  height: cardHeight,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                  opacity: pressed ? 0.9 : 1,
                },
              ]}
            >
              <Image
                source={{ uri: item.imageUrl }}
                style={styles.cardImage}
                contentFit="cover"
                transition={200}
                onLoad={(e) => {
                  if (e.source.width && e.source.height) {
                    const r = e.source.width / e.source.height;
                    setAspectRatios((prev) => ({ ...prev, [item.id]: r }));
                  }
                }}
              />

              {item.badge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.badge}</Text>
                </View>
              )}

              {(item.title || item.subtitle) && (
                <View style={styles.overlay}>
                  {item.title && (
                    <Text style={styles.overlayTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                  )}
                  {item.subtitle && (
                    <Text style={styles.overlaySub} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  actionText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  scrollContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  badge: {
    position: "absolute",
    top: 8,
    left: 8,
    backgroundColor: "rgba(0,0,0,0.65)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#FFFFFF",
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  overlayTitle: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  overlaySub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  emptyBox: {
    marginHorizontal: 20,
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
