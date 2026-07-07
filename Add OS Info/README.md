Here's the updated code with OS info and app_name added:

```javascript
const os = require('os');
const packageJson = require('./package.json'); // Assuming you have a package.json file

app.get('/developer', async (req, res) => {
    const osInfo = {
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpus: os.cpus().length,
        totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        uptime: `${(os.uptime() / 60 / 60).toFixed(2)} hours`
    };

    res.status(200).json({
        message: 'Developer Check OK',
        app_name: packageJson.name || 'Unknown App',
        os_info: osInfo
    });
});
```

**Alternative version without package.json:**

```javascript
const os = require('os');

app.get('/developer', async (req, res) => {
    const osInfo = {
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpus: os.cpus().length,
        totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        uptime: `${(os.uptime() / 60 / 60).toFixed(2)} hours`
    };

    res.status(200).json({
        message: 'Developer Check OK',
        app_name: 'My Express App', // Hardcoded or from environment variable
        os_info: osInfo
    });
});
```

**Or using environment variables:**

```javascript
const os = require('os');

app.get('/developer', async (req, res) => {
    const osInfo = {
        platform: os.platform(),
        release: os.release(),
        type: os.type(),
        arch: os.arch(),
        hostname: os.hostname(),
        cpus: os.cpus().length,
        totalMemory: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        freeMemory: `${(os.freemem() / 1024 / 1024 / 1024).toFixed(2)} GB`,
        uptime: `${(os.uptime() / 60 / 60).toFixed(2)} hours`
    };

    res.status(200).json({
        message: 'Developer Check OK',
        app_name: process.env.APP_NAME || 'My Express App',
        os_info: osInfo
    });
});
```

The response will look like:
```json
{
    "message": "Developer Check OK",
    "app_name": "My Express App",
    "os_info": {
        "platform": "linux",
        "release": "5.15.0-86-generic",
        "type": "Linux",
        "arch": "x64",
        "hostname": "ubuntu-server",
        "cpus": 8,
        "totalMemory": "15.67 GB",
        "freeMemory": "8.23 GB",
        "uptime": "72.45 hours"
    }
}
```
