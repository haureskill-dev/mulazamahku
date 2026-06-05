import React, { useRef, useState, useCallback } from "react";
import {
  Animated,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Feather } from "@expo/vector-icons";

interface Props {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshing: boolean;
  style?: any;
  contentContainerStyle?: any;
  primaryColor?: string;
}

/**
 * ScrollView wrapper dengan pull-to-refresh yang berfungsi di Web.
 * Di native (iOS/Android), menggunakan RefreshControl bawaan.
 * Di web, menggunakan custom touch/pointer gesture.
 */
export function WebPullToRefresh({
  children,
  onRefresh,
  refreshing,
  style,
  contentContainerStyle,
  primaryColor = "#1B5B8D",
}: Props) {
  // Native: gunakan RefreshControl biasa
  if (Platform.OS !== "web") {
    return (
      <ScrollView
        style={style}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[primaryColor]}
            tintColor={primaryColor}
          />
        }
      >
        {children}
      </ScrollView>
    );
  }

  // Web: custom pull-to-refresh
  const scrollRef = useRef<ScrollView>(null);
  const startY = useRef(0);
  const pullDistance = useRef(new Animated.Value(0)).current;
  const [isPulling, setIsPulling] = useState(false);
  const [isAtTop, setIsAtTop] = useState(true);
  const threshold = 80;

  const handleScroll = useCallback((e: any) => {
    const offsetY = e.nativeEvent.contentOffset.y;
    setIsAtTop(offsetY <= 2);
  }, []);

  const handleTouchStart = useCallback((e: any) => {
    if (!isAtTop || refreshing) return;
    const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
    startY.current = touch.pageY;
  }, [isAtTop, refreshing]);

  const handleTouchMove = useCallback((e: any) => {
    if (!isAtTop || refreshing) return;
    const touch = e.nativeEvent.touches?.[0] || e.nativeEvent;
    const delta = touch.pageY - startY.current;

    if (delta > 0) {
      setIsPulling(true);
      // Dampen the pull (feels more natural)
      const dampened = Math.min(delta * 0.5, threshold * 1.5);
      pullDistance.setValue(dampened);
    }
  }, [isAtTop, refreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;
    setIsPulling(false);

    // Check pull value (use __getValue for Animated.Value)
    const currentVal = (pullDistance as any).__getValue?.() ?? 0;

    if (currentVal >= threshold) {
      // Snap to loading position
      Animated.spring(pullDistance, {
        toValue: 50,
        useNativeDriver: true,
      }).start();
      await onRefresh();
    }

    // Animate back to 0
    Animated.spring(pullDistance, {
      toValue: 0,
      useNativeDriver: true,
      tension: 40,
      friction: 7,
    }).start();
  }, [isPulling, onRefresh]);

  // Rotation for the arrow icon
  const rotation = pullDistance.interpolate({
    inputRange: [0, threshold],
    outputRange: ["0deg", "180deg"],
    extrapolate: "clamp",
  });

  const opacity = pullDistance.interpolate({
    inputRange: [0, 30, threshold],
    outputRange: [0, 0.5, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={{ flex: 1 }}>
      {/* Pull indicator */}
      <Animated.View
        style={[
          webStyles.indicator,
          {
            opacity,
            transform: [{ translateY: Animated.subtract(pullDistance, 50) }],
          },
        ]}
      >
        {refreshing ? (
          <ActivityIndicator size="small" color={primaryColor} />
        ) : (
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Feather name="arrow-down" size={20} color={primaryColor} />
          </Animated.View>
        )}
        <Text style={[webStyles.indicatorText, { color: primaryColor }]}>
          {refreshing ? "Memuat ulang..." : "Tarik untuk refresh"}
        </Text>
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        style={style}
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {children}
      </ScrollView>
    </View>
  );
}

const webStyles = StyleSheet.create({
  indicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 50,
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.06)",
  },
  indicatorText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
});
