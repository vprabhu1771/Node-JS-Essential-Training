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

`config\database.js`

```
const mysql = require('mysql2/promise');
require('dotenv').config();

// Create connection pool
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : 'root',
  database: process.env.DB_NAME || 'small_shop',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Test database connection
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
```
