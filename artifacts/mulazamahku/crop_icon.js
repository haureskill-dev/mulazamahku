const Jimp = require('jimp');

async function main() {
  try {
    const image = await Jimp.read('./assets/images/logo.png');
    const size = Math.min(image.bitmap.width, image.bitmap.height);
    
    // Resize slightly to crop out any outer artifacts
    const cropMargin = Math.floor(size * 0.02); // 2% margin inward
    const newSize = size - (cropMargin * 2);

    image.crop(
      (image.bitmap.width - size) / 2 + cropMargin,
      (image.bitmap.height - size) / 2 + cropMargin,
      newSize,
      newSize
    );
    
    image.circle(); // Make it circular transparent
    
    await image.writeAsync('./assets/images/logo_rounded.png');
    console.log("Success! Saved as logo_rounded.png");
  } catch(e) {
    console.error(e);
  }
}

main();
