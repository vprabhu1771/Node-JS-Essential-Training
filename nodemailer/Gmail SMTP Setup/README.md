To use **complete Gmail SMTP** with `nodemailer`, you need:

1. Correct SMTP host & port
2. App password (not your normal Gmail password)
3. Proper `.env` configuration
4. A working Express server

---

## ✅ Step 1: Enable Gmail App Password

1. Go to **Google** account settings
2. Enable **2-Step Verification**
3. Go to **App Passwords**
4. Generate password for:

   * App: Mail
   * Device: Windows (or Other)
5. Copy the 16-digit password

⚠️ Do NOT use your normal Gmail password.

---

## ✅ Step 2: Install Packages

```bash
npm init -y
npm install express nodemailer dotenv
```

---

## ✅ Step 3: Create `.env` File

```env
PORT=3000
EMAIL=yourgmail@gmail.com
PASSWORD=your_app_password_here
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
```

---

## ✅ Step 4: Complete Working Code (server.js)

```js
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');

const app = express();
app.use(express.json());

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false, // true for 465, false for 587
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

// Verify SMTP connection
transporter.verify(function (error, success) {
    if (error) {
        console.log("SMTP Error:", error);
    } else {
        console.log("SMTP Server is ready to send emails");
    }
});

// Test route
app.get("/send-mail", async (req, res) => {
    try {
        let info = await transporter.sendMail({
            from: `"Test Mail" <${process.env.EMAIL}>`,
            to: "receiver@gmail.com",
            subject: "Hello from Node.js",
            text: "This is a test email",
            html: "<h2>Email sent successfully 🚀</h2>"
        });

        res.send("Email sent: " + info.response);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error sending email");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
```

---

## ✅ Step 5: Run Server

```bash
node server.js
```

Then open:

```
http://localhost:3000/send-mail
```
---

## 📌 Gmail SMTP Settings Summary

| Setting  | Value                 |
| -------- | --------------------- |
| Host     | smtp.gmail.com        |
| Port     | 587                   |
| Secure   | false                 |
| SSL Port | 465 (if secure: true) |

---

If you want:

* ✅ Send dynamic email (POST request)
* ✅ HTML email template
* ✅ Attachment support
* ✅ Production-ready structure (MVC)

Tell me — I’ll build it for you.
