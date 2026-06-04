import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Slot, router, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";

let KeyboardProvider: React.ComponentType<any> = ({ children }) => <>{children}</>;
if (Platform.OS !== "web") {
  try {
    KeyboardProvider = require("react-native-keyboard-controller").KeyboardProvider;
  } catch {}
}
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { NotesProvider } from "@/context/NotesContext";
import { MudzakarahProvider } from "@/context/MudzakarahContext";
import { scheduleAllKajianReminders } from "@/services/notificationService";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) return;
    const inTabs = segments[0] === "(tabs)";
    
    const isLoginScreen = segments.length === 0 || segments[0] === "index";
    
    // Redirect unauthenticated users trying to access ANY protected screen
    if (!user && !isLoginScreen) {
      router.replace("/");
    } 
    // Redirect authenticated users trying to access the login screen
    else if (user && (segments.length === 0 || segments[0] === "index")) {
      router.replace("/(tabs)");
    }
  }, [user, isLoading, segments]);

  // Jadwalkan ulang notifikasi H-1 saat user masuk
  useEffect(() => {
    if (user) {
      scheduleAllKajianReminders();
    }
  }, [user]);

  return <>{children}</>;
}

function RootLayoutNav() {
  return (
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      <View
        style={{
          flex: 1,
          width: "100%",
          backgroundColor: "#FFFFFF",
        }}
      >
        <AuthGuard>
          <Slot />
        </AuthGuard>
      </View>
    </View>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotesProvider>
              <MudzakarahProvider>
                <GestureHandlerRootView style={{ flex: 1 }}>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </MudzakarahProvider>
            </NotesProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
