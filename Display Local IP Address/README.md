To display the server's local IP address in `index.html`, create an API endpoint in Express and fetch it from the browser.

### server.js

```javascript
require('dotenv').config();

const express = require('express');
const path = require('path');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

function getLocalIP() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }
    return 'Not Found';
}

app.get('/api/ip', (req, res) => {
    res.json({
        ip: getLocalIP()
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://${getLocalIP()}:${port}`);
});
```

---

### views/index.html

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>QR</title>
</head>
<body>

    <h1>Server IP Address</h1>
    <h2 id="ip">Loading...</h2>

    <script>
        fetch('/api/ip')
            .then(response => response.json())
            .then(data => {
                document.getElementById('ip').innerText = data.ip;
            })
            .catch(error => {
                document.getElementById('ip').innerText = 'Unable to load IP';
            });
    </script>

</body>
</html>
```

### Output

If your PC IP is `192.168.1.100`, the page will show:

```text
Server IP Address
192.168.1.100
```

You can also display a QR code for the URL:

```html
<img id="qr">

<script>
fetch('/api/ip')
.then(res => res.json())
.then(data => {
    const url = `http://${data.ip}:3000`;

    document.getElementById('qr').src =
      `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
});
</script>
```

This will generate a QR code that mobile devices on the same Wi-Fi network can scan to open your Node.js application.


###

Your current code returns the **first non-internal IPv4 address**, which is picking up:

```text
vEthernet (Default Switch) -> 172.27.32.1
```

Instead, filter out Hyper-V virtual adapters (`vEthernet`) and prefer the actual Ethernet/Wi-Fi adapter.

```javascript
const os = require('os');

function getLocalIP() {
    const interfaces = os.networkInterfaces();

    for (const name of Object.keys(interfaces)) {

        // Skip virtual adapters
        if (
            name.includes('vEthernet') ||
            name.includes('Virtual') ||
            name.includes('VMware') ||
            name.includes('Hyper-V')
        ) {
            continue;
        }

        for (const iface of interfaces[name]) {
            if (
                iface.family === 'IPv4' &&
                !iface.internal
            ) {
                return iface.address;
            }
        }
    }

    return 'IP Not Found';
}

console.log(getLocalIP());
```

Output:

```text
192.168.1.211
```

### More reliable Windows solution

If you specifically want the adapter named `Ethernet`:

```javascript
const os = require('os');

function getEthernetIP() {
    const interfaces = os.networkInterfaces();

    if (interfaces['Ethernet']) {
        const ethernet = interfaces['Ethernet'];

        for (const iface of ethernet) {
            if (iface.family === 'IPv4' && !iface.internal) {
                return iface.address;
            }
        }
    }

    return 'Not Found';
}

console.log(getEthernetIP());
```

### Debug all adapters

Run this once to see the exact adapter names Node.js sees:

```javascript
const os = require('os');

console.log(os.networkInterfaces());
```

This will show something like:

```text
{
  Ethernet: [
    {
      address: '192.168.1.211',
      family: 'IPv4'
    }
  ],
  'vEthernet (Default Switch)': [
    {
      address: '172.27.32.1',
      family: 'IPv4'
    }
  ]
}
```

Then you can explicitly select `"Ethernet"` and display `192.168.1.211` in your HTML page.
