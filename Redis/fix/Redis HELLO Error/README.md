The error is still happening because you're using **redis@4.x** which tries to use the `HELLO` command (Redis 6+ feature) with your **Redis 5 or below** server. Let's fix this permanently.

## Solution: Switch to redis@3.1.2 (Works with all Redis versions)

### Step 1: Uninstall Current Redis Package
```bash
npm uninstall redis
```

### Step 2: Install Compatible Version
```bash
npm install redis@3.1.2 --save
```

### Step 3: Update config/redis.js for redis@3.1.2

**config/redis.js**
```javascript
const redis = require('redis');

// Create Redis client for v3.x (compatible with Redis 5 and below)
const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379,
  // No password (since your Redis has no password)
  retry_strategy: function(options) {
    if (options.error && options.error.code === 'ECONNREFUSED') {
      console.warn('⚠️ Redis connection refused. Retrying...');
      return Math.min(options.attempt * 100, 3000);
    }
    
    if (options.total_retry_time > 1000 * 60 * 5) {
      console.warn('⚠️ Redis retry time exhausted');
      return undefined;
    }
    
    return Math.min(options.attempt * 100, 3000);
  }
});

// Event handlers
redisClient.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisClient.on('ready', () => {
  console.log('✅ Redis is ready');
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message);
});

redisClient.on('end', () => {
  console.log('⚠️ Redis connection ended');
});

// Promisify methods for async/await
const { promisify } = require('util');
const getAsync = promisify(redisClient.get).bind(redisClient);
const setexAsync = promisify(redisClient.setex).bind(redisClient);
const delAsync = promisify(redisClient.del).bind(redisClient);

// Check if Redis is connected
const isReady = () => redisClient.connected;

module.exports = {
  client: redisClient,
  get: getAsync,
  setEx: setexAsync,
  del: delAsync,
  isReady
};
```

### Step 4: Update server.js (Small Changes)

**server.js** (Updated to work with redis@3.1.2)
```javascript
const express = require('express');
const sequelize = require('./config/database');
const Category = require('./models/Category');
const redis = require('./config/redis'); // Changed from redisClient to redis

const app = express();
app.use(express.json());

// Cache middleware
const cacheMiddleware = (keyPrefix) => {
  return async (req, res, next) => {
    try {
      const cacheKey = `${keyPrefix}:${req.params.id || 'all'}`;
      
      // Check if Redis is ready before using it
      if (redis.isReady()) {
        // Check if data exists in Redis
        const cachedData = await redis.get(cacheKey);
        
        if (cachedData) {
          console.log('✅ Cache HIT - Returning cached data');
          const data = JSON.parse(cachedData);
          return res.json({
            source: 'cache',
            data: data
          });
        }
        
        console.log('❌ Cache MISS - Fetching from database');
        
        // Store the original send function
        const originalSend = res.json.bind(res);
        
        // Override the send function to cache the response
        res.json = function(body) {
          // Cache the response data (excluding the source flag)
          const dataToCache = body.data || body;
          redis.setEx(cacheKey, 3600, JSON.stringify(dataToCache))
            .catch(err => console.error('Cache set error:', err));
          
          return originalSend(body);
        };
      } else {
        console.log('⚠️ Redis unavailable - bypassing cache');
      }
      
      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next(); // Continue even if cache fails
    }
  };
};

// GET all categories with caching
app.get('/api/categories', cacheMiddleware('categories'), async (req, res) => {
  try {
    const categories = await Category.findAll({
      attributes: ['id', 'name', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
      raw: true
    });
    
    res.json({
      source: 'database',
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET single category by ID with caching
app.get('/api/categories/:id', cacheMiddleware('category'), async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id, {
      attributes: ['id', 'name', 'created_at', 'updated_at'],
      raw: true
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json({
      source: 'database',
      data: category
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET categories with pagination
app.get('/api/categories/paginated', cacheMiddleware('categories_paginated'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    const { count, rows } = await Category.findAndCountAll({
      attributes: ['id', 'name', 'created_at', 'updated_at'],
      order: [['created_at', 'DESC']],
      limit: limit,
      offset: offset,
      raw: true
    });
    
    res.json({
      source: 'database',
      data: {
        categories: rows,
        pagination: {
          total: count,
          page: page,
          limit: limit,
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error fetching paginated categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CREATE new category (invalidates cache)
app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const now = new Date();
    const category = await Category.create({
      name,
      created_at: now,
      updated_at: now
    });
    
    // Invalidate caches (only if Redis is ready)
    if (redis.isReady()) {
      await redis.del('categories:all');
      await redis.del('categories_paginated:all');
      console.log('🔄 Cache invalidated for categories');
    }
    
    res.status(201).json({
      message: 'Category created successfully',
      data: category
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// BULK CREATE categories
app.post('/api/categories/bulk', async (req, res) => {
  try {
    const { names } = req.body;
    
    if (!names || !Array.isArray(names) || names.length === 0) {
      return res.status(400).json({ error: 'Names array is required' });
    }
    
    const categories = names.map(name => ({
      name,
      created_at: new Date(),
      updated_at: new Date()
    }));
    
    const created = await Category.bulkCreate(categories);
    
    // Invalidate caches (only if Redis is ready)
    if (redis.isReady()) {
      await redis.del('categories:all');
      await redis.del('categories_paginated:all');
      console.log('🔄 Cache invalidated - bulk insert');
    }
    
    res.status(201).json({
      message: `${created.length} categories created successfully`,
      data: created
    });
  } catch (error) {
    console.error('Error bulk creating categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// UPDATE category (invalidates specific cache)
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { name } = req.body;
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    category.name = name || category.name;
    category.updated_at = new Date();
    await category.save();
    
    // Invalidate caches (only if Redis is ready)
    if (redis.isReady()) {
      await redis.del('categories:all');
      await redis.del('categories_paginated:all');
      await redis.del(`category:${category.id}`);
      console.log(`🔄 Cache invalidated for category: ${category.id}`);
    }
    
    res.json({
      message: 'Category updated successfully',
      data: category
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE category (invalidates cache)
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    await category.destroy();
    
    // Invalidate caches (only if Redis is ready)
    if (redis.isReady()) {
      await redis.del('categories:all');
      await redis.del('categories_paginated:all');
      await redis.del(`category:${category.id}`);
      console.log(`🔄 Cache invalidated - category deleted: ${category.id}`);
    }
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// SEARCH categories
app.get('/api/categories/search', cacheMiddleware('categories_search'), async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const { Op } = require('sequelize');
    const categories = await Category.findAll({
      where: {
        name: {
          [Op.like]: `%${q}%`
        }
      },
      attributes: ['id', 'name', 'created_at', 'updated_at'],
      order: [['name', 'ASC']],
      limit: 20,
      raw: true
    });
    
    res.json({
      source: 'database',
      data: categories
    });
  } catch (error) {
    console.error('Error searching categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  const status = {
    server: 'OK',
    database: false,
    redis: redis.isReady()
  };

  try {
    await sequelize.authenticate();
    status.database = true;
  } catch (error) {
    status.database = false;
    status.error = error.message;
  }

  res.json({
    status: status.database && status.server ? 'healthy' : 'unhealthy',
    ...status
  });
});

// Database connection and server start
const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL database connection established');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('❌ Unable to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### Step 5: Verify Package.json

**package.json** (Make sure redis version is 3.1.2)
```json
{
  "name": "redis-cache-api",
  "version": "1.0.0",
  "description": "API with Redis caching using MySQL",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mysql2": "^3.6.0",
    "redis": "^3.1.2",  // ← Make sure this is 3.1.2
    "sequelize": "^6.32.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### Step 6: Test Redis Connection

**test-redis.js**
```javascript
const redis = require('redis');

console.log('🧪 Testing Redis connection...');

const client = redis.createClient({
  host: 'localhost',
  port: 6379
});

client.on('connect', () => {
  console.log('✅ Connected to Redis!');
  
  // Test set/get
  client.set('test_key', 'Hello World!', (err, reply) => {
    if (err) {
      console.error('❌ Set error:', err);
    } else {
      console.log('✅ Set successful:', reply);
      
      client.get('test_key', (err, reply) => {
        if (err) {
          console.error('❌ Get error:', err);
        } else {
          console.log('✅ Get successful:', reply);
          client.del('test_key', () => {
            console.log('✅ Cleanup complete');
            client.quit();
            process.exit(0);
          });
        }
      });
    }
  });
});

client.on('error', (err) => {
  console.error('❌ Redis error:', err.message);
  process.exit(1);
});

setTimeout(() => {
  console.log('⏰ Timeout - Redis may not be running');
  client.quit();
  process.exit(1);
}, 5000);
```

### Step 7: Run Everything

```bash
# 1. Start Redis
redis-server

# 2. Test Redis connection
node test-redis.js

# 3. Start your server
npm start

# 4. Test your API
curl http://localhost:3000/api/health
curl http://localhost:3000/api/categories
```

## Expected Output

```
✅ MySQL database connection established
✅ Database synced
✅ Connected to Redis
✅ Redis is ready
🚀 Server running on port 3000
📊 Health check: http://localhost:3000/api/health
```

## Summary of Changes

1. ✅ Downgraded `redis` from v4.x to **v3.1.2**
2. ✅ Removed password from Redis config (since your Redis has no password)
3. ✅ Added `isReady()` check before using Redis
4. ✅ Added health check endpoint
5. ✅ Added proper error handling

The **redis@3.1.2** version doesn't use the `HELLO` command, so it works perfectly with Redis 5 and below! 🚀
