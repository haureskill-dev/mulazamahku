const light = {
  text: "#1A1F2E",
  tint: "#1A2744",

  background: "#F2F2F5",
  foreground: "#1A1F2E",

  card: "#FFFFFF",
  cardForeground: "#1A1F2E",

  primary: "#1A2744",           // dark navy – tegas & elegan
  primaryForeground: "#FFFFFF",

  secondary: "#2E4170",         // navy medium
  secondaryForeground: "#FFFFFF",

  gold: "#C9A227",              // gold – aksen premium
  goldLight: "#F5E6A3",         // gold terang untuk background chip/badge
  goldForeground: "#3D2800",    // teks di atas gold

  muted: "#EBEBF0",
  mutedForeground: "#8A90A0",

  accent: "#B0BAC8",
  accentForeground: "#1A1F2E",

  destructive: "#B5302A",
  destructiveForeground: "#FFFFFF",

  border: "#DCDDE8",
  input: "#DCDDE8",

  surface: "#F8F8FB",
  highlight: "#EEF1F8",

  // Warna header (area navy bergradasi)
  header: "#1A2744",
  headerAlt: "#24365E",
  // Warna teks/ikon aksen di atas background (bukan di atas header)
  accentText: "#1A2744",
};

const dark: typeof light = {
  text: "#E7EAF2",
  tint: "#8FA8DA",

  background: "#0B1020",
  foreground: "#E7EAF2",

  card: "#141B2E",
  cardForeground: "#E7EAF2",

  primary: "#3D5A96",           // navy cerah agar tetap kontras di malam hari
  primaryForeground: "#FFFFFF",

  secondary: "#2A3B63",
  secondaryForeground: "#FFFFFF",

  gold: "#D9B443",
  goldLight: "#3A3014",
  goldForeground: "#F5E6A3",

  muted: "#1D2539",
  mutedForeground: "#8C95AB",

  accent: "#2A3550",
  accentForeground: "#E7EAF2",

  destructive: "#E0605A",
  destructiveForeground: "#FFFFFF",

  border: "#232C44",
  input: "#232C44",

  surface: "#10172A",
  highlight: "#1A2440",

  header: "#0F1730",
  headerAlt: "#1A2648",
  accentText: "#9DB4E6",
};

const colors = {
  light,
  dark,
  radius: 12,
};

export default colors;
