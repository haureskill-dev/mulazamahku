import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Pressable, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import FaedahScreen from "./faedah";
import RujukanScreen from "./rujukan";

/**
 * Pojok Baca:
 * Menggabungkan Faidah Kajian & Kitab Rujukan dalam satu tab elegan
 * dengan segmented switcher modern di bagian atas.
 */
export default function PojokBacaScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const params = useLocalSearchParams<{ tab?: string }>();

  const [activeTab, setActiveTab] = useState<"faidah" | "rujukan">(() => {
    return params.tab === "rujukan" ? "rujukan" : "faidah";
  });

  useEffect(() => {
    if (params.tab === "rujukan") {
      setActiveTab("rujukan");
    } else if (params.tab === "faidah" || params.tab === "faedah") {
      setActiveTab("faidah");
    }
  }, [params.tab]);

  const SegmentedHeader = (
    <View style={[styles.headerContainer, { paddingTop: insets.top + (Platform.OS === "web" ? 14 : 8) }]}>
      <View style={styles.titleArea}>
        <Text style={[styles.screenTitle, { color: colors.foreground }]}>Pojok Baca</Text>
        <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
          Perbendaharaan faidah ilmu dan kitab rujukan kajian
        </Text>
      </View>

      {/* Segmented Control */}
      <View style={[styles.segmentedWrapper, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.selectionAsync();
            setActiveTab("faidah");
          }}
          style={({ pressed }) => [
            styles.segmentBtn,
            activeTab === "faidah" && { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              {
                color: activeTab === "faidah" ? "#FFFFFF" : colors.mutedForeground,
                fontFamily: activeTab === "faidah" ? "Inter_700Bold" : "Inter_500Medium",
              },
            ]}
          >
            ✦ Faidah Kajian
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            if (Platform.OS !== "web") Haptics.selectionAsync();
            setActiveTab("rujukan");
          }}
          style={({ pressed }) => [
            styles.segmentBtn,
            activeTab === "rujukan" && { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text
            style={[
              styles.segmentText,
              {
                color: activeTab === "rujukan" ? "#FFFFFF" : colors.mutedForeground,
                fontFamily: activeTab === "rujukan" ? "Inter_700Bold" : "Inter_500Medium",
              },
            ]}
          >
            📚 Kitab Rujukan
          </Text>
        </Pressable>
      </View>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {activeTab === "faidah" ? (
        <FaedahScreen hideTopInset headerComponent={SegmentedHeader} />
      ) : (
        <RujukanScreen hideTopInset headerComponent={SegmentedHeader} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerContainer: {
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  titleArea: {
    marginBottom: 14,
  },
  screenTitle: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  screenSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 18,
  },
  segmentedWrapper: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentText: {
    fontSize: 13,
  },
});
