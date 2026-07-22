Here's your authentication code fully converted to use Sequelize instead of in-memory storage:

## 1. Updated Auth Routes with Sequelize

```javascript
// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const User = require('../models/User');
const { authenticateToken } = require('../middleware/auth');

// Secret key for JWT (store in environment variables in production)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRY = '24h';

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { email, password, name } = req.body;

        // Validation
        if (!email || !password || !name) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email, password, and name are required' 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                message: 'User already exists' 
            });
        }

        // Hash password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // Create new user
        const newUser = await User.create({
            email,
            name,
            password: hashedPassword
        });

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, name: newUser.name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        // Return user data (without password) and token
        const userWithoutPassword = newUser.toJSON();
        delete userWithoutPassword.password;
        
        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: userWithoutPassword,
                token
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle Sequelize validation errors
        if (error.name === 'SequelizeValidationError') {
            return res.status(400).json({
                success: false,
                message: error.errors.map(e => e.message).join(', ')
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during registration' 
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and password are required' 
            });
        }

        // Find user
        const user = await User.findOne({ where: { email } });
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Check password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid email or password' 
            });
        }

        // Update last login
        await user.update({ lastLogin: new Date() });

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        // Return user data (without password) and token
        const userWithoutPassword = user.toJSON();
        delete userWithoutPassword.password;

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: userWithoutPassword,
                token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during login' 
        });
    }
});

// Logout user (client-side token removal)
router.post('/logout', async (req, res) => {
    try {
        // In JWT-based authentication, logout is handled client-side
        // by removing the token. Server can optionally maintain a blacklist.
        
        // You can add token to a blacklist here if you're maintaining one
        // const token = req.headers.authorization?.split(' ')[1];
        // if (token) {
        //     blacklist.add(token);
        // }

        res.status(200).json({
            success: true,
            message: 'Logout successful. Please remove the token from client-side storage.'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error during logout' 
        });
    }
});

// Get user profile (protected route)
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        // User data is attached to request by authenticateToken middleware
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Return user data (without password)
        const userWithoutPassword = user.toJSON();
        delete userWithoutPassword.password;

        res.status(200).json({
            success: true,
            message: 'Profile retrieved successfully',
            data: { user: userWithoutPassword }
        });

    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error while fetching profile' 
        });
    }
});

// Update user profile (protected route)
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        const { name, email } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Check if email is already taken by another user
        if (email) {
            const emailExists = await User.findOne({
                where: {
                    email: email,
                    id: { [Op.ne]: req.user.id }
                }
            });
            
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already taken by another user'
                });
            }
        }

        // Update fields
        await user.update({
            name: name || user.name,
            email: email || user.email
        });

        // Return updated user data (without password)
        const userWithoutPassword = user.toJSON();
        delete userWithoutPassword.password;

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            data: { user: userWithoutPassword }
        });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error while updating profile' 
        });
    }
});

// Change password (protected route)
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Verify current password
        const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        // Hash new password
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password
        await user.update({ password: hashedPassword });

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error while changing password' 
        });
    }
});

// Delete account (protected route)
router.delete('/account', authenticateToken, async (req, res) => {
    try {
        const user = await User.findByPk(req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Delete user from database
        await user.destroy();

        res.status(200).json({
            success: true,
            message: 'Account deleted successfully'
        });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error while deleting account' 
        });
    }
});

module.exports = router;
```

## 2. Updated Auth Middleware

```javascript
// middleware/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Access denied. No token provided.' 
        });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        
        // Optional: Verify user still exists in database
        const user = await User.findByPk(decoded.id);
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'User no longer exists'
            });
        }
        
        req.user = decoded;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                success: false, 
                message: 'Token expired. Please login again.' 
            });
        }
        return res.status(403).json({ 
            success: false, 
            message: 'Invalid token.' 
        });
    }
};

module.exports = { authenticateToken };
```

## 3. Updated User Model (with additional fields)

```javascript
// models/User.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcryptjs');

const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
            notEmpty: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: {
                args: [6, 100],
                msg: 'Password must be at least 6 characters long'
            }
        },
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notEmpty: true,
            len: {
                args: [2, 100],
                msg: 'Name must be between 2 and 100 characters'
            }
        },
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true,
    }
}, {
    tableName: 'users',
    timestamps: true, // Adds createdAt and updatedAt
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Instance method to check password
User.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
};

// Instance method to exclude password from JSON
User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    return values;
};

module.exports = User;
```

## 4. Database Configuration

```javascript
// config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'your_database',
    process.env.DB_USER || 'your_username',
    process.env.DB_PASSWORD || 'your_password',
    {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql', // or 'postgres', 'sqlite', 'mariadb', 'mssql'
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 5,
            min: 0,
            acquire: 30000,
            idle: 10000,
        },
        define: {
            freezeTableName: true,
        }
    }
);

module.exports = sequelize;
```

## 5. Main App File

```javascript
// app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const sequelize = require('./config/database');
const authRoutes = require('./routes/authRoutes');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        message: 'Server is running' 
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!'
    });
});

// Initialize database and start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Test database connection
        await sequelize.authenticate();
        console.log('Database connection established successfully.');

        // Sync models with database
        // { alter: true } - updates schema without losing data
        // { force: true } - drops and recreates tables (use with caution)
        await sequelize.sync({ alter: true });
        console.log('Database synchronized');

        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Unable to connect to the database:', error);
        process.exit(1);
    }
};

startServer();

module.exports = app;
```

## 6. Environment Variables (.env)

```env
# Database Configuration
DB_NAME=your_database_name
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_HOST=localhost
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=24h

# Server Configuration
PORT=3000
NODE_ENV=development
```

## 7. Package.json Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.32.1",
    "mysql2": "^3.6.0",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.0",
    "dotenv": "^16.3.1",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

## Key Changes Made:

1. **Removed**: In-memory `users` array
2. **Replaced**: All array operations with Sequelize database queries
3. **Added**: Database persistence with proper error handling
4. **Added**: Sequelize validations for email format and password length
5. **Added**: Model hooks for automatic password hashing
6. **Added**: UUID support for user IDs
7. **Added**: `lastLogin` tracking
8. **Added**: Database synchronization on startup
9. **Added**: Environment variable support
10. **Added**: Better error handling and validation

## Benefits Over In-Memory Storage:

- ✅ Persistent data across server restarts
- ✅ Scalable for multiple server instances
- ✅ Data integrity with database constraints
- ✅ Better query capabilities (filtering, sorting, etc.)
- ✅ Transaction support
- ✅ Built-in validation and error handling
- ✅ Supports relationships with other tables

The users will now be stored in your database permanently, and all authentication operations will work with the database instead of memory.
