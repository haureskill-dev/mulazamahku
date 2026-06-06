import { supabase } from "./supabase";

export const ProgressService = {
  async get(kajian_id: string): Promise<string> {
    const { data, error } = await supabase
      .from("kajian_progress")
      .select("progress")
      .eq("kajian_id", kajian_id)
      .single();
    
    if (error || !data) return "";
    return data.progress;
  },

  async set(kajian_id: string, progress: string): Promise<boolean> {
    const { error } = await supabase
      .from("kajian_progress")
      .upsert({ kajian_id, progress, updated_at: new Date().toISOString() }, { onConflict: 'kajian_id' });
    
    if (error) {
      console.error("Error saving progress:", error.message);
      return false;
    }
    return true;
  }
};
