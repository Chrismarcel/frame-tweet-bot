const dotenv = require('dotenv');
const Twit = require('twit');
dotenv.config();

const config = {
  PORT: process.env.PORT,
  TWITTER_SIGNIN_CONFIG: {
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
    access_token: process.env.TWITTER_ACCESS_TOKEN,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  },
};

const twitInstance = new Twit(config.TWITTER_SIGNIN_CONFIG);

module.exports = config;
module.exports.twitInstance = twitInstance;
