# Commands
```
mkdir node_hello

cd node_hello

npm init --y
```

```
npm i express
```

```
npm i nodemon
```

```
npm i dotenv
```

# `.env`
```env
HOST=192.168.1.122
PORT=3000
```

# 3 - `category.json`
```json
[
  {
    "id": 1,
    "name": "Electronics"
  },
  {
    "id": 2,
    "name": "Books"
  },
  {
    "id": 3,
    "name": "Clothing"
  }
]
```

# 4 - `server.js`
```js
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
    res.setHeader('Content-Type', 'application/json');
    res.send(data);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running at http://${host}:${port}`);
});
```

# 5 - postman
```
GET -> http://localhost:3000/api/categories


Response

[
  {
    "id": 1,
    "name": "Electronics"
  },
  {
    "id": 2,
    "name": "Books"
  },
  {
    "id": 3,
    "name": "Clothing"
  }
]
```
