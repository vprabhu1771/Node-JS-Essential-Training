I'll update the implementation to use MySQL instead of PostgreSQL. Here's the complete setup with MySQL.

## Backend Setup (Node.js + Prisma + MySQL)

### 1. Initialize the project

```bash
mkdir category-crud-mysql
cd category-crud-mysql
mkdir backend frontend
cd backend
npm init -y
```

### 2. Install dependencies

```bash
npm install express prisma @prisma/client cors dotenv mysql2
npm install -D nodemon
```

### 3. Prisma setup

```bash
npx prisma init
```

### 4. Configure `.env` file for MySQL

```env
DATABASE_URL="mysql://root:password@localhost:3306/categorydb"
```

### 5. Create Prisma Schema - `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model Category {
  id         Int      @id @default(autoincrement())
  name       String   @db.VarChar(255)
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("categories")
}
```

### 6. Run migration for MySQL

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 7. Create Express Server - `server.js`

```javascript
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// CRUD Routes

// GET all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET single category
app.get('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CREATE category
app.post('/api/categories', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const category = await prisma.category.create({
      data: { name: name.trim() }
    });
    
    res.status(201).json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Category name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// UPDATE category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name: name.trim() }
    });
    
    res.json(category);
  } catch (error) {
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Category name already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// DELETE category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category exists
    const existingCategory = await prisma.category.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    await prisma.category.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

### 8. Update `package.json` scripts

```json
{
  "name": "backend",
  "version": "1.0.0",
  "description": "",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  },
  "keywords": [],
  "author": "",
  "license": "ISC",
  "dependencies": {
    "@prisma/client": "^5.0.0",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "mysql2": "^3.6.0"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "prisma": "^5.0.0"
  }
}
```

---

## Frontend Setup (Vite + React)

### 1. Create Vite React app

```bash
cd frontend
npm create vite@latest . -- --template react
npm install
```

### 2. Install additional dependencies

```bash
npm install axios react-hot-toast
```

### 3. Create API service - `src/api/categoryApi.js`

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/categories';

export const categoryApi = {
  // Get all categories
  getAll: async () => {
    try {
      const response = await axios.get(API_URL);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Get single category
  getById: async (id) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Create category
  create: async (name) => {
    try {
      const response = await axios.post(API_URL, { name });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Update category
  update: async (id, name) => {
    try {
      const response = await axios.put(`${API_URL}/${id}`, { name });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Delete category
  delete: async (id) => {
    try {
      const response = await axios.delete(`${API_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};
```

### 4. Main App Component - `src/App.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { categoryApi } from './api/categoryApi';
import toast, { Toaster } from 'react-hot-toast';
import './App.css';

function App() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getAll();
      setCategories(data);
    } catch (err) {
      toast.error(err.error || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Handle form submission (Create)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      await categoryApi.create(name.trim());
      setName('');
      toast.success('Category created successfully!');
      fetchCategories();
    } catch (err) {
      toast.error(err.error || 'Failed to create category');
    }
  };

  // Start editing
  const startEdit = (category) => {
    setEditingId(category.id);
    setEditName(category.name);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  // Update category
  const handleUpdate = async (id) => {
    if (!editName.trim()) {
      toast.error('Category name is required');
      return;
    }

    try {
      await categoryApi.update(id, editName.trim());
      setEditingId(null);
      setEditName('');
      toast.success('Category updated successfully!');
      fetchCategories();
    } catch (err) {
      toast.error(err.error || 'Failed to update category');
    }
  };

  // Delete category
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await categoryApi.delete(id);
      toast.success('Category deleted successfully!');
      fetchCategories();
    } catch (err) {
      toast.error(err.error || 'Failed to delete category');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Filter categories based on search
  const filteredCategories = categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="app">
      <Toaster position="top-right" />
      
      <div className="container">
        <h1>
          <span className="icon">📁</span>
          Category Management
        </h1>

        {/* Create Category Form */}
        <div className="card">
          <h2>Add New Category</h2>
          <form onSubmit={handleSubmit} className="create-form">
            <input
              type="text"
              placeholder="Enter category name..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field"
            />
            <button type="submit" className="btn btn-primary">
              <span>+</span> Add Category
            </button>
          </form>
        </div>

        {/* Search and Categories List */}
        <div className="card">
          <div className="list-header">
            <h2>Categories</h2>
            <div className="search-box">
              <input
                type="text"
                placeholder="Search categories..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-field"
              />
              <span className="search-icon">🔍</span>
            </div>
          </div>

          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Loading categories...</p>
            </div>
          ) : (
            <div className="categories-list">
              {filteredCategories.length === 0 ? (
                <div className="empty-state">
                  <span className="empty-icon">📭</span>
                  <p>No categories found</p>
                  {searchTerm && <p className="empty-sub">Try adjusting your search</p>}
                </div>
              ) : (
                filteredCategories.map((category) => (
                  <div key={category.id} className="category-item">
                    {editingId === category.id ? (
                      // Edit Mode
                      <div className="edit-mode">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="input-field"
                          autoFocus
                        />
                        <div className="edit-actions">
                          <button 
                            onClick={() => handleUpdate(category.id)} 
                            className="btn btn-success"
                          >
                            Save
                          </button>
                          <button 
                            onClick={cancelEdit} 
                            className="btn btn-secondary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="category-info">
                          <div className="category-name">
                            <span className="category-icon">📌</span>
                            <h3>{category.name}</h3>
                          </div>
                          <div className="category-dates">
                            <span>
                              <span className="date-label">Created:</span>
                              {formatDate(category.createdAt)}
                            </span>
                            <span>
                              <span className="date-label">Updated:</span>
                              {formatDate(category.updatedAt)}
                            </span>
                          </div>
                        </div>
                        <div className="category-actions">
                          <button 
                            onClick={() => startEdit(category)} 
                            className="btn btn-warning"
                          >
                            ✏️ Edit
                          </button>
                          <button 
                            onClick={() => handleDelete(category.id)} 
                            className="btn btn-danger"
                          >
                            🗑️ Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
```

### 5. Enhanced Styling - `src/App.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

.app {
  max-width: 900px;
  margin: 0 auto;
}

.container {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

h1 {
  text-align: center;
  color: #2d3748;
  font-size: 2.5rem;
  margin-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

h1 .icon {
  font-size: 2.8rem;
}

h2 {
  color: #2d3748;
  font-size: 1.3rem;
  margin-bottom: 15px;
}

/* Card Styles */
.card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
  border: 1px solid #e2e8f0;
}

/* Input Fields */
.input-field {
  padding: 12px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f7fafc;
  width: 100%;
}

.input-field:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.input-field::placeholder {
  color: #a0aec0;
}

/* Buttons */
.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  background: linear-gradient(135deg, #5a67d8 0%, #6b46a1 100%);
}

.btn-success {
  background: #48bb78;
  color: white;
}

.btn-success:hover {
  background: #38a169;
}

.btn-warning {
  background: #ed8936;
  color: white;
}

.btn-warning:hover {
  background: #dd6b20;
}

.btn-danger {
  background: #fc8181;
  color: white;
}

.btn-danger:hover {
  background: #f56565;
}

.btn-secondary {
  background: #a0aec0;
  color: white;
}

.btn-secondary:hover {
  background: #718096;
}

/* Create Form */
.create-form {
  display: flex;
  gap: 12px;
}

.create-form .input-field {
  flex: 1;
}

.create-form .btn {
  white-space: nowrap;
}

/* List Header */
.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 15px;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 300px;
}

.search-box .input-field {
  padding-right: 40px;
}

.search-icon {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a0aec0;
  font-size: 1.1rem;
}

/* Categories List */
.categories-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  background: #f7fafc;
  border-radius: 10px;
  padding: 16px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.category-item:hover {
  background: #edf2f7;
  border-color: #e2e8f0;
}

.category-info {
  flex: 1;
  min-width: 0;
}

.category-name {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.category-icon {
  font-size: 1.2rem;
}

.category-name h3 {
  font-size: 1.1rem;
  color: #2d3748;
  word-break: break-word;
}

.category-dates {
  display: flex;
  gap: 20px;
  font-size: 0.85rem;
  color: #718096;
  flex-wrap: wrap;
}

.date-label {
  font-weight: 600;
  color: #4a5568;
  margin-right: 4px;
}

.category-actions {
  display: flex;
  gap: 8px;
  margin-left: 15px;
  flex-shrink: 0;
}

.category-actions .btn {
  padding: 8px 14px;
  font-size: 0.9rem;
}

/* Edit Mode */
.edit-mode {
  display: flex;
  gap: 12px;
  flex: 1;
  align-items: center;
  flex-wrap: wrap;
}

.edit-mode .input-field {
  flex: 1;
  min-width: 150px;
}

.edit-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.edit-actions .btn {
  padding: 8px 16px;
  font-size: 0.9rem;
}

/* Loading State */
.loading {
  text-align: center;
  padding: 40px 20px;
}

.spinner {
  border: 4px solid #e2e8f0;
  border-top: 4px solid #667eea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 0 auto 15px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading p {
  color: #718096;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #718096;
}

.empty-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 15px;
}

.empty-state p {
  font-size: 1.1rem;
}

.empty-sub {
  font-size: 0.95rem !important;
  color: #a0aec0;
  margin-top: 5px;
}

/* Responsive Design */
@media (max-width: 768px) {
  .container {
    padding: 20px;
  }

  h1 {
    font-size: 2rem;
  }

  .create-form {
    flex-direction: column;
  }

  .list-header {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    max-width: 100%;
  }

  .category-item {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .category-actions {
    margin-left: 0;
    justify-content: flex-end;
  }

  .category-dates {
    flex-direction: column;
    gap: 4px;
  }

  .edit-mode {
    flex-direction: column;
  }

  .edit-actions {
    width: 100%;
  }

  .edit-actions .btn {
    flex: 1;
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .container {
    padding: 15px;
  }

  h1 {
    font-size: 1.5rem;
  }

  .card {
    padding: 16px;
  }

  .category-item {
    padding: 14px;
  }

  .category-actions {
    flex-wrap: wrap;
  }

  .category-actions .btn {
    flex: 1;
    justify-content: center;
    font-size: 0.85rem;
    padding: 6px 12px;
  }
}
```

### 6. Update `package.json` for frontend

```json
{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-hot-toast": "^2.4.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@vitejs/plugin-react": "^4.0.3",
    "vite": "^4.4.5"
  }
}
```

### 7. Create MySQL Database

```sql
-- Connect to MySQL
mysql -u root -p

-- Create database
CREATE DATABASE IF NOT EXISTS categorydb;
```

### 8. Additional Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Open Prisma Studio (GUI for data)
npx prisma studio

# Reset database (if needed)
npx prisma migrate reset

# Create a new migration after schema changes
npx prisma migrate dev --name add_field
```

---

## Running the Application

### 1. Start Backend Server
```bash
cd backend
npm run dev
# Server runs on http://localhost:5000
```

### 2. Start Frontend Development Server
```bash
cd frontend
npm run dev
# Server runs on http://localhost:5173
```

### 3. Access Prisma Studio (Optional)
```bash
cd backend
npx prisma studio
# Opens http://localhost:5555
```

---

## MySQL-Specific Features

### Database Schema
- Uses `mysql2` driver for MySQL connection
- `@db.VarChar(255)` specifies MySQL VARCHAR type
- Proper character set and collation handling

### Unique Features
- **Unique constraint handling**: Duplicate category names are prevented
- **Error handling**: Specific MySQL error codes (P2002 for duplicates)
- **Date formatting**: Proper MySQL datetime handling

### Environment Variables
Create a `.env` file in the backend directory:

```env
DATABASE_URL="mysql://root:yourpassword@localhost:3306/categorydb"
PORT=5000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/:id` | Get single category |
| POST | `/api/categories` | Create new category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

---

## Features

- ✅ Full CRUD operations with MySQL
- ✅ Real-time updates
- ✅ Search functionality
- ✅ Toast notifications
- ✅ Error handling with specific MySQL errors
- ✅ Responsive design
- ✅ Beautiful UI with gradients
- ✅ Loading states
- ✅ Date/time formatting
- ✅ Prisma Studio for database management

The application is now fully configured to work with MySQL instead of PostgreSQL!
