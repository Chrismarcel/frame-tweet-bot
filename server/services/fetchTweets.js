const Twit = require('twit');
const config = require('../config');
const { wrapTwitterErrors } = require('twitter-error-handler');

const T = new Twit(config.TWITTER_SIGNIN_CONFIG);

const fetchMentions = async () => {
  const endpoint = 'statuses/mentions_timeline';
  try {
    const mentions = await T.get(endpoint, {
      count: 200,
      include_entities: false,
    });
    return mentions;
  } catch (error) {
    wrapTwitterErrors(endpoint, error);
  }
};

const getTweetToBeFramed = async (id) => {
  const endpoint = `statuses/show.json`;
  try {
    const targetTweet = await T.get(endpoint, {
      id,
      trim_user: true,
      include_entities: false,
      tweet_mode: 'extended',
    });
    return targetTweet.full_text;
  } catch (error) {
    wrapTwitterErrors(endpoint, error);
  }
};

module.exports = { fetchMentions, getTweetToBeFramed };
