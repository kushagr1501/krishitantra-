// const express = require('express');
// const multer = require('multer');
// const Jimp = require('jimp');
// const cors = require('cors');
// const path = require('path');
// const fs = require('fs');

// const app = express();
// app.use(cors());
// const upload = multer({ dest: 'uploads/' });

// const PORT = process.env.PORT || 5000;

// // Reference RGB values for nitrogen levels like the typical ideal values u can say 
// const nitrogenLevels = [
//   { level: 'Very High', color: { r: 174, g: 249, b: 101 } },
//   { level: 'High', color: { r: 133, g: 204, b: 64 } },
//   { level: 'Medium', color: { r: 104, g: 168, b: 42 } },
//   { level: 'Low', color: { r: 64, g: 115, b: 15 } },
//   { level: 'Very Low', color: { r: 33, g: 62, b: 5 } }
// ];

// // White balance correction function
// //what's the use of whiteBAlance??: so white balance will make the whites more whiter ,or in easy it makes the image more reaistic by removing inwanted filters or saturation ,kinda making it natural

// const correctWhiteBalance = async (image) => {

//   let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0;

//   for (let x = 0; x < image.bitmap.width; x++) {
//     for (let y = 0; y < image.bitmap.height; y++) {
//       const { r, g, b } = Jimp.intToRGBA(image.getPixelColor(x, y));
//       totalR += r;
//       totalG += g;
//       totalB += b;
//       pixelCount++;
//     }
//   }

//   const avgR = totalR / pixelCount;
//   const avgG = totalG / pixelCount;
//   const avgB = totalB / pixelCount;

//   const whiteBalance = {
//     r: 255 / avgR,
//     g: 255 / avgG,
//     b: 255 / avgB
//   };

//   image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
//     const oldR = image.bitmap.data[idx + 0];
//     const oldG = image.bitmap.data[idx + 1];
//     const oldB = image.bitmap.data[idx + 2];

//     const newR = Math.min(255, oldR * whiteBalance.r);
//     const newG = Math.min(255, oldG * whiteBalance.g);
//     const newB = Math.min(255, oldB * whiteBalance.b);

//     image.bitmap.data[idx + 0] = newR;
//     image.bitmap.data[idx + 1] = newG;
//     image.bitmap.data[idx + 2] = newB;
//   });

//   return image;
// };



// // Preprocess 
// const preprocessImage = async (imagePath, calibrationColor) => {
//   let image = await Jimp.read(imagePath);
//   image = await correctWhiteBalance(image);

//   image.resize(500, 500).normalize().contrast(0.2);

//   const avgColor = await calculateAverageColor(imagePath);
//   const correctionFactor = {
//     r: calibrationColor.r / avgColor.r,
//     g: calibrationColor.g / avgColor.g,
//     b: calibrationColor.b / avgColor.b,
//   };

//   image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
//     const oldR = image.bitmap.data[idx + 0];
//     const oldG = image.bitmap.data[idx + 1];
//     const oldB = image.bitmap.data[idx + 2];

//     const newR = Math.min(255, oldR * correctionFactor.r);
//     const newG = Math.min(255, oldG * correctionFactor.g);
//     const newB = Math.min(255, oldB * correctionFactor.b);

//     image.bitmap.data[idx + 0] = newR;
//     image.bitmap.data[idx + 1] = newG;
//     image.bitmap.data[idx + 2] = newB;
//   });

//   return image;
// };

// const calculateAverageColor = async (imagePath) => {
//   const image = await preprocessImage(imagePath);
//   let totalR = 0, totalG = 0, totalB = 0, pixelCount = 0;

//   for (let x = 0; x < image.bitmap.width; x++) {
//     for (let y = 0; y < image.bitmap.height; y++) {
//       const { r, g, b } = Jimp.intToRGBA(image.getPixelColor(x, y));
//       totalR += r;
//       totalG += g;
//       totalB += b;
//       pixelCount++;
//     }
//   }

//   return {
//     r: Math.round(totalR / pixelCount),
//     g: Math.round(totalG / pixelCount),
//     b: Math.round(totalB / pixelCount)
//   };
// };




// const calculateColorDistance = (color1, color2) => {
//   return Math.sqrt(
//     Math.pow(color1.r - color2.r, 2) +
//     Math.pow(color1.g - color2.g, 2) +
//     Math.pow(color1.b - color2.b, 2)
//   );
// };

// //  closest nitrogen level based on average RGB
// const findClosestNitrogenLevel = (averageColor) => {
//   let closestLevel = null;
//   let closestDistance = Infinity;

//   nitrogenLevels.forEach(level => {
//     const distance = calculateColorDistance(averageColor, level.color);
//     if (distance < closestDistance) {
//       closestDistance = distance;
//       closestLevel = level.level;
//     }
//   });

//   return closestLevel;
// };

// app.post('/upload', upload.array('leafImages', 6), async (req, res) => {
//   const images = req.files;
//   let totalColor = { r: 0, g: 0, b: 0 };


//   for (const image of images) {
//     const avgColor = await calculateAverageColor(image.path);
//     totalColor.r += avgColor.r;
//     totalColor.g += avgColor.g;
//     totalColor.b += avgColor.b;
//     fs.unlinkSync(image.path); 
//   }

//   const averageColor = {
//     r: totalColor.r / images.length,
//     g: totalColor.g / images.length,
//     b: totalColor.b / images.length
//   };

//   // Assuming  that the calibration image has been processed first to get calibrationColor
//   const calibrationImage = req.files.find(file => file.originalname === 'calibration.jpg');
//   let  calibrationColor= { r: 0, g: 0, b: 0 };

//   if (calibrationImage) {
//     calibrationColor = await calculateAverageColor(calibrationImage.path);
//     fs.unlinkSync(calibrationImage.path); 
//   } else {
//     return res.status(400).json({ error: 'Calibration image is required.' });
//   }

//   const calibratedAverageColor = {
//     r: averageColor.r * (calibrationColor.r / 174),
//     g: averageColor.g * (calibrationColor.g / 249),
//     b: averageColor.b * (calibrationColor.b / 101)
//   };
//   console.log(calibratedAverageColor);

//   // Determining  nitrogen level based on average color
//   const nitrogenLevel = findClosestNitrogenLevel(calibratedAverageColor);
//   res.json({ nitrogenLevel: nitrogenLevel, averageColor: calibratedAverageColor });
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);
// });



//new updated code 

const express = require('express');
const multer = require('multer');
const Jimp = require('jimp');
const convert = require('color-convert');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
const upload = multer({ dest: 'uploads/' });

const PORT = process.env.PORT || 5000;

const nitrogenLevels = [
  { level: 'Very High', labColor: { L: 87, A: -70, B: 80 } },
  { level: 'High', labColor: { L: 78, A: -60, B: 70 } },
  { level: 'Medium', labColor: { L: 69, A: -50, B: 60 } },
  { level: 'Low', labColor: { L: 58, A: -40, B: 50 } },
  { level: 'Very Low', labColor: { L: 47, A: -30, B: 40 } }
];

// consideeing white background 

const backgroundLab = { L: 100, A: 0, B: 0 };

const rgbToLab = (r, g, b) => {
  return convert.rgb.lab(r, g, b);
};

const calculateAverageColorLAB = async (imagePath) => {
  const image = await Jimp.read(imagePath);
  let totalL = 0, totalA = 0, totalB = 0, pixelCount = 0;

  image.scan(0, 0, image.bitmap.width, image.bitmap.height, (x, y, idx) => {
    const r = image.bitmap.data[idx + 0];
    const g = image.bitmap.data[idx + 1];
    const b = image.bitmap.data[idx + 2];
    const [L, A, B] = rgbToLab(r, g, b);

    totalL += L;
    totalA += A;
    totalB += B;
    pixelCount++;
  });

  return {
    L: totalL / pixelCount,
    A: totalA / pixelCount,
    B: totalB / pixelCount
  };
};

const calculateColorDistanceLAB = (color1, color2) => {
  return Math.sqrt(
    Math.pow(color1.L - color2.L, 2) +
    Math.pow(color1.A - color2.A, 2) +
    Math.pow(color1.B - color2.B, 2)
  );
};

const correctBackgroundColor = (labColor) => {
  return {
    L: labColor.L - backgroundLab.L,
    A: labColor.A - backgroundLab.A,
    B: labColor.B - backgroundLab.B
  };
};

const findClosestNitrogenLevelLAB = (averageColor) => {
  let closestLevel = null;
  let closestDistance = Infinity;

  nitrogenLevels.forEach(level => {
    const distance = calculateColorDistanceLAB(averageColor, level.labColor);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestLevel = level.level;
    }
  });

  return closestLevel;
};

app.post('/upload', upload.single('leafImage'), async (req, res) => {
  const leafImage = req.file;

  if (!leafImage) {
    return res.status(400).json({ error: 'Leaf image is required.' });
  }

  try {
    const avgColorLAB = await calculateAverageColorLAB(leafImage.path);
    const correctedColorLAB = correctBackgroundColor(avgColorLAB);

    const beforeCorrectionImage = path.join('uploads', 'before_correction.jpg');
    fs.copyFileSync(leafImage.path, beforeCorrectionImage);

    const afterCorrectionImage = path.join('uploads', 'after_correction.jpg');
    const img = await Jimp.read(leafImage.path);

    
    img.brightness(-0.1) 
       .contrast(0.1)   
       .write(afterCorrectionImage);

    fs.unlinkSync(leafImage.path);

    const averageColorLAB = {
      L: correctedColorLAB.L,
      A: correctedColorLAB.A,
      B: correctedColorLAB.B
    };

    const nitrogenLevel = findClosestNitrogenLevelLAB(averageColorLAB);

    res.json({
      nitrogenLevel: nitrogenLevel,
      averageColor: averageColorLAB,
      beforeCorrectionImage: `http://localhost:5000/${path.basename(beforeCorrectionImage)}`,
      afterCorrectionImage: `http://localhost:5000/${path.basename(afterCorrectionImage)}`
    });
  } catch (error) {
    console.error('Error processing images:', error);
    res.status(500).json({ error: 'An error occurred while processing images.' });
  }
});

app.use(express.static('uploads')); 

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});









