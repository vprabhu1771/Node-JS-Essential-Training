```
https://www.npmjs.com/package/mysql2
```

```
https://sidorares.github.io/node-mysql2/docs/examples
```

Create a `.env` file in the root of your Node.js project:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=root
DB_NAME=small_shop

# Server Configuration
PORT=3000

# Environment
NODE_ENV=development
```

In `config/database.js`, export both the pool and `testConnection()` function.

### config/database.js

```js
const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined
    ? process.env.DB_PASSWORD
    : 'root',
  database: process.env.DB_NAME || 'small_shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✓ Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('✗ Database connection failed:', error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
```

### server.js

```js
require('dotenv').config();

const express = require('express');
const { testConnection } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 3000;

async function startServer() {
  const connected = await testConnection();

  if (!connected) {
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
```

Or simply:

```js
const { testConnection } = require('./config/database');

testConnection();
```

Expected output:

```bash
✓ Database connected successfully
Server running on port 3000
```

If you are using Express + MySQL + Flutter sync API, a common folder structure is:

```text
project/
│
├── config/
│   └── database.js
├── controllers/
├── routes/
├── middleware/
├── models/
├── server.js
└── .env
```

This keeps the database connection reusable across all routes and controllers.
