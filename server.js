const express = require('express');
const multer = require('multer');
const Jimp = require('jimp');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
const upload = multer({ dest: 'uploads/' });

const PORT = process.env.PORT || 5000;

// Reference RGB values for nitrogen levels like the typical ideal values u can say 
const nitrogenLevels = [
  { level: 'Very High', color: { r: 174, g: 249, b: 101 } },
  { level: 'High', color: { r: 133, g: 204, b: 64 } },
  { level: 'Medium', color: { r: 104, g: 168, b: 42 } },
  { level: 'Low', color: { r: 64, g: 115, b: 15 } },
  { level: 'Very Low', color: { r: 33, g: 62, b: 5 } }
];

// White balance correction function
//what's the use of whiteBAlance??: so white balance will make the whites more whiter ,or in easy it makes the image more reaistic by removing inwanted filters or saturation ,kinda making it natural

const correctWhiteBalance = async (image) => {

  let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0;

  for (let x = 0; x < image.bitmap.width; x++) {
    for (let y = 0; y < image.bitmap.height; y++) {
      const { r, g, b } = Jimp.intToRGBA(image.getPixelColor(x, y));
      totalR += r;
      totalG += g;
      totalB += b;
      pixelCount++;
    }
  }

  const avgR = totalR / pixelCount;
  const avgG = totalG / pixelCount;
  const avgB = totalB / pixelCount;

  const whiteBalance = {
    r: 255 / avgR,
    g: 255 / avgG,
    b: 255 / avgB
  };

  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    const oldR = image.bitmap.data[idx + 0];
    const oldG = image.bitmap.data[idx + 1];
    const oldB = image.bitmap.data[idx + 2];

    const newR = Math.min(255, oldR * whiteBalance.r);
    const newG = Math.min(255, oldG * whiteBalance.g);
    const newB = Math.min(255, oldB * whiteBalance.b);

    image.bitmap.data[idx + 0] = newR;
    image.bitmap.data[idx + 1] = newG;
    image.bitmap.data[idx + 2] = newB;
  });

  return image;
};



// Preprocess 
const preprocessImage = async (imagePath, calibrationColor) => {
  let image = await Jimp.read(imagePath);
  image = await correctWhiteBalance(image);

  image.resize(500, 500).normalize().contrast(0.2);

  const avgColor = await calculateAverageColor(imagePath);
  const correctionFactor = {
    r: calibrationColor.r / avgColor.r,
    g: calibrationColor.g / avgColor.g,
    b: calibrationColor.b / avgColor.b,
  };

  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    const oldR = image.bitmap.data[idx + 0];
    const oldG = image.bitmap.data[idx + 1];
    const oldB = image.bitmap.data[idx + 2];

    const newR = Math.min(255, oldR * correctionFactor.r);
    const newG = Math.min(255, oldG * correctionFactor.g);
    const newB = Math.min(255, oldB * correctionFactor.b);

    image.bitmap.data[idx + 0] = newR;
    image.bitmap.data[idx + 1] = newG;
    image.bitmap.data[idx + 2] = newB;
  });

  return image;
};

const calculateAverageColor = async (imagePath) => {
  const image = await preprocessImage(imagePath);
  let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0;

  for (let x = 0; x < image.bitmap.width; x++) {
    for (let y = 0; y < image.bitmap.height; y++) {
      const { r, g, b } = Jimp.intToRGBA(image.getPixelColor(x, y));
      totalR += r;
      totalG += g;
      totalB += b;
      pixelCount++;
    }
  }

  return {
    r: Math.round(totalR / pixelCount),
    g: Math.round(totalG / pixelCount),
    b: Math.round(totalB / pixelCount)
  };
};



//  distance between two colors
const calculateColorDistance = (color1, color2) => {
  return Math.sqrt(
    Math.pow(color1.r - color2.r, 2) +
    Math.pow(color1.g - color2.g, 2) +
    Math.pow(color1.b - color2.b, 2)
  );
};

//  closest nitrogen level based on average RGB
const findClosestNitrogenLevel = (averageColor) => {
  let closestLevel = null;
  let closestDistance = Infinity;

  nitrogenLevels.forEach(level => {
    const distance = calculateColorDistance(averageColor, level.color);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestLevel = level.level;
    }
  });

  return closestLevel;
};

app.post('/upload', upload.array('leafImages', 6), async (req, res) => {
  const images = req.files;
  let totalColor = { r: 0, g: 0, b: 0 };

  // Process each image and accumulate color values
  for (const image of images) {
    const avgColor = await calculateAverageColor(image.path);
    totalColor.r += avgColor.r;
    totalColor.g += avgColor.g;
    totalColor.b += avgColor.b;
    fs.unlinkSync(image.path); 
  }

  const averageColor = {
    r: totalColor.r / images.length,
    g: totalColor.g / images.length,
    b: totalColor.b / images.length
  };

  // Assuming  that the calibration image has been processed first to get calibrationColor
  const calibrationImage = req.files.find(file => file.originalname === 'calibration.jpg');
  let  calibrationColor= { r: 0, g: 0, b: 0 };

  if (calibrationImage) {
    calibrationColor = await calculateAverageColor(calibrationImage.path);
    fs.unlinkSync(calibrationImage.path); 
  } else {
    return res.status(400).json({ error: 'Calibration image is required.' });
  }

  const calibratedAverageColor = {
    r: averageColor.r * (calibrationColor.r / 174),
    g: averageColor.g * (calibrationColor.g / 249),
    b: averageColor.b * (calibrationColor.b / 101)
  };
  console.log(calibratedAverageColor);

  // Determining  nitrogen level based on average color
  const nitrogenLevel = findClosestNitrogenLevel(calibratedAverageColor);
  res.json({ nitrogenLevel: nitrogenLevel, averageColor: calibratedAverageColor });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
