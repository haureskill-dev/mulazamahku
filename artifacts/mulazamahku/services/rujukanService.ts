import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system";
import { decode } from "base64-arraybuffer";
import { RujukanKitab } from "@/types";

const BUCKET_NAME = "rujukan";
const TABLE_NAME = "rujukan_kitab";

export const RujukanService = {
  /**
   * Upload rujukan kitab (dengan file PDF opsional)
   * Hanya Admin & Pengajar yang bisa menambah
   */
  async addRujukan(
    judulKitab: string,
    penulis: string,
    deskripsi: string,
    kajianId: string | null,
    izinPenggunaan: boolean,
    catatanIzin: string,
    uploaderName: string,
    pdfUri?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      let fileUrl: string | null = pdfUri || null;

      const { error: insertError } = await supabase.from(TABLE_NAME).insert({
        kajian_id: kajianId || null,
        judul_kitab: judulKitab,
        penulis: penulis || null,
        deskripsi: deskripsi || null,
        file_url: fileUrl,
        izin_penggunaan: izinPenggunaan,
        catatan_izin: catatanIzin || null,
        dibuat_oleh: uploaderName,
      });

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Gagal menambahkan" };
    }
  },

  /**
   * Ambil semua rujukan kitab
   */
  async getAllRujukan(): Promise<RujukanKitab[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as RujukanKitab[];
  },

  /**
   * Ambil rujukan berdasarkan kajian ID
   */
  async getRujukanByKajian(kajianId: string): Promise<RujukanKitab[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("kajian_id", kajianId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as RujukanKitab[];
  },

  /**
   * Hapus rujukan
   */
  async deleteRujukan(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  },
};
