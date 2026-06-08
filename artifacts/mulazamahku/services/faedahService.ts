import { supabase } from "./supabase";
import { decode } from "base64-arraybuffer";
export interface FaedahItem {
  id: string;
  image_url: string;
  uploader_name: string;
  uploader_email: string;
  uploader_role: string;
  status: "menunggu" | "disetujui" | "ditolak";
  catatan?: string;
  created_at: string;
}

const BUCKET_NAME = "faedah";
const TABLE_NAME = "faedah";

export const FaedahService = {
  /**
   * Upload gambar ke Supabase Storage dan simpan metadata ke tabel faedah
   */
  async uploadFaedah(
    imageUri: string,
    uploaderName: string,
    uploaderEmail: string,
    uploaderRole: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // 1. Ambil data gambar menggunakan fetch bawaan React Native
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Convert Blob to Base64 using FileReader
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Hasilnya berupa data:image/jpeg;base64,.... kita ambil base64-nya saja
          resolve(result.split(',')[1]);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      // 2. Buat nama file unik
      const fileName = `faedah_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `uploads/${fileName}`;

      // 3. Upload ke Supabase Storage menggunakan decode
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, decode(base64), {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (uploadError) {
        return { success: false, error: uploadError.message };
      }

      // 4. Dapatkan URL publik
      const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

      // 5. Simpan metadata ke tabel faedah
      const { error: insertError } = await supabase.from(TABLE_NAME).insert({
        image_url: urlData.publicUrl,
        uploader_name: uploaderName,
        uploader_email: uploaderEmail,
        uploader_role: uploaderRole,
        status: "menunggu",
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
   * Update gambar faedah yang sudah ada
   */
  async updateFaedahImage(
    id: string,
    imageUri: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const fileName = `faedah_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
      const filePath = `uploads/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, decode(base64), { contentType: "image/jpeg", upsert: false });

      if (uploadError) return { success: false, error: uploadError.message };

      const { data: urlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);

      const { error: updateError } = await supabase.from(TABLE_NAME).update({
        image_url: urlData.publicUrl,
        status: "menunggu",
        // catatan: null, // Dihapus agar feedback sebelumnya tetap tersimpan sebagai arsip
      }).eq("id", id);

      if (updateError) return { success: false, error: updateError.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Gagal mengupdate gambar" };
    }
  },

  /**
   * Ambil semua faedah (untuk semua peran)
   */
  async getAllFaedah(): Promise<FaedahItem[]> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data as FaedahItem[];
  },

  /**
   * Update status faedah (hanya untuk pengajar)
   */
  async updateStatus(
    id: string,
    status: "disetujui" | "ditolak",
    catatan?: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ status, catatan })
      .eq("id", id);

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  /**
   * Hapus faedah
   */
  async deleteFaedah(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Dapatkan data faedah untuk mengambil nama file
      const { data: faedah } = await supabase
        .from(TABLE_NAME)
        .select("image_url")
        .eq("id", id)
        .single();
        
      if (faedah && faedah.image_url) {
        const urlParts = faedah.image_url.split("/");
        const fileName = urlParts[urlParts.length - 1];
        if (fileName) {
          await supabase.storage.from(BUCKET_NAME).remove([`uploads/${fileName}`]);
        }
      }

      const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  },
};
