##  Node.js Rest API to send and receive messagem from WhatsApp - PART 1 
```
https://www.youtube.com/watch?v=aNzSXS5AkBg
```

```
npm i express dotenv whatsapp-web.js qrcode-terminal
```

`.env`
```env
HOST=192.168.1.211
PORT=3000
```

`routers\messageRouter.js`
```javascript
const express = require('express');
const router = new express.Router();

router.get('/', (req, res) => {
    res.send("Hello World");
});

module.exports = router;
```

`services\WhatsappClient.js`
```javascript
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const whatsappClient = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    },
    // Force the client to use a reliable remote cache source instead of local 
    webVersionCache: {
        type: 'remote',
        remotePath: 'https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html'
    }
});

whatsappClient.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
});

var myNumber;

whatsappClient.on('ready', () => {
    console.log('Client is ready!');

    // Get your own number
    myNumber = whatsappClient.info.wid.user; // Just the number without @c.us
    console.log('Your WhatsApp number:', myNumber);
    console.log('Full format for filtering:', `${myNumber}@c.us`);
    
    // You can also message yourself programmatically
    whatsappClient.sendMessage(`${myNumber}@c.us`, 'Bot is ready!');
});

const yourPhoneNumber = `${myNumber}@c.us`; // Replace with your number in international format

// Not Working
whatsappClient.on('message', (msg) => {
    
    if (msg.body == '!ping') {
        msg.reply('pong');
    }    
});

// 2. Attach your message event
//  This Working message_create
whatsappClient.on('message_create', (msg) => {
    if (msg.body === '!ping') {
        msg.reply('pong');
    }
    if (msg.body === 'call me') {
        msg.reply('ok');
    }
});

// Filter to only respond to messages from yourself
// whatsappClient.on('message', (msg) => {
//     const myNumber = whatsappClient.info.wid.user;
    
//     // Only respond if the message is from you
//     if (msg.author === `${myNumber}@c.us` || msg.from === `${myNumber}@c.us`) {
//         if (msg.body === '!ping') {
//             msg.reply('🏓 pong');
//         }
//     }
// });

whatsappClient.initialize();
module.exports = whatsappClient;
```

`server.js`
```javascript
require('dotenv').config();
const express = require('express');
const messageRouter = require('./routers/messageRouter');
const whatsappClient = require('./services/WhatsappClient');

const app = express();
app.use(express.json());
app.use(messageRouter);

const PORT = process.env.PORT || 3000;

const HOST = process.env.HOST || '0.0.0.0';

// Start the server
app.listen(PORT, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
});
```
