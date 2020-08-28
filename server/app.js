const express = require('express');
const FrameGenerator = require('./services/frameTweet');
const DuplexStream = require('stream').Duplex;
const fetchMentions = require('./services/fetchTweets');

const mockTweet1 = `I have a friend that's a software\nengineering 😡 god that takes 💋 out the time to\ngive me 🔥 explanations of computing\nsystems ⚡️ and parts I wish I could\nsteal his brain this 🤗 stuff is phenomenal!`;
const mockTweet2 = `So I'm trying to test this random tweet 👏🏽 with emojis to see if it frames properly too 😊. Hopefully it works, fingers crossed 🤞. If it correctly renders this, then we good to go. 🤗 this stuff is phenomenal!`;
const mockTweetObj = {
  tweet: mockTweet2,
  profile_img: `https://pbs.twimg.com/profile_images/1299969177936166913/6IvqB49J_normal.jpg`,
  user_handle: '@Chrismarcel',
  tweet_date: '23/07/2020',
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
