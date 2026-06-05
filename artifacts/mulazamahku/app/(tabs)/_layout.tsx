import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

// Native-only imports — use dynamic require to prevent web crash
let isLiquidGlassAvailable: () => boolean = () => false;
let NativeTabsModule: any = null;
let SymbolViewComponent: any = null;

if (Platform.OS !== "web") {
  try {
    const glassModule = require("expo-glass-effect");
    isLiquidGlassAvailable = glassModule.isLiquidGlassAvailable;
  } catch {}
  try {
    NativeTabsModule = require("expo-router/unstable-native-tabs");
  } catch {}
  try {
    const symbolsModule = require("expo-symbols");
    SymbolViewComponent = symbolsModule.SymbolView;
  } catch {}
}

function NativeTabLayout() {
  const { user } = useAuth();
  if (!NativeTabsModule) return <ClassicTabLayout />;
  const { NativeTabs, Icon, Label } = NativeTabsModule;
  return (
    <NativeTabs>
      {user?.role !== "pengajar" && (
        <NativeTabs.Trigger name="notes">
          <Icon sf={{ default: "note.text", selected: "note.text" }} />
          <Label>Catatan</Label>
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="faedah">
        <Icon sf={{ default: "photo.artframe", selected: "photo.artframe" }} />
        <Label>Faedah</Label>
      </NativeTabs.Trigger>
      {user?.role === "admin" && (
        <NativeTabs.Trigger name="flyer">
          <Icon sf={{ default: "megaphone", selected: "megaphone.fill" }} />
          <Label>Flyer</Label>
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Beranda</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="rujukan">
        <Icon sf={{ default: "book", selected: "book.fill" }} />
        <Label>Rujukan</Label>
      </NativeTabs.Trigger>
      {user?.role !== "pengajar" && (
        <NativeTabs.Trigger name="mudzakarah">
          <Icon sf={{ default: "message.circle", selected: "message.circle.fill" }} />
          <Label>Mudzakarah</Label>
        </NativeTabs.Trigger>
      )}
      <NativeTabs.Trigger name="profile">
        <Icon sf={{ default: "person.circle", selected: "person.circle.fill" }} />
        <Label>Profil</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const safeAreaInsets = useSafeAreaInsets();
  const { user } = useAuth();

  // Hitung jumlah tab yang terlihat berdasarkan role user
  let visibleTabsCount = 0;
  if (user?.role !== "pengajar") visibleTabsCount++; // notes
  visibleTabsCount++; // faedah
  if (user?.role === "admin") visibleTabsCount++; // flyer
  visibleTabsCount++; // index
  visibleTabsCount++; // rujukan
  if (user?.role !== "pengajar") visibleTabsCount++; // mudzakarah
  visibleTabsCount++; // profile

  const isOddTabs = visibleTabsCount % 2 !== 0;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.background,
          borderTopWidth: isWeb ? 1 : 0,
          borderTopColor: colors.border,
          elevation: 0,
          paddingBottom: isWeb ? 8 : safeAreaInsets.bottom,
          ...(isWeb ? { height: 60 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: colors.background },
              ]}
            />
          ) : null,
      }}
    >
      <Tabs.Screen
        name="notes"
        options={{
          title: "Catatan",
          href: user?.role === "pengajar" ? null : undefined,
          tabBarIcon: ({ color }) =>
            isIOS && SymbolViewComponent ? (
              <SymbolViewComponent name="note.text" tintColor={color} size={24} />
            ) : (
              <Feather name="edit-3" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="faedah"
        options={{
          title: "Faedah",
          tabBarIcon: ({ color }) =>
            isIOS && SymbolViewComponent ? (
              <SymbolViewComponent name="photo.artframe" tintColor={color} size={24} />
            ) : (
              <Feather name="image" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="flyer"
        options={{
          title: "Flyer",
          href: user?.role !== "admin" ? null : undefined,
          tabBarIcon: ({ color }) =>
            isIOS && SymbolViewComponent ? (
              <SymbolViewComponent name="megaphone" tintColor={color} size={24} />
            ) : (
              <Feather name="airplay" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: "Beranda",
          tabBarShowLabel: isOddTabs ? false : true,
          tabBarIcon: ({ color, focused }) => {
            if (isIOS && SymbolViewComponent) {
              return <SymbolViewComponent name="house" tintColor={color} size={24} />;
            }
            
            if (isOddTabs) {
              return (
                <View
                  style={{
                    backgroundColor: colors.primary,
                    width: 56,
                    height: 56,
                    borderRadius: 28,
                    justifyContent: "center",
                    alignItems: "center",
                    marginBottom: 20,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 5,
                  }}
                >
                  <Feather name="home" size={24} color="#FFFFFF" />
                </View>
              );
            }

            // Jika jumlah tab genap, tampilkan sebagai tab normal
            return <Feather name="home" size={22} color={color} />;
          },
        }}
      />
      <Tabs.Screen
        name="rujukan"
        options={{
          title: "Rujukan",
          tabBarIcon: ({ color }) =>
            isIOS && SymbolViewComponent ? (
              <SymbolViewComponent name="book" tintColor={color} size={24} />
            ) : (
              <Feather name="book-open" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="mudzakarah"
        options={{
          title: "Mudzakarah",
          href: user?.role === "pengajar" ? null : undefined,
          tabBarIcon: ({ color }) =>
            isIOS && SymbolViewComponent ? (
              <SymbolViewComponent name="message.circle" tintColor={color} size={24} />
            ) : (
              <Feather name="message-circle" size={22} color={color} />
            ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profil",
          tabBarIcon: ({ color }) =>
            isIOS && SymbolViewComponent ? (
              <SymbolViewComponent name="person.circle" tintColor={color} size={24} />
            ) : (
              <Feather name="user" size={22} color={color} />
            ),
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (Platform.OS !== "web" && isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
