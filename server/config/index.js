const dotenv = require('dotenv');
dotenv.config();

const config = {
  PORT: process.env.PORT,
  TWITTER_SIGNIN_CONFIG: {
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
  },
};

module.exports = config;
