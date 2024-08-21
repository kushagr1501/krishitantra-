import React, { useState } from 'react';

const App = () => {
  const [calibrationImage, setCalibrationImage] = useState(null);
  const [leafImages, setLeafImages] = useState([]);
  const [result, setResult] = useState('');

  const handleCalibrationImageChange = (e) => {
    setCalibrationImage(e.target.files[0]);
  };

  const handleLeafImagesChange = (e) => {
    setLeafImages(Array.from(e.target.files));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!calibrationImage) {
      alert('Please upload a calibration image.');
      return;
    }
    if (leafImages.length === 0) {
      alert('Please upload at least one leaf image.');
      return;
    }

    const formData = new FormData();
    formData.append('calibrationImage', calibrationImage, 'calibration.jpg');
    leafImages.forEach((file) => formData.append('leafImages', file));

    try {
      const response = await fetch('http://localhost:5000/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResult(`Nitrogen Level: ${data.nitrogenLevel}\nAverage Color: RGB(${data.averageColor.r}, ${data.averageColor.g}, ${data.averageColor.b})`);
    } catch (error) {
      console.error('Error:', error);
      setResult('An error occurred. Please try again.');
    }
  };

  return (
    <div>
      <h1>Nitrogen Level Detection</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="calibrationImage">Upload Calibration Image:</label>
          <input
            type="file"
            id="calibrationImage"
            name="calibrationImage"
            accept="image/*"
            onChange={handleCalibrationImageChange}
            required
          />
        </div>
        <div>
          <label htmlFor="leafImages">Upload Leaf Images (up to 6):</label>
          <input
            type="file"
            id="leafImages"
            name="leafImages"
            accept="image/*"
            multiple
            onChange={handleLeafImagesChange}
            required
          />
        </div>
        <button type="submit">Submit</button>
      </form>
      <h2>Result:</h2>
      <div id="result">{result}</div>
    </div>
  );
};

export default App;
