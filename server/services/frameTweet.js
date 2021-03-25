const { createCanvas, loadImage, Image, registerFont } = require('canvas');
const fs = require('fs').promises;
const path = require('path');
const { combineTextWithEmojis } = require('../helpers');

const PUBLIC_DIR = path.join(`${__dirname}`, '../../public');

const FONT_NAME = 'Eczar';
const FONT_DIRECTORY = `${PUBLIC_DIR}/fonts/Eczar.ttf`;

const COLORS = {
  BLACK: '#000000',
  WHITE: '#ffffff',
};

// TODO: Implement error handling, we could find a way to batch failed operations
// TODO: So we could retry the operations.

class FrameGenerator {
  constructor(tweetObject) {
    this.FONT_SIZE = 20;
    this.TWEET_OBJ = tweetObject;
    this.CANVAS_WIDTH = 1024;
    this.CANVAS_HEIGHT = 512;
    this.PROFILE_IMG_HEIGHT = 48;
    this.PROFILE_IMG_WIDTH = 48;
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

  drawTextBackground() {
    this.CONTEXT.fillStyle = COLORS.WHITE;
    const TEXT_BG_HEIGHT = 343;
    const TEXT_BG_WIDTH = 884;
    // x = (Canvas Width - Width of TEXT_BG Rect) / 2 = 70
    // y = (Canvas Height - Height of TEXT_BG Rect) / 2 = 84.5
    const TEXT_BG_OFFSET_X = 70;
    const TEXT_BG_OFFSET_Y = 84.5;
    this.CONTEXT.fillRect(
      TEXT_BG_OFFSET_X,
      TEXT_BG_OFFSET_Y,
      TEXT_BG_WIDTH,
      TEXT_BG_HEIGHT
    );
  }

  async drawUserAvatar() {
    try {
      const { profile_img } = this.TWEET_OBJ;
      const canvas = createCanvas(48, 48);
      const context = canvas.getContext('2d');

      const radius = this.PROFILE_IMG_WIDTH / 2;

      context.arc(24, 24, radius, 0, 2 * Math.PI);
      context.clip();

      const profileImage = await loadImage(profile_img);
      context.imageSmoothingEnabled = false;
      context.patternQuality = 'best'
      context.quality = 'best'

      context.drawImage(
        profileImage,
        0,
        0,
        this.PROFILE_IMG_WIDTH,
        this.PROFILE_IMG_HEIGHT
      );

      return canvas.toDataURL('image/png', 1);
    } catch (error) {
      throw new Error(error);
    }
  }

  drawUsername() {
    const { name, user_handle, tweet_date } = this.TWEET_OBJ;
    this.CONTEXT.font = `${this.FONT_SIZE}px ${FONT_NAME}`;
    this.CONTEXT.fillStyle = COLORS.BLACK;

    const offsetX = this.OFFSET_LEFT + this.PROFILE_IMG_WIDTH + 15;

    this.CONTEXT.fillText(name, offsetX, this.OFFSET_TOP);

    this.CONTEXT.font = `14px ${FONT_NAME}`;
    this.CONTEXT.fillStyle = COLORS.BLACK;
    this.CONTEXT.fillText(
      `${user_handle} . ${tweet_date}`,
      offsetX,
      this.OFFSET_TOP + 25
    );
  }

  drawEmojis(emojiData, emojiMarginTop = 15) {
    const emojis = [];
    emojiData.forEach((emojiPositions) => {
      const { rowIndex, url, textWidth } = emojiPositions;

      const EMOJI_HEIGHT = 22;
      const EMOJI_WIDTH = 22;

      const offsetEmojiTop = rowIndex === 1 ? 15 : emojiMarginTop;

      const offsetLeft = this.OFFSET_LEFT + textWidth;
      const marginTop = this.TWEET_MARGIN_TOP + offsetEmojiTop * rowIndex;
      const offsetTop = this.LINE_GAP * rowIndex + marginTop;

      const emoji = loadImage(url).then((emoji) => {
        this.CONTEXT.drawImage(
          emoji,
          offsetLeft,
          offsetTop,
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
      registerFont(`${FONT_DIRECTORY}`, {
        family: 'sans-serif',
      });

      const canvas = createCanvas(this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
      this.CONTEXT = canvas.getContext('2d');

      this.CONTEXT.imageSmoothingEnabled = false;
      this.CONTEXT.patternQuality = 'best'
      this.CONTEXT.quality = 'best'

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

      this.drawTextBackground();

      this.CONTEXT.font = `${this.FONT_SIZE}px ${FONT_NAME}`;
      this.CONTEXT.textAlign = 'left';
      this.CONTEXT.fillStyle = COLORS.BLACK;

      const { textWithoutEmojis, emojiData } = combineTextWithEmojis({
        context: this.CONTEXT,
        text: this.TWEET_OBJ.tweet,
      });

      // Offset-Y of text overlay rect is 84.5px
      // plus 62px from top of text overlay rect
      this.OFFSET_TOP = 146.5;

      // Offset-X of text overlay rect is 70px
      // plus 39px from left of text overlay rect
      this.OFFSET_LEFT = 109;
      this.CONTEXT.textBaseline = 'middle';

      this.TWEET_MARGIN_TOP = this.OFFSET_TOP + 25;

      const offsetTop = this.PROFILE_IMG_HEIGHT + this.TWEET_MARGIN_TOP;
      this.CONTEXT.fillText(textWithoutEmojis, this.OFFSET_LEFT, offsetTop);

      this.LINE_GAP = this.FONT_SIZE * 1;

      this.drawUsername();

      return new Promise((resolve, reject) => {
        // Draw emoji in given co-ordinates
        const emojis = this.drawEmojis(emojiData);
        const profileImage = this.drawUserAvatar()
          .then((avatar) => {
            const img = new Image();
            img.onload = () => {
              const offsetTop = this.OFFSET_TOP - 15;
              this.CONTEXT.drawImage(img, this.OFFSET_LEFT, offsetTop);
            };
            img.onerror = (error) => {
              throw new Error(error);
            };
            img.src = avatar;
          })
          .catch((error) => {
            console.log(error);
            throw new Error(error);
          });
        // Since we are fetching emojis and profile images remotely
        // We'd draw the final image only when all pending promises are resolved.
        Promise.all([...emojis, profileImage])
          .then(() => resolve(canvas.toDataURL('image/png', 1)))
          .catch((error) => reject(error));
      });
    } catch (error) {
      throw new Error(error);
    }
  }
}

module.exports = FrameGenerator;
