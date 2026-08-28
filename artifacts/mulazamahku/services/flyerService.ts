import { supabase } from "./supabase";
import { decode } from "base64-arraybuffer";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Flyer } from "@/types";
import { sendPushToAllUsers } from "./pushTokenService";

const BUCKET_NAME = "flyers";
const TABLE_NAME = "flyers";
const FLYER_CACHE_KEY = "@mulazamahku_flyers_cache";
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB
const LOG_PREFIX = "[FlyerService]";

/**
 * Helper: konversi image URI ke base64 dengan validasi ukuran.
 * Throws jika file terlalu besar.
 */
async function imageUriToBase64(imageUri: string): Promise<{ base64: string; sizeBytes: number }> {
  const response = await fetch(imageUri);
  const blob = await response.blob();

  if (blob.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Ukuran gambar terlalu besar (${(blob.size / 1024 / 1024).toFixed(1)}MB). Maksimal 5MB.`);
  }

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  return { base64, sizeBytes: blob.size };
}

/**
 * Helper: upload base64 ke Supabase Storage dan return public URL.
 */
async function uploadToStorage(base64: string): Promise<{ publicUrl: string; filePath: string }> {
  const fileName = `flyer_${Date.now()}_${Math.random().toString(36).substring(7)}.jpg`;
  const filePath = `uploads/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, decode(base64), {
      contentType: "image/jpeg",
      upsert: false,
    });

  if (uploadError) {
    throw new Error(uploadError.message);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return { publicUrl: urlData.publicUrl, filePath };
}

/**
 * Helper: hapus file lama dari Supabase Storage berdasarkan public URL.
 * Best-effort — tidak throw error.
 */
async function cleanupOldImage(oldImageUrl: string): Promise<void> {
  try {
    // Extract path dari public URL
    // Format: https://<ref>.supabase.co/storage/v1/object/public/flyers/uploads/filename.jpg
    const match = oldImageUrl.match(/\/storage\/v1\/object\/public\/flyers\/(.+)$/);
    if (!match) return;

    const oldPath = match[1];
    const { error } = await supabase.storage.from(BUCKET_NAME).remove([oldPath]);
    if (error) {
      console.warn(LOG_PREFIX, "Gagal hapus gambar lama:", error.message);
    } else {
      console.log(LOG_PREFIX, "Gambar lama berhasil dihapus:", oldPath);
    }
  } catch (e: any) {
    console.warn(LOG_PREFIX, "Error cleanup gambar lama:", e?.message);
  }
}

export const FlyerService = {
  /**
   * Upload flyer (gambar poster) ke Supabase Storage dan simpan metadata.
   * Hanya Admin yang bisa upload flyer.
   * Push notification dikirim dan hasilnya dikembalikan.
   */
  async uploadFlyer(
    imageUri: string,
    kajianId: string,
    keterangan: string,
    tanggalBerlaku: string,
    uploaderName: string
  ): Promise<{ success: boolean; error?: string; pushResult?: { sent: number; errors: number } }> {
    try {
      // Validasi ukuran file
      const { base64 } = await imageUriToBase64(imageUri);

      // Upload ke Storage
      const { publicUrl } = await uploadToStorage(base64);

      // Insert metadata ke database
      const { error: insertError } = await supabase.from(TABLE_NAME).insert({
        kajian_id: kajianId,
        image_url: publicUrl,
        keterangan,
        tanggal_berlaku: tanggalBerlaku || null,
        dibuat_oleh: uploaderName,
      });

      if (insertError) {
        return { success: false, error: insertError.message };
      }

      // Kirim push notification — await, bukan fire-and-forget
      let pushResult = { sent: 0, errors: 0 };
      try {
        const result = await sendPushToAllUsers(
          "📢 Info Kajian Terbaru",
          keterangan
            ? keterangan.substring(0, 120) + (keterangan.length > 120 ? "..." : "")
            : "Ada flyer kajian baru yang diupload.",
          { kajianId, type: "flyer" }
        );
        pushResult = { sent: result.sent, errors: result.errors };
        console.log(LOG_PREFIX, `Push result: ${result.sent} terkirim, ${result.errors} gagal`);
      } catch (e: any) {
        console.warn(LOG_PREFIX, "Push notification gagal:", e?.message);
        pushResult = { sent: 0, errors: -1 }; // -1 = unknown error
      }

      return { success: true, pushResult };
    } catch (e: any) {
      return { success: false, error: e.message || "Upload gagal" };
    }
  },

  /**
   * Ambil semua flyer (dengan offline cache)
   */
  async getAllFlyers(): Promise<Flyer[]> {
    try {
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .order("created_at", { ascending: false });

      if (error || !data) {
        return this._getFromCache();
      }

      await AsyncStorage.setItem(FLYER_CACHE_KEY, JSON.stringify(data));
      return data as Flyer[];
    } catch {
      return this._getFromCache();
    }
  },

  /**
   * Update metadata flyer (dan opsional ganti gambar).
   * Gambar lama di-cleanup dari Storage saat diganti.
   */
  async updateFlyer(
    id: string,
    kajianId: string,
    keterangan: string,
    tanggalBerlaku: string,
    newImageUri?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: any = {
        kajian_id: kajianId,
        keterangan,
        tanggal_berlaku: tanggalBerlaku || null,
      };

      // Jika ada gambar baru, upload dulu dan cleanup gambar lama
      if (newImageUri) {
        // Ambil URL gambar lama untuk cleanup nanti
        const { data: oldRecord } = await supabase
          .from(TABLE_NAME)
          .select("image_url")
          .eq("id", id)
          .single();

        // Validasi dan upload gambar baru
        const { base64 } = await imageUriToBase64(newImageUri);
        const { publicUrl } = await uploadToStorage(base64);
        updateData.image_url = publicUrl;

        // Cleanup gambar lama (best-effort, tidak blocking)
        if (oldRecord?.image_url) {
          cleanupOldImage(oldRecord.image_url);
        }
      }

      const { error } = await supabase
        .from(TABLE_NAME)
        .update(updateData)
        .eq("id", id);

      if (error) return { success: false, error: error.message };
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Update gagal" };
    }
  },

  async _getFromCache(): Promise<Flyer[]> {
    try {
      const cached = await AsyncStorage.getItem(FLYER_CACHE_KEY);
      if (cached) return JSON.parse(cached) as Flyer[];
    } catch {}
    return [];
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
   * Hapus flyer (termasuk cleanup gambar dari Storage)
   */
  async deleteFlyer(id: string): Promise<{ success: boolean; error?: string }> {
    try {
      // Ambil image_url sebelum hapus record
      const { data: record } = await supabase
        .from(TABLE_NAME)
        .select("image_url")
        .eq("id", id)
        .single();

      const { error } = await supabase.from(TABLE_NAME).delete().eq("id", id);
      if (error) return { success: false, error: error.message };

      // Cleanup gambar dari Storage (best-effort)
      if (record?.image_url) {
        cleanupOldImage(record.image_url);
      }

      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || "Hapus gagal" };
    }
  },
};

