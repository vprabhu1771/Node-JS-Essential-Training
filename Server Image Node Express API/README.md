1. open `server1.js`

```
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

  const imageUrls = images.map((row) => `http://${host}:${port}/assets/${row}`);

  res.json({ data: imageUrls });  

});

app.listen(port, () => {

    console.log(`Server is running at http://${host}:${port}`);

});
```

```
node server1.js
```

```json
{
  "data": [
    "http://192.168.1.122:3000/assets/image1.jpg",
    "http://192.168.1.122:3000/assets/image2.jpg",
    "http://192.168.1.122:3000/assets/image3.jpg"
  ]
}
```


2. open `server2.js`

```
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

  // Map to create an array of objects with image URLs
  const imageUrls = images.map((image) => ({
    image: `http://${host}:${port}/assets/${image}`
  }));

  res.json({ data: imageUrls });  

});

app.listen(port, () => {

    console.log(`Server is running at http://${host}:${port}`);

});
```

```
node server2.js
```

```json
{
  "data": [
    {
      "image": "http://192.168.1.122:3000/assets/image1.jpg"
    },
    {
      "image": "http://192.168.1.122:3000/assets/image2.jpg"
    },
    {
      "image": "http://192.168.1.122:3000/assets/image3.jpg"
    }
  ]
}
```


3. open `server3.js`

```
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
```

```
node server3.js
```

```json
{
  "data": [
    {
      "image": "http://192.168.1.122:3000/assets/image1.jpg"
    }
  ]
}
```