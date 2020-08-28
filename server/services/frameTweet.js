const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs').promises;
const path = require('path');
const { combineTextWithEmojis } = require('../helpers');

const PUBLIC_DIR = path.join(`${__dirname}`, '../../public');

class FrameGenerator {
  constructor({ tweet, profile_img, user_handle, tweet_date }) {
    this.FONT_SIZE = 20;
    this.OFFSET_TEXT_TOP = 0;
    this.TWEET_OBJ = { tweet, profile_img, user_handle, tweet_date };
    this.CANVAS_WIDTH = 1024;
    this.CANVAS_HEIGHT = 512;
  }

  async fetchImage(imageName) {
    try {
      const image = await fs.readFile(`${PUBLIC_DIR}/img/${imageName}`);
      return image;
    } catch (error) {
      throw new Error(error);
    }
  }

  async getRandomFrameBackground() {
    const frames = await fs.readdir(`${PUBLIC_DIR}/img/bg`);
    const randomIndex = Math.floor(Math.random() * frames.length);
    return frames[randomIndex];
  }

  drawTextOverlay() {
    this.CONTEXT.fillStyle = '#ffffff';
    // y = (Canvas Height - Height of Overlay Rect) / 2
    // x = (Canvas Width - Width of Overlay Rect) / 2
    this.CONTEXT.fillRect(70, 84.5, 884, 343);
  }

  drawUserAvatar() {
    const { user_handle, profile_img } = this.TWEET_OBJ;
    const PROFILE_IMG_HEIGHT = 48;
    const PROFILE_IMG_WIDTH = 48;
    this.CONTEXT.font = 'bold 24px Eczar';
    this.CONTEXT.fillStyle = '#DAC9C9';

    const userHandleWidth = this.CONTEXT.measureText(user_handle).width;
    const offsetX = this.CANVAS_WIDTH - this.TEXT_BLOCK_WIDTH - userHandleWidth;

    return loadImage(profile_img)
      .then((profile_img) => {
        this.CONTEXT.drawImage(
          profile_img,
          offsetX - 210,
          this.OFFSET_TEXT_TOP + this.TEXT_BLOCK_HEIGHT + 12,
          PROFILE_IMG_WIDTH,
          PROFILE_IMG_HEIGHT
        );
      })
      .catch((error) => {
        throw new Error(error);
      });
  }

  drawUsername() {
    const { user_handle, tweet_date } = this.TWEET_OBJ;
    this.CONTEXT.font = 'bold 24px Eczar';
    this.CONTEXT.fillStyle = '#DAC9C9';
    const marginRight = 140;

    const userHandleWidth = this.CONTEXT.measureText(user_handle).width;
    const offsetX = this.CANVAS_WIDTH - this.TEXT_BLOCK_WIDTH - userHandleWidth;

    this.CONTEXT.fillText(
      user_handle,
      offsetX - marginRight,
      this.OFFSET_TEXT_TOP + this.TEXT_BLOCK_HEIGHT + 25
    );

    this.CONTEXT.font = 'bold 18px Eczar';
    this.CONTEXT.fillStyle = '#B2A0A0';
    this.CONTEXT.fillText(
      tweet_date,
      offsetX - marginRight,
      this.OFFSET_TEXT_TOP + this.TEXT_BLOCK_HEIGHT + 55
    );
  }

  drawEmojis(emojiData) {
    const emojis = [];
    emojiData.forEach((emojiPositions) => {
      const { rowIndex, url, textWidth } = emojiPositions;

      const EMOJI_HEIGHT = 22;
      const EMOJI_WIDTH = 22;

      const offsetX = this.OFFSET_TEXT_LEFT + textWidth;
      const offsetY = this.LINE_GAP * rowIndex + this.OFFSET_TEXT_TOP - 48;

      const emoji = loadImage(url).then((emoji) => {
        this.CONTEXT.drawImage(
          emoji,
          offsetX,
          offsetY,
          EMOJI_WIDTH,
          EMOJI_HEIGHT
        );
      });
      emojis.push(emoji);
    });

    return emojis;
  }

  async frameTweet() {
    try {
      registerFont(`${PUBLIC_DIR}/fonts/Eczar-SemiBold.ttf`, {
        family: 'sans-serif',
      });

      const canvas = createCanvas(this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
      const context = canvas.getContext('2d');
      this.CONTEXT = context;

      const patternName = await this.getRandomFrameBackground();
      const frameImage = await this.fetchImage(`bg/${patternName}`);
      const frameBackground = await loadImage(frameImage);

      this.CONTEXT.drawImage(
        frameBackground,
        0,
        0,
        this.CANVAS_WIDTH,
        this.CANVAS_HEIGHT
      );

      this.drawTextOverlay();

      this.CONTEXT.font = `normal ${this.FONT_SIZE}px Eczar`;
      this.CONTEXT.textAlign = 'left';
      this.CONTEXT.fillStyle = '#000000';

      const {
        textWithoutEmojis,
        numLinesOfText,
        emojiData,
      } = combineTextWithEmojis({
        context: this.CONTEXT,
        text: this.TWEET_OBJ.tweet,
      });
      const marginBottom = 15; // Assume margin bottom of each line to be 15px

      this.TEXT_BLOCK_HEIGHT = (this.FONT_SIZE + marginBottom) * numLinesOfText;
      this.TEXT_BLOCK_WIDTH = this.CONTEXT.measureText(textWithoutEmojis).width;

      // Center text vertically
      this.OFFSET_TEXT_TOP =
        this.CANVAS_HEIGHT / 2 - this.TEXT_BLOCK_HEIGHT / 2;

      // Offset x of overlay rect is 70px
      // plus 39px from left of text overlay rect
      this.OFFSET_TEXT_LEFT = 109;

      this.CONTEXT.textBaseline = 'middle';
      this.CONTEXT.fillText(
        textWithoutEmojis,
        this.OFFSET_TEXT_LEFT,
        this.OFFSET_TEXT_TOP
      );

      this.LINE_GAP = this.FONT_SIZE + marginBottom;

      this.drawUsername();

      return new Promise((resolve, reject) => {
        // Draw emoji in given positions
        const emojis = this.drawEmojis(emojiData);
        const profileImage = this.drawUserAvatar();
        // Since we are fetching emojis and profile images remotely
        // We'd draw the final image only when all pending promises are resolved.
        Promise.all([...emojis, profileImage])
          .then(() => resolve(canvas.toDataURL()))
          .catch((error) => reject(error));
      });
    } catch (error) {
      throw new Error(error);
    }
  }
}

module.exports = FrameGenerator;
