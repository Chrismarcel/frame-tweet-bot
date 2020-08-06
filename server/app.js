const express = require('express');
const FrameGenerator = require('./services/frameTweet');
const DuplexStream = require('stream').Duplex;

const app = express();

const PORT = process.env.PORT || 4444;

const mockTweet = `I have a 🔥 friend that's a software\nengineering god that takes 💋 out the time to\ngive me DETAILED 😊 explanations of computing\nsystems ⚡️ and parts I wish I could\nsteal his brain this 🤗 stuff is phenomenal!`;

app.get('/', async (req, res) => {
  try {
    const base64ImgString = await new FrameGenerator(mockTweet).frameTweet();

    const framedTweet = Buffer.from(base64ImgString.split(',')[1], 'base64');

    // https://www.derpturkey.com/buffer-to-stream-in-node/
    let imgStream = new DuplexStream();
    imgStream.push(framedTweet);
    imgStream.push(null);

    res.writeHead(200, {
      'Content-Type': 'image/png',
      'Content-Length': framedTweet.length,
    });

    imgStream.on('end', () => {
      res.end();
    });

    imgStream.pipe(res);
  } catch (error) {
    console.log(error);
  }
});

app.listen(PORT, () => `Running server at: ${PORT}`);
