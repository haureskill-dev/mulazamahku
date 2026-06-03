import { supabase } from "./supabase";

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
  created_by_email: string;
  created_by_role: string;
  created_at: string;
}

const TABLE_NAME = "kajian_tambahan";

export const KajianTambahanService = {
  async getAll(): Promise<KajianTambahan[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as KajianTambahan[];
  },

  async create(kajian: Omit<KajianTambahan, "id" | "created_at">): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from(TABLE_NAME).insert(kajian);
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async delete(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async update(id: string, kajian: Partial<Omit<KajianTambahan, "id" | "created_at">>): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from(TABLE_NAME).update(kajian).eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  }
};
