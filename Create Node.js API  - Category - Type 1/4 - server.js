const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Route to serve the category.json file
app.get('/api/categories', (req, res) => {
  const filePath = path.join(__dirname, 'category.json');
  fs.readFile(filePath, 'utf8', (err, data) => {
    if (err) {
      res.status(500).json({ error: 'Unable to read category.json file' });
      return;
    }
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
