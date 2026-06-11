import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, Platform, Linking, ActivityIndicator } from 'react-native';
import * as Application from 'expo-application';
import { supabase } from '@/services/supabase';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

interface VersionControl {
  latest_version_code: number;
  latest_version_name: string;
  download_url: string;
  is_mandatory: boolean;
  release_notes: string;
}

export function UpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<VersionControl | null>(null);
  const [loading, setLoading] = useState(true);
  const colors = useColors();

  // In standard React Native, the version code is Application.nativeBuildVersion (string like "1" or "2")
  const currentVersionCode = Platform.OS === 'web' ? 999 : Number(Application.nativeBuildVersion || "1");

  useEffect(() => {
    async function checkForUpdates() {
      if (Platform.OS === 'web') {
        setLoading(false);
        return; // Web auto-updates on refresh
      }

      try {
        const { data, error } = await supabase
          .from('app_version_control')
          .select('*')
          .eq('id', 1)
          .single();

        if (data && !error) {
          if (data.latest_version_code > currentVersionCode) {
            setUpdateInfo(data);
          }
        }
      } catch (err) {
        console.error("Failed to check for updates", err);
      } finally {
        setLoading(false);
      }
    }

    checkForUpdates();
  }, [currentVersionCode]);

  if (!updateInfo) return null;

  return (
    <Modal visible={true} transparent={true} animationType="slide">
      <View style={[styles.overlay, { backgroundColor: "rgba(0,0,0,0.85)" }]}>
        <View style={[styles.card, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: "rgba(201,162,39,0.15)" }]}>
            <Feather name="download-cloud" size={32} color="#C9A227" />
          </View>
          
          <Text style={[styles.title, { color: colors.foreground }]}>Pembaruan Tersedia</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Versi {updateInfo.latest_version_name} telah dirilis. Silakan perbarui aplikasi Mulazamahku Anda untuk mendapatkan fitur terbaru dan perbaikan sistem.
          </Text>

          {!!updateInfo.release_notes && (
            <View style={[styles.notesBox, { backgroundColor: colors.highlight, borderColor: colors.border }]}>
              <Text style={[styles.notesLabel, { color: colors.primary }]}>Apa yang baru:</Text>
              <Text style={[styles.notesText, { color: colors.foreground }]}>{updateInfo.release_notes}</Text>
            </View>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.btn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }
            ]}
            onPress={() => Linking.openURL(updateInfo.download_url)}
          >
            <Text style={styles.btnText}>Download Update</Text>
          </Pressable>

          {!updateInfo.is_mandatory && (
            <Pressable
              style={({ pressed }) => [
                styles.btnOutline,
                { borderColor: colors.border, opacity: pressed ? 0.6 : 1 }
              ]}
              onPress={() => setUpdateInfo(null)}
            >
              <Text style={[styles.btnOutlineText, { color: colors.mutedForeground }]}>Nanti Saja</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontFamily: "Inter_700Bold",
    fontSize: 20,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  notesBox: {
    width: "100%",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  notesLabel: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 12,
    marginBottom: 4,
  },
  notesText: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    lineHeight: 20,
  },
  btn: {
    width: "100%",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  btnText: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 15,
    color: "#FFFFFF",
  },
  btnOutline: {
    width: "100%",
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  btnOutlineText: {
    fontFamily: "Inter_500Medium",
    fontSize: 15,
  }
});
