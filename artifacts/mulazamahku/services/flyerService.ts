import { supabase } from "./supabase";
import { decode } from "base64-arraybuffer";
import { Flyer } from "@/types";

const BUCKET_NAME = "flyers";
const TABLE_NAME = "flyers";

export const FlyerService = {
  /**
   * Upload flyer (gambar poster) ke Supabase Storage dan simpan metadata
   * Hanya Admin yang bisa upload flyer
   */
  async uploadFlyer(
    imageUri: string,
    kajianId: string,
    keterangan: string,
    tanggalBerlaku: string,
    uploaderName: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Cross-platform: gunakan fetch + FileReader (works on web & native)
      const response = await fetch(imageUri);
      const blob = await response.blob();

      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const fileName = `flyer_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, decode(base64), {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from(TABLE_NAME).insert({
        kajian_id: kajianId,
        image_url: urlData.publicUrl,
        keterangan,
        tanggal_berlaku: tanggalBerlaku || null,
        dibuat_oleh: uploaderName,
      });

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Upload gagal" };
    }
  },

  /**
   * Ambil semua flyer
   */
  async getAllFlyers(): Promise<Flyer[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Flyer[];
  },

  /**
   * Ambil flyer berdasarkan kajian ID
   */
  async getFlyersByKajian(kajianId: string): Promise<Flyer[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("kajian_id", kajianId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as Flyer[];
  },

  /**
   * Hapus flyer
   */
  async deleteFlyer(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
    if (error) return { success: false, error: error.message };
    return { success: true };
  },
};
