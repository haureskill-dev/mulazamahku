import { supabase } from "./supabase";
import { sendPushToAllUsers } from "./pushTokenService";

export interface KajianBatal {
  id: string;
  kajian_id: string;
  tanggal: string; // YYYY-MM-DD
  alasan: string;
  dibuat_oleh?: string;
  created_at: string;
}

export const KajianBatalService = {
  async getAll(): Promise<KajianBatal[]> {
    const { data, error } = await supabase
      .from("kajian_batal")
      .select("*")
      .order("tanggal", { ascending: false });

    if (error) {
      console.error("Error fetching kajian batal:", error.message);
      return [];
    }
    return data || [];
  },

  async insert(data: Omit<KajianBatal, "id" | "created_at">): Promise<boolean> {
    const { error } = await supabase.from("kajian_batal").insert([data]);
    if (error) {
      console.error("Error inserting kajian batal:", error.message);
      return false;
    }

    // Kirim push notification ke semua user
    sendPushToAllUsers(
      "⚠️ Kajian Dibatalkan",
      `Kajian tanggal ${data.tanggal} dibatalkan. Alasan: ${data.alasan}`,
      { kajianId: data.kajian_id, type: "batal" }
    ).catch(e => console.warn("[KajianBatal] Gagal kirim push:", e));

    return true;
  },

  async delete(id: string): Promise<boolean> {
    const { error } = await supabase.from("kajian_batal").delete().eq("id", id);
    if (error) {
      console.error("Error deleting kajian batal:", error.message);
      return false;
    }
    return true;
  },
};
