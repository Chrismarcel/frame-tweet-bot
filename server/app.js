const express = require('express');
const FrameGenerator = require('./services/frameTweet');
const DuplexStream = require('stream').Duplex;
const fetchMentions = require('./services/fetchTweets');

const mockTweet = `So I'm trying to test this random tweet 👏🏽 with emojis to see if it frames properly too 😊. Hopefully it works, fingers crossed 🤞. If it correctly renders this, then we good to go. 🤗 this stuff is phenomenal!`;
const mockTweetObj = {
  tweet: mockTweet,
  profile_img: `https://pbs.twimg.com/profile_images/1353202161438646273/rVdAwRd7_400x400.jpg`,
  user_handle: '@Chrismarcel',
  tweet_date: '23/07/2020',
  name: 'Chrismarcel James',
};

const app = express();
const PORT = process.env.PORT || 4444;

app.get('/', async (req, res) => {
  try {
    const base64ImgString = await new FrameGenerator(mockTweetObj).frameTweet();
    const framedTweet = Buffer.from(base64ImgString.split(',')[1], 'base64');

    await fetchMentions();

    // Creating streams from Buffer
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
