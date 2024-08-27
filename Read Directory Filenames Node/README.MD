1. open `server1.js`

```
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
```

```
node server.js
```

```
1.txt
2.txt
3.txt
```

2. open `server2.js`

```
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
```

```
node server.js
```

```json
[
  {
    "name": "1.txt"
  },
  {
    "name": "2.txt"
  },
  {
    "name": "3.txt"
  }
]
```


```
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
```

```
node server.js
```

```json
{
  "data": [
    {
      "name": "1.txt"
    },
    {
      "name": "2.txt"
    },
    {
      "name": "3.txt"
    }
  ]
}
```