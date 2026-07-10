I'll help you create a full-stack application with Node.js, Prisma ORM, and Vite React for CRUD operations on a category table.

## Backend Setup (Node.js + Prisma)

### 1. Initialize the project

```bash
mkdir category-crud-app
cd category-crud-app
mkdir backend frontend
cd backend
npm init -y
```

### 2. Install dependencies

```bash
npm install express prisma @prisma/client cors dotenv
npm install -D nodemon
```

### 3. Prisma setup

```bash
npx prisma init
```

### 4. Configure `.env` file

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/categorydb"
```

### 5. Create Prisma Schema - `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Category {
  id         Int      @id @default(autoincrement())
  name       String
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("categories")
}
```

### 6. Run migration

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
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const category = await prisma.category.create({
      data: { name }
    });
    
    res.status(201).json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// UPDATE category
app.put('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }
    
    const category = await prisma.category.update({
      where: { id: parseInt(id) },
      data: { name }
    });
    
    res.json(category);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE category
app.delete('/api/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
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
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
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
npm install axios
```

### 3. Create API service - `src/api/categoryApi.js`

```javascript
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/categories';

export const categoryApi = {
  // Get all categories
  getAll: async () => {
    const response = await axios.get(API_URL);
    return response.data;
  },
  
  // Get single category
  getById: async (id) => {
    const response = await axios.get(`${API_URL}/${id}`);
    return response.data;
  },
  
  // Create category
  create: async (name) => {
    const response = await axios.post(API_URL, { name });
    return response.data;
  },
  
  // Update category
  update: async (id, name) => {
    const response = await axios.put(`${API_URL}/${id}`, { name });
    return response.data;
  },
  
  // Delete category
  delete: async (id) => {
    const response = await axios.delete(`${API_URL}/${id}`);
    return response.data;
  }
};
```

### 4. Main App Component - `src/App.jsx`

```jsx
import React, { useState, useEffect } from 'react';
import { categoryApi } from './api/categoryApi';
import './App.css';

function App() {
  const [categories, setCategories] = useState([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fetch all categories
  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await categoryApi.getAll();
      setCategories(data);
      setError('');
    } catch (err) {
      setError('Failed to fetch categories');
      console.error(err);
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
      setError('Category name is required');
      return;
    }

    try {
      await categoryApi.create(name.trim());
      setName('');
      setError('');
      fetchCategories();
    } catch (err) {
      setError('Failed to create category');
      console.error(err);
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
      setError('Category name is required');
      return;
    }

    try {
      await categoryApi.update(id, editName.trim());
      setEditingId(null);
      setEditName('');
      setError('');
      fetchCategories();
    } catch (err) {
      setError('Failed to update category');
      console.error(err);
    }
  };

  // Delete category
  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      await categoryApi.delete(id);
      setError('');
      fetchCategories();
    } catch (err) {
      setError('Failed to delete category');
      console.error(err);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="app">
      <h1>Category Management</h1>

      {error && <div className="error">{error}</div>}

      {/* Create Category Form */}
      <form onSubmit={handleSubmit} className="create-form">
        <input
          type="text"
          placeholder="Enter category name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit">Add Category</button>
      </form>

      {/* Categories List */}
      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="categories-list">
          {categories.length === 0 ? (
            <p className="no-categories">No categories found</p>
          ) : (
            categories.map((category) => (
              <div key={category.id} className="category-item">
                {editingId === category.id ? (
                  // Edit Mode
                  <div className="edit-mode">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <button onClick={() => handleUpdate(category.id)}>Save</button>
                    <button onClick={cancelEdit}>Cancel</button>
                  </div>
                ) : (
                  // View Mode
                  <>
                    <div className="category-info">
                      <h3>{category.name}</h3>
                      <div className="category-dates">
                        <span>Created: {formatDate(category.createdAt)}</span>
                        <span>Updated: {formatDate(category.updatedAt)}</span>
                      </div>
                    </div>
                    <div className="category-actions">
                      <button onClick={() => startEdit(category)}>Edit</button>
                      <button onClick={() => handleDelete(category.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

export default App;
```

### 5. Add styling - `src/App.css`

```css
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  background: #f5f7fa;
  color: #333;
}

.app {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 20px;
}

h1 {
  text-align: center;
  color: #2c3e50;
  margin-bottom: 2rem;
  font-size: 2.5rem;
}

.error {
  background: #fee;
  color: #c0392b;
  padding: 10px;
  border-radius: 5px;
  margin-bottom: 1rem;
  border: 1px solid #f5c6cb;
}

.loading {
  text-align: center;
  color: #666;
  padding: 2rem;
}

.no-categories {
  text-align: center;
  color: #999;
  padding: 2rem;
  font-size: 1.1rem;
}

/* Create Form */
.create-form {
  display: flex;
  gap: 10px;
  margin-bottom: 2rem;
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.create-form input {
  flex: 1;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 1rem;
}

.create-form input:focus {
  outline: none;
  border-color: #3498db;
}

.create-form button {
  padding: 12px 24px;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.3s;
}

.create-form button:hover {
  background: #2980b9;
}

/* Categories List */
.categories-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.category-item {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  transition: transform 0.2s;
}

.category-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
}

.category-info {
  flex: 1;
}

.category-info h3 {
  font-size: 1.2rem;
  color: #2c3e50;
  margin-bottom: 5px;
}

.category-dates {
  display: flex;
  gap: 20px;
  font-size: 0.85rem;
  color: #999;
}

.category-dates span {
  display: inline-block;
}

/* Edit Mode */
.edit-mode {
  display: flex;
  gap: 10px;
  flex: 1;
}

.edit-mode input {
  flex: 1;
  padding: 10px;
  border: 2px solid #3498db;
  border-radius: 5px;
  font-size: 1rem;
}

.edit-mode input:focus {
  outline: none;
}

.edit-mode button {
  padding: 10px 20px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.95rem;
  transition: background 0.3s;
}

.edit-mode button:first-of-type {
  background: #27ae60;
  color: white;
}

.edit-mode button:first-of-type:hover {
  background: #229954;
}

.edit-mode button:last-of-type {
  background: #95a5a6;
  color: white;
}

.edit-mode button:last-of-type:hover {
  background: #7f8c8d;
}

/* Category Actions */
.category-actions {
  display: flex;
  gap: 10px;
}

.category-actions button {
  padding: 8px 16px;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background 0.3s;
}

.category-actions button:first-child {
  background: #f39c12;
  color: white;
}

.category-actions button:first-child:hover {
  background: #e67e22;
}

.category-actions button:last-child {
  background: #e74c3c;
  color: white;
}

.category-actions button:last-child:hover {
  background: #c0392b;
}

/* Responsive */
@media (max-width: 600px) {
  .app {
    margin: 1rem auto;
  }

  .create-form {
    flex-direction: column;
  }

  .category-item {
    flex-direction: column;
    gap: 15px;
    align-items: stretch;
  }

  .category-dates {
    flex-direction: column;
    gap: 5px;
  }

  .edit-mode {
    flex-direction: column;
  }

  .category-actions {
    justify-content: flex-end;
  }
}
```

### 6. Update `package.json` scripts for Vite

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## Running the Application

### Backend (Port 5000)
```bash
cd backend
npm run dev
```

### Frontend (Port 5173)
```bash
cd frontend
npm run dev
```

### Environment Variables
Create `.env` files as needed:
- Backend: Configure DATABASE_URL
- Frontend: Update API_URL if needed

## Features
- ✅ Create categories
- ✅ Read all categories (with timestamps)
- ✅ Update categories
- ✅ Delete categories
- ✅ Real-time updates
- ✅ Error handling
- ✅ Loading states
- ✅ Responsive design
- ✅ Timestamp display (created_at, updated_at)

The application is now fully functional with a clean UI and complete CRUD operations!
