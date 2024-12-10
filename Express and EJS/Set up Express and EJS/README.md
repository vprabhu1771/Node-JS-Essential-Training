To set up partials in Node.js with EJS, you can follow these steps:

### 1. Install EJS
First, make sure you have EJS installed in your project:

```bash
npm install ejs
```

### 2. Set up Express and EJS
If you haven’t already, set up your Express application to use EJS as the template engine.

```js
const express = require('express');
const app = express();

// Set EJS as the view engine
app.set('view engine', 'ejs');

// Serve static files (like CSS, JS, images)
app.use(express.static('public'));

// Define a basic route
app.get('/', (req, res) => {
    res.render('index');
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});
```

### 3. Create the Partials Directory
Inside your `views` folder, create a `partials` directory where you will store your reusable partial EJS files.

```
/views
    /partials
        header.ejs
        footer.ejs
    index.ejs
```

### 4. Create a Partial (e.g., `header.ejs`)
```html
<!-- views/partials/header.ejs -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><%= title %></title>
    <link rel="stylesheet" href="/styles.css">
</head>
<body>
    <header>
        <h1>My Website Header</h1>
        <nav>
            <ul>
                <li><a href="/">Home</a></li>
                <li><a href="/about">About</a></li>
            </ul>
        </nav>
    </header>
```

### 5. Include Partials in Your Main View (e.g., `index.ejs`)
```html
<!-- views/index.ejs -->
<%- include('partials/header') %>

<main>
    <h2>Welcome to the homepage!</h2>
    <p>This is the content of the homepage.</p>
</main>

<%- include('partials/footer') %>
```

### 6. Create Another Partial (e.g., `footer.ejs`)
```html
<!-- views/partials/footer.ejs -->
<footer>
    <p>&copy; 2024 My Website</p>
</footer>
</body>
</html>
```

### 7. Using Partials with Data
If you need to pass data (like a page title) from your routes to the partials, you can do it like this:

```js
app.get('/', (req, res) => {
    res.render('index', { title: 'Home Page' });
});
```

### Conclusion
This setup allows you to reuse common elements (like headers and footers) across multiple pages, making it easier to maintain your templates.