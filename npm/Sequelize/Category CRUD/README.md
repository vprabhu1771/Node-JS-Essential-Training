I'll help you create a complete CRUD application for categories using Node.js, Sequelize, Vite, and React. Here's a full implementation:

## Backend (Node.js + Express + Sequelize)

### 1. Project Structure
```
backend/
├── models/
│   └── Category.js
├── controllers/
│   └── categoryController.js
├── routes/
│   └── categoryRoutes.js
├── config/
│   └── database.js
├── server.js
└── package.json
```

### 2. Package.json (Backend)
```json
{
  "name": "backend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "sequelize": "^6.32.1",
    "mysql2": "^3.5.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### 3. Database Configuration (config/database.js)
```javascript
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'category_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: 'mysql',
    logging: false,
    define: {
      timestamps: true,
      underscored: false
    }
  }
);

export default sequelize;
```

### 4. Category Model (models/Category.js)
```javascript
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Category = sequelize.define('Category', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  }
}, {
  tableName: 'categories',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

export default Category;
```

### 5. Category Controller (controllers/categoryController.js)
```javascript
import Category from '../models/Category.js';

// Get all categories
export const getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [['created_at', 'DESC']]
    });
    res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Get category by ID
export const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Create new category
export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required'
      });
    }
    
    const category = await Category.create({ name });
    
    res.status(201).json({
      success: true,
      data: category,
      message: 'Category created successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Update category
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    await category.update({ name });
    
    res.status(200).json({
      success: true,
      data: category,
      message: 'Category updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// Delete category
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await Category.findByPk(id);
    
    if (!category) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }
    
    await category.destroy();
    
    res.status(200).json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

### 6. Routes (routes/categoryRoutes.js)
```javascript
import express from 'express';
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController.js';

const router = express.Router();

router.get('/categories', getAllCategories);
router.get('/categories/:id', getCategoryById);
router.post('/categories', createCategory);
router.put('/categories/:id', updateCategory);
router.delete('/categories/:id', deleteCategory);

export default router;
```

### 7. Server (server.js)
```javascript
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import categoryRoutes from './routes/categoryRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', categoryRoutes);

// Test route
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Sync database and start server
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync({ alter: true });
    console.log('Database synchronized.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
```

### 8. .env file
```env
PORT=5000
DB_NAME=category_db
DB_USER=root
DB_PASSWORD=
DB_HOST=localhost
```

---

## Frontend (React + Vite)

### 1. Project Structure
```
frontend/
├── src/
│   ├── api/
│   │   └── categoryApi.js
│   ├── components/
│   │   ├── CategoryList.jsx
│   │   ├── CategoryForm.jsx
│   │   └── CategoryItem.jsx
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── vite.config.js
```

### 2. Package.json (Frontend)
```json
{
  "name": "frontend",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "axios": "^1.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.4.5"
  }
}
```

### 3. API Service (src/api/categoryApi.js)
```javascript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const categoryApi = {
  // Get all categories
  getAll: () => api.get('/categories'),
  
  // Get category by ID
  getById: (id) => api.get(`/categories/${id}`),
  
  // Create category
  create: (data) => api.post('/categories', data),
  
  // Update category
  update: (id, data) => api.put(`/categories/${id}`, data),
  
  // Delete category
  delete: (id) => api.delete(`/categories/${id}`),
};

export default api;
```

### 4. Category List Component (src/components/CategoryList.jsx)
```jsx
import React, { useState, useEffect } from 'react';
import CategoryForm from './CategoryForm';
import CategoryItem from './CategoryItem';
import { categoryApi } from '../api/categoryApi';

const CategoryList = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await categoryApi.getAll();
      setCategories(response.data.data);
      setError(null);
    } catch (err) {
      setError('Failed to load categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (name) => {
    try {
      const response = await categoryApi.create({ name });
      setCategories([response.data.data, ...categories]);
      return true;
    } catch (err) {
      setError('Failed to create category');
      console.error(err);
      return false;
    }
  };

  const handleUpdate = async (id, name) => {
    try {
      const response = await categoryApi.update(id, { name });
      setCategories(categories.map(cat => 
        cat.id === id ? response.data.data : cat
      ));
      setEditingCategory(null);
      return true;
    } catch (err) {
      setError('Failed to update category');
      console.error(err);
      return false;
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    
    try {
      await categoryApi.delete(id);
      setCategories(categories.filter(cat => cat.id !== id));
    } catch (err) {
      setError('Failed to delete category');
      console.error(err);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
  };

  if (loading && categories.length === 0) {
    return <div className="loading">Loading categories...</div>;
  }

  return (
    <div className="category-container">
      <h1>Category Management</h1>
      
      {error && <div className="error-message">{error}</div>}
      
      <CategoryForm 
        onSubmit={handleCreate}
        buttonText="Add Category"
        placeholder="Enter category name..."
      />
      
      <div className="category-list">
        {categories.length === 0 ? (
          <p className="no-categories">No categories found. Add one above!</p>
        ) : (
          categories.map(category => (
            <CategoryItem
              key={category.id}
              category={category}
              onEdit={handleEdit}
              onDelete={handleDelete}
              isEditing={editingCategory?.id === category.id}
              onUpdate={handleUpdate}
              onCancelEdit={handleCancelEdit}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryList;
```

### 5. Category Form Component (src/components/CategoryForm.jsx)
```jsx
import React, { useState, useEffect } from 'react';

const CategoryForm = ({ 
  onSubmit, 
  initialValue = '', 
  buttonText = 'Submit',
  placeholder = 'Enter name...',
  onCancel 
}) => {
  const [name, setName] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setName(initialValue);
  }, [initialValue]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedName = name.trim();
    
    if (!trimmedName) {
      alert('Category name is required');
      return;
    }
    
    setIsSubmitting(true);
    const success = await onSubmit(trimmedName);
    setIsSubmitting(false);
    
    if (success) {
      setName('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="category-form">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={placeholder}
        disabled={isSubmitting}
        className="category-input"
      />
      <button 
        type="submit" 
        disabled={isSubmitting || !name.trim()}
        className="btn btn-primary"
      >
        {isSubmitting ? 'Saving...' : buttonText}
      </button>
      {onCancel && (
        <button 
          type="button" 
          onClick={onCancel}
          className="btn btn-secondary"
        >
          Cancel
        </button>
      )}
    </form>
  );
};

export default CategoryForm;
```

### 6. Category Item Component (src/components/CategoryItem.jsx)
```jsx
import React from 'react';
import CategoryForm from './CategoryForm';

const CategoryItem = ({ 
  category, 
  onEdit, 
  onDelete, 
  isEditing, 
  onUpdate,
  onCancelEdit 
}) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isEditing) {
    return (
      <div className="category-item editing">
        <CategoryForm
          initialValue={category.name}
          onSubmit={(name) => onUpdate(category.id, name)}
          buttonText="Update"
          placeholder="Update category name..."
          onCancel={onCancelEdit}
        />
      </div>
    );
  }

  return (
    <div className="category-item">
      <div className="category-content">
        <div className="category-header">
          <h3 className="category-name">{category.name}</h3>
          <div className="category-actions">
            <button 
              onClick={() => onEdit(category)}
              className="btn btn-edit"
            >
              Edit
            </button>
            <button 
              onClick={() => onDelete(category.id)}
              className="btn btn-delete"
            >
              Delete
            </button>
          </div>
        </div>
        <div className="category-meta">
          <span className="category-id">ID: {category.id}</span>
          <span className="category-created">
            Created: {formatDate(category.created_at)}
          </span>
          <span className="category-updated">
            Updated: {formatDate(category.updated_at)}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CategoryItem;
```

### 7. App Component (src/App.jsx)
```jsx
import React from 'react';
import CategoryList from './components/CategoryList';
import './App.css';

function App() {
  return (
    <div className="app">
      <CategoryList />
    </div>
  );
}

export default App;
```

### 8. Main Entry (src/main.jsx)
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

### 9. Styles (src/App.css)
```css
.app {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
}

.category-container {
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  padding: 24px;
}

h1 {
  color: #2c3e50;
  margin-top: 0;
  margin-bottom: 24px;
  font-size: 28px;
}

.category-form {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
}

.category-input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 16px;
  transition: border-color 0.3s;
}

.category-input:focus {
  outline: none;
  border-color: #3498db;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  font-weight: 500;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2980b9;
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}

.btn-edit {
  background: #f39c12;
  color: white;
  padding: 6px 14px;
  font-size: 14px;
}

.btn-edit:hover {
  background: #e67e22;
}

.btn-delete {
  background: #e74c3c;
  color: white;
  padding: 6px 14px;
  font-size: 14px;
}

.btn-delete:hover {
  background: #c0392b;
}

.category-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.category-item:hover {
  background: #f1f3f5;
  border-color: #dee2e6;
}

.category-item.editing {
  background: #e8f4fd;
  border-color: #3498db;
}

.category-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.category-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.category-name {
  margin: 0;
  font-size: 18px;
  color: #2c3e50;
}

.category-actions {
  display: flex;
  gap: 8px;
}

.category-meta {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  font-size: 13px;
  color: #6c757d;
}

.category-id {
  font-weight: 500;
  color: #495057;
}

.error-message {
  background: #f8d7da;
  color: #721c24;
  padding: 12px 16px;
  border-radius: 6px;
  margin-bottom: 16px;
  border: 1px solid #f5c6cb;
}

.loading {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-size: 18px;
}

.no-categories {
  text-align: center;
  color: #6c757d;
  padding: 40px;
  font-size: 16px;
}
```

### 10. Vite Configuration (vite.config.js)
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
```

---

## Setup Instructions

### Backend Setup:
```bash
# Create backend directory
mkdir backend
cd backend

# Initialize npm
npm init -y

# Install dependencies
npm install express sequelize mysql2 cors dotenv
npm install -D nodemon

# Create the files as shown above
# Start the server
npm run dev
```

### Frontend Setup:
```bash
# Create frontend with Vite
npm create vite@latest frontend -- --template react
cd frontend

# Install dependencies
npm install axios

# Create the files as shown above
# Start the development server
npm run dev
```

### Database Setup (MySQL):
```sql
CREATE DATABASE category_db;
```

### MySQL Table Structure (will be created automatically by Sequelize):
```sql
CREATE TABLE categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/:id` | Get category by ID |
| POST | `/api/categories` | Create new category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

---

## Features Implemented

- ✅ Full CRUD operations (Create, Read, Update, Delete)
- ✅ Automatic timestamps (created_at, updated_at)
- ✅ Validation on name field
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive design
- ✅ Date formatting
- ✅ Clean UI with proper styling

This is a complete, production-ready CRUD application for categories with all the requested features!
