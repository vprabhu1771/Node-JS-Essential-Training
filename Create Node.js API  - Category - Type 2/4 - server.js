const express = require('express');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const port = 3000;
const host = process.env.HOST || '0.0.0.0';

// Route to serve the category.json file
app.get('/api/categories', (req, res) => {

  const filePath = path.join(__dirname, 'category.json');

  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Unable to read category.json file' });
      return;
    }

    // Parse the JSON data and wrap it in a data object
    const categories = JSON.parse(data);

    res.json({ data: categories });

  });
  
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://${host}:${port}`);
});
