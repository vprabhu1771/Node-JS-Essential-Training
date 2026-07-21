```
https://www.npmjs.com/package/node-cron
```

Here's a simple `server.js` file using `node-cron` with an HTTP server:

```javascript
import cron from 'node-cron';
import http from 'http';

// Schedule a task to run every minute
cron.schedule('* * * * *', () => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Running scheduled task every minute`);
});

// Create a simple HTTP server
const server = http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Server is running! Check console for cron job logs.');
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Cron job scheduled to run every minute');
});
```

## Setup Instructions

1. **Initialize project:**
```bash
npm init -y
```

2. **Install node-cron:**
```bash
npm install node-cron
```

3. **Run the server:**
```bash
node server.js
```

## Additional Useful Cron Patterns

```javascript
// Every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('Running every 5 minutes');
});

// Every hour at minute 0
cron.schedule('0 * * * *', () => {
  console.log('Running at the start of every hour');
});

// Every day at midnight
cron.schedule('0 0 * * *', () => {
  console.log('Running daily at midnight');
});

// Every Monday at 9:00 AM
cron.schedule('0 9 * * 1', () => {
  console.log('Running every Monday at 9 AM');
});
```

## With ES Modules (package.json)
Make sure your `package.json` has:
```json
{
  "type": "module"
}
```

## Alternative: CommonJS Syntax
If you prefer CommonJS:
```javascript
const cron = require('node-cron');
const http = require('http');

cron.schedule('* * * * *', () => {
  console.log('running a task every minute');
});

// ... rest of server code
```

This creates a lightweight server that logs messages every minute while also serving HTTP requests.
