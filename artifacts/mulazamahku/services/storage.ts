import AsyncStorage from "@react-native-async-storage/async-storage";

const NOTES_KEY = "@mulazamahku_notes";
const MUDZAKARAH_KEY = "@mulazamahku_mudzakarah";
const USER_KEY = "@mulazamahku_user";

export const StorageService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      // silent
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      // silent
    }
  },

  NOTES_KEY,
  MUDZAKARAH_KEY,
  USER_KEY,
};
