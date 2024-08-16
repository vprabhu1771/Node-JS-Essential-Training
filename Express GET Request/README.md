# Express GET Request
 
To install the necessary dependencies for your Express server that generates barcodes, you can use the following command:

Here's a brief description of each package:

- `express`: The web framework for handling HTTP requests and responses.

```
npm i express
```

`.env`
```
PORT=3000
```

`server.js`
```
const express = require('express');
const { createCanvas } = require('canvas');
const Barcode = require('jsbarcode');

const app = express();

const PORT = process.env.PORT || 3000;

// Create a barcode endpoint
app.get('/barcode/:text', (req, res) => {
    // Extract the text parameter from the URL
    const barcodeText = req.params.text;

    // Print the extracted text to the console
    console.log(barcodeText);

    // Send a response to the client (optional)
    res.send(`Barcode text received: ${barcodeText}`);
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
```