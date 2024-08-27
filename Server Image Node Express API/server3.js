require('dotenv').config();

const express = require('express');

const path = require('path');

const fs = require('fs');

const app = express();

const port = process.env.PORT || 3000;

const host = process.env.HOST || '0.0.0.0';

const assetsDir = path.join(__dirname, 'assets');

// Serve static files from the "assets" folder
app.use('/assets', express.static(assetsDir));

// Function to get image files from the directory
const getImageFiles = (dir) => {

  const files = fs.readdirSync(dir);

  return files.filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ['.jpg', '.jpeg', '.png', '.gif'].includes(ext);
  });
  
};

// Example API endpoint to get image URLs
app.get('/api/images', (req, res) => {

  const imageFiles = getImageFiles(assetsDir);

  const imageUrls = imageFiles.map((file) => ({
    image: `http://${host}:${port}/assets/${file}`
  }));

  res.json({ data: imageUrls });

});

app.listen(port, () => {
  console.log(`Server is running at http://${host}:${port}`);
});
