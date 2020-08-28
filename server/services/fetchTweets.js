const Twit = require('../config').twitInstance;
const { wrapTwitterErrors } = require('twitter-error-handler');
const replyTweet = require('./replyTweet');
const { formatDate } = require('../helpers');

const getTweetToBeFramed = async (id) => {
  const endpoint = `statuses/show/:id`;
  try {
    const targetTweet = await Twit.get(endpoint, {
      id,
      include_entities: false,
      tweet_mode: 'extended',
    });
    const tweetData = targetTweet.data;

    return {
      tweet: tweetData.full_text || '',
      profile_img: tweetData.user.profile_image_url_https,
      user_handle: `@${tweetData.user.screen_name}`,
      tweet_date: formatDate(tweetData.created_at),
    };
  } catch (error) {
    wrapTwitterErrors(endpoint, error);
  }
};

const fetchMentions = async () => {
  try {
    const stream = Twit.stream('statuses/filter', { track: '@BlockTweep' });
    stream.on('tweet', async (tweet) => {
      const { in_reply_to_status_id_str: tweetId } = tweet;
      const tweetDetails = await getTweetToBeFramed(tweetId);
      replyTweet(tweetDetails, tweetId);
    });
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = fetchMentions;
