Here's the cleaned up version with only the essential routes you need:

## `routes/admin.js` - Simplified Version

```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// Import models
const AdminUser = require('../models/AdminUser');

// =============================================
// MIDDLEWARE
// =============================================

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'pushpa_secret_key', (err, user) => {
    if (err) {
      return res.status(403).json({ 
        success: false, 
        message: 'Invalid or expired token' 
      });
    }
    req.user = user;
    next();
  });
};

// =============================================
// AUTHENTICATION ROUTES
// =============================================

/**
 * @route   POST /api/admin/login
 * @desc    Admin login
 * @access  Public
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    // Find admin user
    const admin = await AdminUser.findOne({
      where: {
        username: username,
        is_active: true
      }
    });

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, admin.password_hash);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: admin.role,
        userType: 'admin',
      },
      process.env.JWT_SECRET || 'pushpa_secret_key',
      { expiresIn: '7d' }
    );

    // Return success response
    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
    });
  }
});

/**
 * @route   POST /api/admin/logout
 * @desc    Admin logout
 * @access  Private
 */
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    // Since we're using JWT, logout is handled client-side
    // by removing the token. This endpoint is for completeness.
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed'
    });
  }
});

// =============================================
// ADMIN USER MANAGEMENT ROUTES
// =============================================

/**
 * @route   GET /api/admin/users
 * @desc    Get all admin users
 * @access  Private (Super Admin only)
 */
router.get('/users', authenticateToken, async (req, res) => {
  try {
    const admin = req.user;

    // Only super admin can access
    if (admin.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Super admin rights required.' 
      });
    }

    const admins = await AdminUser.findAll({
      attributes: ['id', 'name', 'email', 'username', 'role', 'is_active', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    res.json({ 
      success: true, 
      data: admins 
    });
  } catch (error) {
    console.error('Get admin users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get admin users' 
    });
  }
});

/**
 * @route   POST /api/admin/users
 * @desc    Create a new admin user
 * @access  Private (Super Admin only)
 */
router.post('/users', authenticateToken, async (req, res) => {
  try {
    const { name, email, username, password, role } = req.body;
    const admin = req.user;

    // Only super admin can create new admins
    if (admin.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Super admin rights required.' 
      });
    }

    // Validate required fields
    if (!name || !email || !username || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields (name, email, username, password) are required' 
      });
    }

    // Check if username already exists
    const existingUsername = await AdminUser.findOne({
      where: { username }
    });

    if (existingUsername) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username already exists' 
      });
    }

    // Check if email already exists
    const existingEmail = await AdminUser.findOne({
      where: { email }
    });

    if (existingEmail) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email already exists' 
      });
    }

    // Hash password and create user
    const passwordHash = await bcrypt.hash(password, 10);

    const newAdmin = await AdminUser.create({
      name,
      email,
      username,
      password_hash: passwordHash,
      role: role || 'admin',
      is_active: true
    });

    // Remove password from response
    const responseData = {
      id: newAdmin.id,
      name: newAdmin.name,
      email: newAdmin.email,
      username: newAdmin.username,
      role: newAdmin.role,
      is_active: newAdmin.is_active,
      created_at: newAdmin.created_at
    };

    res.json({ 
      success: true, 
      message: 'Admin user created successfully',
      data: responseData
    });
  } catch (error) {
    console.error('Add admin user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create admin user' 
    });
  }
});

/**
 * @route   PUT /api/admin/users/:id
 * @desc    Update an admin user
 * @access  Private (Super Admin only)
 */
router.put('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role, is_active } = req.body;
    const admin = req.user;

    // Only super admin can update admins
    if (admin.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Super admin rights required.' 
      });
    }

    // Check if user exists
    const adminUser = await AdminUser.findByPk(id);
    if (!adminUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin user not found' 
      });
    }

    // Don't allow updating super admin's role or status
    if (adminUser.role === 'super_admin' && admin.id !== parseInt(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot modify super admin account' 
      });
    }

    // Build update object with only provided fields
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (is_active !== undefined) updateData.is_active = is_active;

    // Update user
    await adminUser.update(updateData);

    // Get updated user data
    const updatedUser = await AdminUser.findByPk(id, {
      attributes: ['id', 'name', 'email', 'username', 'role', 'is_active', 'created_at']
    });

    res.json({ 
      success: true, 
      message: 'Admin user updated successfully',
      data: updatedUser
    });
  } catch (error) {
    console.error('Update admin user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update admin user' 
    });
  }
});

/**
 * @route   DELETE /api/admin/users/:id
 * @desc    Delete an admin user
 * @access  Private (Super Admin only)
 */
router.delete('/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const admin = req.user;

    // Only super admin can delete admins
    if (admin.role !== 'super_admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied. Super admin rights required.' 
      });
    }

    // Don't allow deleting self
    if (parseInt(id) === admin.id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete your own account' 
      });
    }

    // Check if user exists
    const adminUser = await AdminUser.findByPk(id);
    if (!adminUser) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin user not found' 
      });
    }

    // Don't allow deleting super admin
    if (adminUser.role === 'super_admin') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete super admin account' 
      });
    }

    // Delete user
    await adminUser.destroy();

    res.json({ 
      success: true, 
      message: 'Admin user deleted successfully' 
    });
  } catch (error) {
    console.error('Delete admin user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete admin user' 
    });
  }
});

// =============================================
// EXPORT ROUTER
// =============================================

module.exports = router;
```

## Updated `server.js`

```javascript
const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/database');

// Load environment variables
dotenv.config();

// Import models
require('./models/AdminUser');

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =============================================
// ROUTES
// =============================================

// Admin routes
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Global error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// =============================================
// DATABASE CONNECTION & SERVER START
// =============================================

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('✅ MySQL database connected');
    
    await sequelize.sync({ alter: true });
    console.log('✅ Database synced');
    
    // Create default super admin if not exists
    const AdminUser = require('./models/AdminUser');
    const bcrypt = require('bcrypt');
    
    const adminExists = await AdminUser.findOne({
      where: { username: 'admin' }
    });
    
    if (!adminExists) {
      const passwordHash = await bcrypt.hash('admin123', 10);
      await AdminUser.create({
        name: 'Super Admin',
        email: 'admin@example.com',
        username: 'admin',
        password_hash: passwordHash,
        role: 'super_admin',
        is_active: true
      });
      console.log('✅ Default super admin created');
      console.log('📝 Username: admin');
      console.log('📝 Password: admin123');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📌 Admin API: http://localhost:${PORT}/api/admin`);
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
```

## Model File (`models/AdminUser.js`)

```javascript
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AdminUser = sequelize.define('AdminUser', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password_hash: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('super_admin', 'admin', 'support'),
    defaultValue: 'admin'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'admin_users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = AdminUser;
```

## API Endpoints Summary:

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/admin/login` | Admin login | Public |
| POST | `/api/admin/logout` | Admin logout | Private |
| GET | `/api/admin/users` | Get all admin users | Super Admin |
| POST | `/api/admin/users` | Create new admin user | Super Admin |
| PUT | `/api/admin/users/:id` | Update admin user | Super Admin |
| DELETE | `/api/admin/users/:id` | Delete admin user | Super Admin |

## Example API Usage:

**Login:**
```bash
POST /api/admin/login
{
  "username": "admin",
  "password": "admin123"
}
```

**Create Admin:**
```bash
POST /api/admin/users
Authorization: Bearer <token>
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "password123",
  "role": "admin"
}
```

**Update Admin:**
```bash
PUT /api/admin/users/1
Authorization: Bearer <token>
{
  "name": "John Updated",
  "email": "john.updated@example.com",
  "role": "support"
}
```

**Delete Admin:**
```bash
DELETE /api/admin/users/2
Authorization: Bearer <token>
```
