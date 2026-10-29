import colors from "@/constants/colors";
import { useThemeState } from "@/services/themeStore";

/**
 * Returns the design tokens for the current color scheme.
 *
 * The returned object contains all color tokens for the active palette
 * plus scheme-independent values like `radius`.
 *
 * Skema ditentukan oleh themeStore: otomatis terang di siang hari
 * (06:00–17:59) dan gelap di malam hari, kecuali user memilih manual.
 */
export function useColors() {
  const { scheme } = useThemeState();
  const palette = scheme === "dark" ? colors.dark : colors.light;
  return { ...palette, isDark: scheme === "dark", radius: colors.radius };
}
