import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Platform,
  Linking,
  ActivityIndicator,
  AppState,
} from 'react-native';
import * as Application from 'expo-application';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
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

function compareSemver(a: string, b: string): number {
  const pa = a.split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.split('.').map((n) => parseInt(n, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const va = pa[i] ?? 0;
    const vb = pb[i] ?? 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

/**
 * Pop-up otomatis saat aplikasi perlu diupdate ke versi terbaru:
 * - Memeriksa tabel `app_version_control` di Supabase (berdasarkan versionCode & semver)
 * - Memeriksa EAS OTA Updates (`expo-updates`) secara otomatis saat aplikasi dibuka / kembali aktif
 */
export function UpdateChecker() {
  const [updateInfo, setUpdateInfo] = useState<VersionControl | null>(null);
  const [otaAvailable, setOtaAvailable] = useState(false);
  const [applyingOta, setApplyingOta] = useState(false);
  const lastCheckedRef = useRef(0);
  const colors = useColors();

  const parsedCode = Number(Application.nativeBuildVersion);
  const currentVersionCode = Number.isFinite(parsedCode) && parsedCode > 0 ? parsedCode : 1;
  const currentVersionName =
    Application.nativeApplicationVersion || Constants.expoConfig?.version || '1.0.0';

  const checkForUpdates = useCallback(async () => {
    if (Platform.OS === 'web') return;

    // Hindari cek berulang terlalu cepat dalam < 60 detik
    const now = Date.now();
    if (now - lastCheckedRef.current < 60_000) return;
    lastCheckedRef.current = now;

    // 1. Cek pembaruan versi native di Supabase
    try {
      const { data, error } = await supabase
        .from('app_version_control')
        .select('*')
        .eq('id', 1)
        .single();

      if (data && !error) {
        const newerCode = Number(data.latest_version_code) > currentVersionCode;
        const newerName =
          !!data.latest_version_name &&
          compareSemver(String(data.latest_version_name), currentVersionName) > 0;

        if (newerCode || newerName) {
          setUpdateInfo(data);
          return;
        }
      }
    } catch {
      // Abaikan jika offline
    }

    // 2. Cek pembaruan OTA (EAS Updates) otomatis
    try {
      if (!__DEV__) {
        const update = await Updates.checkForUpdateAsync();
        if (update.isAvailable) {
          setOtaAvailable(true);
        }
      }
    } catch {
      // Abaikan error OTA di dev/offline
    }
  }, [currentVersionCode, currentVersionName]);

  useEffect(() => {
    checkForUpdates();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkForUpdates();
      }
    });
    return () => sub.remove();
  }, [checkForUpdates]);

  const handleApplyOta = async () => {
    setApplyingOta(true);
    try {
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch {
      setApplyingOta(false);
      setOtaAvailable(false);
    }
  };

  if (!updateInfo && !otaAvailable) return null;

  const isMandatory = updateInfo ? updateInfo.is_mandatory : false;

  return (
    <Modal visible={true} transparent={true} animationType="fade">
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.82)' }]}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.iconWrap, { backgroundColor: 'rgba(201,162,39,0.16)' }]}>
            <Feather name="download-cloud" size={32} color={colors.gold} />
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>
            Pembaruan Tersedia
          </Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {updateInfo
              ? `Versi ${updateInfo.latest_version_name} telah dirilis. Silakan perbarui aplikasi Mulazamahku Anda untuk mendapatkan fitur terbaru dan perbaikan sistem.`
              : 'Pembaruan sistem dan tampilan terbaru sudah tersedia. Perbarui sekarang agar aplikasi tetap optimal.'}
          </Text>

          {!!updateInfo?.release_notes && (
            <View style={[styles.notesBox, { backgroundColor: colors.highlight, borderColor: colors.border }]}>
              <Text style={[styles.notesLabel, { color: colors.accentText }]}>Apa yang baru:</Text>
              <Text style={[styles.notesText, { color: colors.foreground }]}>{updateInfo.release_notes}</Text>
            </View>
          )}

          {updateInfo ? (
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => Linking.openURL(updateInfo.download_url)}
            >
              <Text style={styles.btnText}>Download Update</Text>
            </Pressable>
          ) : (
            <Pressable
              style={({ pressed }) => [
                styles.btn,
                { backgroundColor: colors.primary, opacity: pressed || applyingOta ? 0.85 : 1 },
              ]}
              onPress={handleApplyOta}
              disabled={applyingOta}
            >
              {applyingOta ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.btnText}>Update Sekarang</Text>
              )}
            </Pressable>
          )}

          {!isMandatory && !applyingOta && (
            <Pressable
              style={({ pressed }) => [
                styles.btnOutline,
                { borderColor: colors.border, opacity: pressed ? 0.6 : 1 },
              ]}
              onPress={() => {
                setUpdateInfo(null);
                setOtaAvailable(false);
              }}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  notesBox: {
    width: '100%',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 22,
  },
  notesLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginBottom: 4,
  },
  notesText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 20,
  },
  btn: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  btnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  btnOutline: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  btnOutlineText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
});
