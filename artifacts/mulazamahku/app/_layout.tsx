// ⚠️ HARUS di paling atas — defineTask() wajib dipanggil sebelum komponen React
import "@/services/backgroundTaskSetup";

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
import React, { useEffect, useRef } from "react";
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
import { UpdateChecker } from "@/components/UpdateChecker";
import { scheduleAllKajianReminders, registerBackgroundNotificationTask } from "@/services/notificationService";
import { registerPushToken } from "@/services/pushTokenService";
import * as Notifications from "expo-notifications";

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

  // Jadwalkan notifikasi, daftarkan background task, & daftarkan push token saat user masuk
  const hasScheduled = useRef(false);
  useEffect(() => {
    if (user && !hasScheduled.current) {
      hasScheduled.current = true;
      // Jadwalkan notifikasi lokal 30 hari ke depan
      scheduleAllKajianReminders(user.role).catch(e => 
        console.warn("[Layout] Gagal jadwalkan notifikasi:", e)
      );
      // Daftarkan background task agar tetap jalan walau app ditutup
      registerBackgroundNotificationTask().catch(e =>
        console.warn("[Layout] Gagal daftarkan background task:", e)
      );
      // Daftarkan Expo Push Token ke Supabase untuk push notifikasi dari server
      registerPushToken(user.role, user.nama).then(token => {
        if (token) {
          console.log("[Layout] Push token terdaftar:", token);
        } else {
          console.warn("[Layout] Push token gagal didaftarkan — cek izin notifikasi dan build type.");
        }
      }).catch(e =>
        console.warn("[Layout] Gagal daftarkan push token:", e)
      );
    }
    // Reset flag saat user logout
    if (!user) {
      hasScheduled.current = false;
    }
  }, [user]);

  // Handler notifikasi push yang diterima saat app di foreground
  useEffect(() => {
    if (Platform.OS === "web") return;

    const subscription = Notifications.addNotificationReceivedListener(notification => {
      console.log("[Layout] Push notification diterima:", notification.request.content.title);
      console.log("[Layout] Data:", JSON.stringify(notification.request.content.data));
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      console.log("[Layout] Notifikasi diklik. Data:", JSON.stringify(data));

      try {
        const type = data?.type as string | undefined;
        const kajianId = data?.kajianId as string | undefined;
        const reminderType = data?.reminderType as string | undefined;

        if (type === "flyer") {
          // Notifikasi flyer → buka tab flyer
          router.push("/(tabs)/flyer");
        } else if (type === "batal" && kajianId) {
          // Notifikasi kajian batal → buka detail kajian
          router.push(`/kajian/${kajianId}`);
        } else if (kajianId && kajianId !== "test") {
          // Notifikasi reminder kajian (h1/h3jam/h30m) → buka detail kajian
          router.push(`/kajian/${kajianId}`);
        } else {
          // Fallback: buka tab utama
          router.push("/(tabs)");
        }
      } catch (e) {
        console.warn("[Layout] Error navigasi dari notifikasi:", e);
        router.push("/(tabs)");
      }
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }, []);

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
          <UpdateChecker />
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
