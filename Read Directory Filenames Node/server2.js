const fs = require('fs');
const path = require('path');

// Specify the directory path
const directoryPath = path.join(__dirname, 'assets');

// Read the directory and list all files
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.error(`Unable to scan directory: ${err}`);
  }

  // Create an array to hold file names
  const fileNames = files.map(file => ({ name: file }));

  // Convert the array to JSON string
  const jsonOutput = JSON.stringify(fileNames, null, 2);

  // Output the JSON string
  console.log(jsonOutput);
});
