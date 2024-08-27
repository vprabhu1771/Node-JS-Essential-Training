const fs = require('fs');
const path = require('path');

// Specify the directory path
const directoryPath = path.join(__dirname, 'assets');

// Read the directory and list all files
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.error(`Unable to scan directory: ${err}`);
  }

  // Log all file names
  files.forEach(file => {
    console.log(file);
  });
});
