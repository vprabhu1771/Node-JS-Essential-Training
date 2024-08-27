require('dotenv').config();

const express = require('express');

const path = require('path');

const app = express();

const port = process.env.PORT || 3000;

const host = process.env.HOST || '0.0.0.0';

// Serve static files from the "assets" folder
app.use('/assets', express.static(path.join(__dirname, 'assets')));

// Example API endpoint to get image URLs
app.get('/api/images', (req, res) => {
  
   const images = [
    'image1.jpg',
    'image2.jpg',
    'image3.jpg',
  ];

  const imageUrls = images.map((image) => `http://${host}:${port}/assets/${image}`);

  res.json({ data: imageUrls });  

});

app.listen(port, () => {

    console.log(`Server is running at http://${host}:${port}`);

});
