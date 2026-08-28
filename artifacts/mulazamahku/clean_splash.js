const Jimp = require('jimp');
const path = require('path');

async function cleanIcon() {
  const inputPath = path.resolve(__dirname, 'assets/images/icon.png');
  const outputPath = path.resolve(__dirname, 'assets/images/splash_icon.png');
  
  console.log('Loading image:', inputPath);
  const image = await Jimp.read(inputPath);
  const w = image.bitmap.width;
  const h = image.bitmap.height;
  console.log(`Image size: ${w}x${h}`);
  
  const cx = w / 2;
  const cy = h / 2;
  
  // Scan all pixels and classify them
  image.scan(0, 0, w, h, function(x, y, idx) {
    const r = this.bitmap.data[idx + 0];
    const g = this.bitmap.data[idx + 1];
    const b = this.bitmap.data[idx + 2];
    
    const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
    
    // Detect blue pixels (the circle border and logo)
    // Blue color is around #1B5B8D (r:27, g:91, b:141)
    const isBlue = (b > 80) && (b > r * 1.3) && (r < 120) && (g < 150);
    
    // Detect gray/shadow pixels (not white, not blue)
    const avg = (r + g + b) / 3;
    const isGray = (avg > 130 && avg < 250) && 
                   (Math.abs(r - g) < 25 && Math.abs(g - b) < 25) &&
                   !isBlue;
    
    // Pure white check
    const isWhite = (r > 245 && g > 245 && b > 245);
    
    // If it's gray (shadow), replace with white
    if (isGray && !isBlue) {
      this.bitmap.data[idx + 0] = 255;
      this.bitmap.data[idx + 1] = 255;
      this.bitmap.data[idx + 2] = 255;
      this.bitmap.data[idx + 3] = 255;
    }
    
    // If outside circle completely, force white
    if (dist > w * 0.50) {
      this.bitmap.data[idx + 0] = 255;
      this.bitmap.data[idx + 1] = 255;
      this.bitmap.data[idx + 2] = 255;
      this.bitmap.data[idx + 3] = 255;
    }
  });
  
  await image.writeAsync(outputPath);
  console.log('Cleaned splash icon saved to:', outputPath);
}

cleanIcon().catch(console.error);
