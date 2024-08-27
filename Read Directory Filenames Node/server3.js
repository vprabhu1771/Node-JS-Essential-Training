const fs = require('fs');
const path = require('path');

// Specify the directory path
const directoryPath = path.join(__dirname, 'assets');

// Read the directory and list all files
fs.readdir(directoryPath, (err, files) => {
  if (err) {
    return console.error(`Unable to scan directory: ${err}`);
  }

  // Create an array to hold file objects
  const data = files.map(file => ({ name: file }));

  // Create the JSON object with the key 'data'
  const result = { data };

  // Convert the object to a JSON string
  const jsonOutput = JSON.stringify(result, null, 2);

  // Output the JSON string
  console.log(jsonOutput);
});
