/**
 * Generate smooth filled circle icon with thick blue border.
 * 
 * - Full original book + pencil icon kept 100% intact (zero cropping)
 * - Pure white background (#FFFFFF) inside the circle
 * - Perfect thick solid blue ring (#00518A, 64px) with smooth anti-aliased circular boundary
 * - No square corners or white artifacts leaking into the blue border
 * - Clean transparent corners outside the outer circle
 */
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function generateIcon() {
  const SIZE = 1024;
  const BORDER = 64; // thick blue border (64px)
  const BLUE = '#00518A'; // original Mulazamahku blue

  const rOuter = SIZE / 2; // 512
  const rInner = rOuter - BORDER; // 448

  // Ensure original source image is available
  const origPath = path.join(__dirname, 'assets', 'images', 'original_raw.png');
  let origBuf;
  if (fs.existsSync(origPath)) {
    origBuf = fs.readFileSync(origPath);
  } else {
    try {
      origBuf = execSync('git show HEAD:./assets/images/splash_icon.png', {
        cwd: __dirname,
        maxBuffer: 20 * 1024 * 1024,
      });
      fs.writeFileSync(origPath, origBuf);
    } catch {
      origBuf = fs.readFileSync(path.join(__dirname, 'assets', 'images', 'splash_icon.png'));
    }
  }

  // 1. Layer 1: Base - clean white circle
  const baseSvg = Buffer.from(`
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${rOuter}" cy="${rOuter}" r="${rOuter}" fill="#FFFFFF"/>
    </svg>
  `);
  const baseBuffer = await sharp(baseSvg).resize(SIZE, SIZE).png().toBuffer();

  // 2. Layer 2: Pristine book icon masked to inner radius (rInner)
  // This guarantees not a single pixel from the original image outside rInner touches the blue border
  const innerMaskSvg = Buffer.from(`
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${rOuter}" cy="${rOuter}" r="${rInner}" fill="#FFFFFF"/>
    </svg>
  `);
  const innerMaskBuf = await sharp(innerMaskSvg).resize(SIZE, SIZE).png().toBuffer();

  const maskedBookBuf = await sharp(origBuf)
    .resize(SIZE, SIZE)
    .composite([{ input: innerMaskBuf, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // 3. Layer 3: Solid blue ring on top (donut from rInner to rOuter)
  const ringSvg = Buffer.from(`
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <path fill="${BLUE}" fill-rule="evenodd" d="
        M ${rOuter} 0
        A ${rOuter} ${rOuter} 0 1 1 ${rOuter} ${SIZE}
        A ${rOuter} ${rOuter} 0 1 1 ${rOuter} 0
        Z
        M ${rOuter} ${BORDER}
        A ${rInner} ${rInner} 0 1 0 ${rOuter} ${SIZE - BORDER}
        A ${rInner} ${rInner} 0 1 0 ${rOuter} ${BORDER}
        Z
      "/>
    </svg>
  `);
  const ringBuf = await sharp(ringSvg).resize(SIZE, SIZE).png().toBuffer();

  // 4. Composite base + maskedBook + ring
  const composited = await sharp(baseBuffer)
    .composite([
      { input: maskedBookBuf, blend: 'over' },
      { input: ringBuf, blend: 'over' }
    ])
    .png()
    .toBuffer();

  // 5. Final outer circle clip (radius 512) for perfect rounded icon with transparent corners
  const outerMaskSvg = Buffer.from(`
    <svg width="${SIZE}" height="${SIZE}" viewBox="0 0 ${SIZE} ${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${rOuter}" cy="${rOuter}" r="${rOuter}" fill="#FFFFFF"/>
    </svg>
  `);
  const outerMaskBuf = await sharp(outerMaskSvg).resize(SIZE, SIZE).png().toBuffer();

  const finalIcon = await sharp(composited)
    .composite([{ input: outerMaskBuf, blend: 'dest-in' }])
    .png()
    .toBuffer();

  // Helper: place the circle centered on a transparent canvas, at `ratio` of canvas size.
  // Android 12+ masks splash & launcher icons, so an edge-to-edge circle gets clipped flat.
  const padded = async (ratio) => {
    const d = Math.round(SIZE * ratio);
    const off = Math.round((SIZE - d) / 2);
    const small = await sharp(finalIcon).resize(d, d).png().toBuffer();
    return sharp({ create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
      .composite([{ input: small, top: off, left: off }])
      .png()
      .toBuffer();
  };

  const outputs = {
    'logo.png': finalIcon,            // in-app logo: full-bleed circle
    'logo_rounded.png': finalIcon,
    'icon.png': finalIcon,   // launcher (legacy) icon: full size
    'adaptive_icon.png': await padded(0.62), // Android adaptive foreground (safe zone 66%)
    'splash_icon.png': await padded(0.72),   // splash (Android 12+ circle mask), slightly enlarged
  };
  for (const [name, buf] of Object.entries(outputs)) {
    fs.writeFileSync(path.join(__dirname, 'assets', 'images', name), buf);
    console.log('Updated:', name);
  }

  console.log('\nAll icons successfully generated!');
}

generateIcon().catch(console.error);
