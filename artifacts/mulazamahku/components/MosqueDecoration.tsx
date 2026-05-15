import React from "react";
import Svg, { Path, Rect, Circle, G } from "react-native-svg";

interface Props {
  width?: number;
  goldColor?: string;
  opacity?: number;
}

/**
 * Silhouette masjid bergaya Masjid Imam An-Nawawi Cilegon —
 * kubah utama onion-shape, dua menara tinggi, kubah kecil di sisi.
 */
export function MosqueDecoration({ width = 360, goldColor = "#C9A227", opacity = 1 }: Props) {
  const h = 72;
  const scale = width / 360;

  return (
    <Svg width={width} height={h} viewBox="0 0 360 72" style={{ display: "flex" }}>
      <G opacity={opacity}>
        {/* ── Menara kiri ─────────────────────────────── */}
        {/* Badan menara */}
        <Rect x="38" y="18" width="11" height="48" rx="1" fill={goldColor} />
        {/* Balkon menara kiri */}
        <Rect x="34" y="36" width="19" height="4" rx="1" fill={goldColor} />
        {/* Puncak lancip kiri */}
        <Path d="M38 18 L43.5 4 L49 18 Z" fill={goldColor} />
        {/* Bulan sabit kiri */}
        <Path
          d="M43.5 6 C42 5 40 6 40 8 C40 10 42 11 44 10 C42.5 10.5 41 9 41 8 C41 7 42.5 6.5 43.5 6 Z"
          fill={goldColor}
        />

        {/* ── Menara kanan ────────────────────────────── */}
        <Rect x="311" y="18" width="11" height="48" rx="1" fill={goldColor} />
        <Rect x="307" y="36" width="19" height="4" rx="1" fill={goldColor} />
        <Path d="M311 18 L316.5 4 L322 18 Z" fill={goldColor} />
        <Path
          d="M316.5 6 C315 5 313 6 313 8 C313 10 315 11 317 10 C315.5 10.5 314 9 314 8 C314 7 315.5 6.5 316.5 6 Z"
          fill={goldColor}
        />

        {/* ── Dinding utama ───────────────────────────── */}
        <Rect x="55" y="50" width="250" height="22" rx="2" fill={goldColor} />

        {/* ── Kubah kecil kiri ────────────────────────── */}
        <Path
          d="M 70 50 Q 70 36 82 32 Q 94 36 94 50 Z"
          fill={goldColor}
        />
        {/* Menara kecil kiri */}
        <Rect x="76" y="22" width="6" height="12" rx="1" fill={goldColor} />
        <Path d="M76 22 L79 14 L82 22 Z" fill={goldColor} />

        {/* ── Kubah kecil kanan ───────────────────────── */}
        <Path
          d="M 266 50 Q 266 36 278 32 Q 290 36 290 50 Z"
          fill={goldColor}
        />
        <Rect x="272" y="22" width="6" height="12" rx="1" fill={goldColor} />
        <Path d="M272 22 L275 14 L278 22 Z" fill={goldColor} />

        {/* ── Kubah utama (onion dome) ─────────────────── */}
        <Path
          d="M 138 50
             Q 138 28 155 14
             Q 162 8  167 5
             Q 171 3  174 2
             Q 177 1  180 0.5
             Q 183 1  186 2
             Q 189 3  193 5
             Q 198 8  205 14
             Q 222 28 222 50 Z"
          fill={goldColor}
        />
        {/* Lingkaran dasar kubah */}
        <Path
          d="M 132 50 Q 132 42 138 50 Z"
          fill={goldColor}
        />
        {/* Hiasan puncak kubah (finial) */}
        <Rect x="178" y="0" width="4" height="8" rx="1" fill={goldColor} />
        {/* Bulan sabit di puncak kubah */}
        <Path
          d="M180 -2 C177 -3 174 -1 174 2 C174 5 177 6 180 5 C177.5 5.5 175 4 175 2 C175 0 177.5 -1 180 -2 Z"
          fill={goldColor}
        />

        {/* ── Ornamen jendela (arcade) ─────────────────── */}
        <Path d="M 100 66 Q 100 58 108 56 Q 116 58 116 66 Z" fill="rgba(26,39,68,0.4)" />
        <Path d="M 164 66 Q 164 58 172 56 Q 180 58 180 66 Z" fill="rgba(26,39,68,0.4)" />
        <Path d="M 180 66 Q 180 58 188 56 Q 196 58 196 66 Z" fill="rgba(26,39,68,0.4)" />
        <Path d="M 244 66 Q 244 58 252 56 Q 260 58 260 66 Z" fill="rgba(26,39,68,0.4)" />

        {/* ── Hiasan border bawah (arabesque garis) ───── */}
        <Path
          d="M 0 71 Q 20 66 40 71 Q 60 66 80 71 Q 100 66 120 71
             Q 140 66 160 71 Q 180 66 200 71 Q 220 66 240 71
             Q 260 66 280 71 Q 300 66 320 71 Q 340 66 360 71"
          stroke={goldColor}
          strokeWidth="1.5"
          fill="none"
          opacity="0.6"
        />
      </G>
    </Svg>
  );
}
