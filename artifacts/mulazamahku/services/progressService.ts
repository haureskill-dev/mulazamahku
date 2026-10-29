import { supabase } from "./supabase";

export interface ProgressData {
  progress: string;
  updated_at: string | null;
  /** Tanggal kajian berikutnya yang dipilih manual oleh pengajar/admin (YYYY-MM-DD) */
  tanggal_kajian: string | null;
}

// Jika kolom tanggal_kajian belum dimigrasi, service tetap jalan (fallback)
let hasTanggalColumn = true;

function isMissingColumn(msg?: string) {
  return !!msg && /tanggal_kajian/i.test(msg);
}

export const ProgressService = {
  async get(kajian_id: string): Promise<ProgressData> {
    if (hasTanggalColumn) {
      const { data, error } = await supabase
        .from("kajian_progress")
        .select("progress, updated_at, tanggal_kajian")
        .eq("kajian_id", kajian_id)
        .maybeSingle();
      if (!error) {
        if (!data) return { progress: "", updated_at: null, tanggal_kajian: null };
        return {
          progress: data.progress ?? "",
          updated_at: data.updated_at ?? null,
          tanggal_kajian: (data as any).tanggal_kajian ?? null,
        };
      }
      if (isMissingColumn(error.message)) {
        hasTanggalColumn = false;
      } else {
        return { progress: "", updated_at: null, tanggal_kajian: null };
      }
    }

    const { data, error } = await supabase
      .from("kajian_progress")
      .select("progress, updated_at")
      .eq("kajian_id", kajian_id)
      .maybeSingle();
    if (error || !data) return { progress: "", updated_at: null, tanggal_kajian: null };
    return { progress: data.progress ?? "", updated_at: data.updated_at ?? null, tanggal_kajian: null };
  },

  async set(kajian_id: string, progress: string, tanggal_kajian: string | null): Promise<boolean> {
    const base = { kajian_id, progress, updated_at: new Date().toISOString() };
    if (hasTanggalColumn) {
      const { error } = await supabase
        .from("kajian_progress")
        .upsert({ ...base, tanggal_kajian }, { onConflict: "kajian_id" });
      if (!error) return true;
      if (isMissingColumn(error.message)) {
        hasTanggalColumn = false;
        console.warn("[Progress] Kolom tanggal_kajian belum ada — jalankan progress_tanggal_migration.sql");
      } else {
        console.error("Error saving progress:", error.message);
        return false;
      }
    }
    const { error } = await supabase.from("kajian_progress").upsert(base, { onConflict: "kajian_id" });
    if (error) {
      console.error("Error saving progress:", error.message);
      return false;
    }
    return true;
  },

  /** Apakah kolom tanggal_kajian sudah tersedia di database */
  supportsTanggal() {
    return hasTanggalColumn;
  },
};
