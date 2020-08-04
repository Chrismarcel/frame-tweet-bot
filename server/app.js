const express = require('express');
const frameImage = require('../server/services/frameImage');

const app = express();

const PORT = process.env.PORT || 4444;

app.get('/', async (req, res) => {
  const base64String = await frameImage();
  const framedImage = Buffer.from(base64String.split(',')[1], 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/png',
    'Content-Length': framedImage.length,
  });
  res.end(framedImage);
});

app.listen(PORT, () => `Running server at: ${PORT}`);
