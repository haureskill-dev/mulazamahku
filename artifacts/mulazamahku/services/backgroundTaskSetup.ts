/**
 * ══════════════════════════════════════════════════════════════════════════
 * BACKGROUND TASK SETUP — HARUS DI-IMPORT DI TOP-LEVEL ENTRY POINT
 *
 * File ini mendefinisikan background task menggunakan TaskManager.defineTask().
 * Menurut dokumentasi Expo, defineTask() WAJIB dipanggil di luar React
 * component tree, sebelum AppRegistry.registerComponent().
 *
 * Import file ini di _layout.tsx sebagai side-effect:
 *   import "@/services/backgroundTaskSetup";
 *
 * JANGAN pindahkan defineTask() ke dalam komponen React atau useEffect!
 * ══════════════════════════════════════════════════════════════════════════
 */

import { Platform } from "react-native";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";

export const BACKGROUND_TASK_NAME = "KAJIAN_NOTIFICATION_SCHEDULER";
const LOG_PREFIX = "[BgTaskSetup]";

if (Platform.OS !== "web") {
  TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
    try {
      console.log(LOG_PREFIX, "Background task mulai berjalan...");

      // Lazy-import scheduleAllKajianReminders agar tidak circular dependency
      const { scheduleAllKajianReminders } = require("./notificationService");
      await scheduleAllKajianReminders();

      console.log(LOG_PREFIX, "Background task selesai — notifikasi dijadwalkan ulang.");
      return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (e) {
      console.error(LOG_PREFIX, "Background task error:", e);
      return BackgroundFetch.BackgroundFetchResult.Failed;
    }
  });

  console.log(LOG_PREFIX, "Background task berhasil didefinisikan.");
}
