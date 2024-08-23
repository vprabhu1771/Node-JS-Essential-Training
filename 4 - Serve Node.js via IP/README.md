# Serve Node.js via IP
 

```
npm i express
```

```
npm i dotenv
```

`.env`
```
PORT=3000
HOST=192.168.1.211
```

`server.js`
```
require('dotenv').config();

const express = require('express');

const app = express();

const port = process.env.PORT || 3000;
const host = process.env.HOST || '0.0.0.0';

app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});
```

![Image](4.PNG)