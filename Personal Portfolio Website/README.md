# Node-JS
 
1. **Commands**

To install the necessary dependencies for your Express server that generates barcodes, you can use the following command:

```
npm i dotenv
```

```
npm i express 
```

```
npm i nodemailer 
```

```
npm i nodemailer 
```

2. **Folder Setup**

Folder Setup

```
under project_name -> public

```

```
under project_name -> public -> css
```

```
under project_name -> public -> images
```

```
under project_name -> views
```

File Setup

```
under project_name -> .env
```

```
under project_name -> views -> index.ejs
```

```
under project_name -> public -> css -> styles.css
```

```
under project_name -> app.js
```

3. open `.env`

```
PORT=3000
EMAIL_USER=your-email@example.com
EMAIL_PASS=your-email-password
```

4. open `app.js`

```
const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

// Set up EJS view engine
app.set('view engine', 'ejs');

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/contact', (req, res) => {
    const { name, email, message } = req.body;

    // Setup nodemailer transport
    const transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: email,
        to: process.env.EMAIL_USER,
        subject: `New Contact Form Submission from ${name}`,
        text: message
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            return console.log(error);
        }
        console.log('Message sent: %s', info.messageId);
        res.redirect('/');
    });
});

// Server setup
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
```

5. open `index.ejs`

```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Personal Portfolio</title>
    <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
    <header>
        <h1>Welcome to My Portfolio</h1>
        <p>This is a basic personal portfolio website built with Node.js and Express.js.</p>
    </header>

    <section id="contact">
        <h2>Contact Me</h2>
        <form action="/contact" method="POST">
            <label for="name">Name:</label>
            <input type="text" id="name" name="name" required>

            <label for="email">Email:</label>
            <input type="email" id="email" name="email" required>

            <label for="message">Message:</label>
            <textarea id="message" name="message" rows="5" required></textarea>

            <button type="submit">Send</button>
        </form>
    </section>
</body>
</html>
```

6. **CSS Styles** `public/css/styles.css`:

```
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #f4f4f4;
    color: #333;
}

header {
    text-align: center;
    padding: 20px;
    background-color: #333;
    color: white;
}

section {
    padding: 20px;
    margin: 20px;
    background-color: white;
    border-radius: 5px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
}

form {
    display: flex;
    flex-direction: column;
}

label {
    margin-top: 10px;
}

input, textarea {
    padding: 10px;
    margin-top: 5px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

button {
    margin-top: 15px;
    padding: 10px;
    border: none;
    background-color: #333;
    color: white;
    cursor: pointer;
}

button:hover {
    background-color: #555;
}
```

7. **Run Server**
### Running the Project

1. **Start the Server**:
   Run the following command in your terminal:

   ```bash
   node app.js
   ```

2. **Access the Website**:
   Open your browser and go to `http://localhost:3000` to see your portfolio website.

### Notes:

- **Email Configuration**: Replace `EMAIL_USER` and `EMAIL_PASS` in the `.env` file with your email credentials. Ensure that your email provider allows less secure apps or uses application-specific passwords if needed.
- **Security**: For production use, never store sensitive information in your source code. Use environment variables securely.
- **Extensions**: Add more sections to your portfolio (e.g., About, Projects, Skills) to expand it. You can also integrate a database to store messages instead of sending them via email.