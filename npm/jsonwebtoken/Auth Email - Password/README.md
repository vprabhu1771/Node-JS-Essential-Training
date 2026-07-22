Here's a complete `auth.js` file with login, logout, register, and profile logic:

```javascript
const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// In-memory user storage (replace with database in production)
const users = [];

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
        const existingUser = users.find(user => user.email === email);
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
        const newUser = {
            id: uuidv4(),
            email,
            name,
            password: hashedPassword,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        users.push(newUser);

        // Generate JWT token
        const token = jwt.sign(
            { id: newUser.id, email: newUser.email, name: newUser.name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        // Return user data (without password) and token
        const { password: _, ...userWithoutPassword } = newUser;
        
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
        const user = users.find(user => user.email === email);
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

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, email: user.email, name: user.name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRY }
        );

        // Update last login
        user.lastLogin = new Date().toISOString();

        // Return user data (without password) and token
        const { password: _, ...userWithoutPassword } = user;

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
        const user = users.find(u => u.id === req.user.id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Return user data (without password)
        const { password: _, ...userWithoutPassword } = user;

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
        const user = users.find(u => u.id === req.user.id);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Update fields
        if (name) user.name = name;
        if (email) {
            // Check if email is already taken by another user
            const emailExists = users.some(u => u.email === email && u.id !== req.user.id);
            if (emailExists) {
                return res.status(409).json({
                    success: false,
                    message: 'Email already taken by another user'
                });
            }
            user.email = email;
        }
        user.updatedAt = new Date().toISOString();

        // Return updated user data (without password)
        const { password: _, ...userWithoutPassword } = user;

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

        const user = users.find(u => u.id === req.user.id);
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
        user.password = await bcrypt.hash(newPassword, saltRounds);
        user.updatedAt = new Date().toISOString();

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
        const userIndex = users.findIndex(u => u.id === req.user.id);
        
        if (userIndex === -1) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Remove user from storage
        users.splice(userIndex, 1);

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

// Authentication middleware
function authenticateToken(req, res, next) {
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
}

module.exports = {
    router,
    authenticateToken,
    users // Export for testing purposes (remove in production)
};
```

## Key Features:

1. **Register**: Creates new user with hashed password using bcrypt
2. **Login**: Authenticates user and returns JWT token
3. **Logout**: Client-side token removal (with optional server-side blacklist)
4. **Profile**: Protected route to get user information
5. **Profile Update**: Protected route to update user details
6. **Password Change**: Protected route with current password verification
7. **Account Deletion**: Protected route to delete user account

## Usage Example:

```javascript
// In your main app.js or server.js
const authRoutes = require('./auth');

// Add authentication routes
app.use('/api/auth', authRoutes.router);

// Protected route example
app.get('/api/protected', authRoutes.authenticateToken, (req, res) => {
    res.json({ message: 'This is a protected route', user: req.user });
});
```

## API Endpoints:

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)
- `DELETE /api/auth/account` - Delete account (protected)

**Note**: In production, replace the in-memory `users` array with a database like MongoDB, PostgreSQL, etc., and store the JWT secret in environment variables.
