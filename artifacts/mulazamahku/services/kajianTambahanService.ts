import { supabase } from "./supabase";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface KajianTambahan {
  id: string;
  judul: string;
  ustadz: string;
  waktu: string;
  hari: string;
  lokasi: string;
  deskripsi?: string;
  cp_nama?: string;
  cp_telepon?: string;
  is_public?: boolean;
  is_deleted?: boolean;
  created_by_email: string;
  created_by_role: string;
  created_at: string;
}

const TABLE_NAME = "kajian_tambahan";
const CACHE_KEY = "@mulazamahku_kajian_tambahan_cache";

export const KajianTambahanService = {
  async getAll(): Promise<KajianTambahan[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) {
        // Network gagal → fallback ke cache
        return this._getFromCache();
      }

      // Simpan ke cache untuk offline
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
      return data as KajianTambahan[];
    } catch (e) {
      // Offline → fallback ke cache
      return this._getFromCache();
    }
  },

  async _getFromCache(): Promise<KajianTambahan[]> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) return JSON.parse(cached) as KajianTambahan[];
    } catch {}
    return [];
  },

  async create(kajian: Omit<KajianTambahan, "id" | "created_at">): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from(TABLE_NAME).insert(kajian);
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async createWithId(id: string, kajian: Omit<KajianTambahan, "id" | "created_at">): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from(TABLE_NAME).upsert(
      { id, ...kajian },
      { onConflict: 'id' }
    );
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async delete(
    id: string,
    fallback?: {
      judul: string;
      ustadz: string;
      waktu: string;
      hari: string;
      lokasi: string;
      created_by_email?: string;
      created_by_role?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    // Cek apakah baris dengan id ini sudah ada di kajian_tambahan
    const { data: existing } = await supabase
      .from(TABLE_NAME)
      .select("id")
      .eq("id", id)
      .maybeSingle();

    if (existing) {
      const { error } = await supabase
        .from(TABLE_NAME)
        .update({ is_deleted: true })
        .eq("id", id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    }

    // Jika belum ada (jadwal bawaan/dummy), sertakan field wajib agar tidak melanggar constraint NOT NULL
    if (!fallback) {
      return { success: false, error: "Data jadwal tidak ditemukan untuk dihapus." };
    }

    const payload = {
      id,
      judul: fallback.judul,
      ustadz: fallback.ustadz,
      waktu: fallback.waktu,
      hari: fallback.hari,
      lokasi: fallback.lokasi,
      created_by_email: fallback.created_by_email || "",
      created_by_role: fallback.created_by_role || "admin",
      is_deleted: true,
    };

    const { error } = await supabase.from(TABLE_NAME).upsert(payload, { onConflict: "id" });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async update(id: string, kajian: Partial<Omit<KajianTambahan, "id" | "created_at">>): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from(TABLE_NAME).update(kajian).eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }
};
