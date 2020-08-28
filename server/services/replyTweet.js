const { wrapTwitterErrors } = require('twitter-error-handler');
const FrameGenerator = require('./frameTweet');
const Twit = require('../config').twitInstance;

const replyTweet = async (tweetDetails, tweetId) => {
  const statusEndpoint = 'statuses/update';
  const uploadMediaEndpoint = 'media/upload';
  try {
    const base64ImgString = await new FrameGenerator(tweetDetails).frameTweet();
    const response = await Twit.post(uploadMediaEndpoint, {
      media_data: base64ImgString.split(',')[1],
      media_category: 'tweet_image',
    });

    const mediaId = response.data.media_id_string;

    if (mediaId) {
      await Twit.post(statusEndpoint, {
        in_reply_to_status_id: tweetId,
        status: `Test reply ${tweetDetails.user_handle}`,
        media_ids: [mediaId],
      });
    }
  } catch (error) {
    wrapTwitterErrors(statusEndpoint, error);
    wrapTwitterErrors(uploadMediaEndpoint, error);
  }
};

module.exports = replyTweet;
