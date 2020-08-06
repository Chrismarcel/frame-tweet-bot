const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs').promises;
const { parse } = require('twemoji-parser');
const path = require('path');

const ASSETS_DIR = path.join(`${__dirname}`, '../../public/assets');

class FrameGenerator {
  constructor(tweet) {
    this.FONT_SIZE = 32;
    this.OFFSET_TEXT_LEFT = 0;
    this.OFFSET_TEXT_TOP = 0;
    this.TWEET = tweet;
  }

  async getFrameImage() {
    try {
      const frameImage = await fs.readFile(
        `${ASSETS_DIR}/img/wooden-frame.png`
      );
      return frameImage;
    } catch (error) {
      throw new Error(error);
    }
  }

  drawEmojiOnPositions(emojiData) {
    const emojis = [];
    emojiData.forEach((emojiPositions) => {
      const { row, url, indices, isEmojiLastCharOnLine } = emojiPositions;
      const EMOJI_HEIGHT = 34;
      const EMOJI_WIDTH = 34;

      let marginLeft = 0;
      // Position emoji properly at the end of text
      // For weird reasons, if emoji is last, it overlaps with parts of text
      if (isEmojiLastCharOnLine) {
        marginLeft = 38;
      }

      // 13.5 = Assumed value of each character width
      const offsetX = this.OFFSET_TEXT_LEFT + 13.5 * indices[0] + marginLeft;
      const offsetY = this.LINE_GAP * row + this.OFFSET_TEXT_TOP;

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

  parseEmoji(text) {
    // Node-Canvas doesn't support emoji's for now
    // And other alternatives don't support multiline strings
    // Hence, we need to manually parse the text and determine the positions of the emoji

    const linesOfText = text.split('\n');
    const emojiData = [];
    linesOfText.forEach((line, index) => {
      // Check if there's an emoji on a line
      const parsedLine = parse(line);
      parsedLine.row = index + 1;
      const emojisPresent = Array.isArray(parsedLine);
      if (emojisPresent && parsedLine.length > 0) {
        parsedLine.forEach((emojiObj) => {
          const emojiDetails = {
            ...emojiObj,
            row: index + 1,
            isEmojiLastCharOnLine: line.length - 1 <= emojiObj.indices[1],
            isEmojiFirstCharOnLine: emojiObj.indices[0] === 0,
          };
          emojiData.push(emojiDetails);
        });
      }
    });
    const textWithoutEmoji = linesOfText.join('\n');
    return { frameText: textWithoutEmoji, emojiData };
  }

  breakTweetIntoLines() {
    const str = this.TWEET;
    const formattedStr = str.replace(/\n+/g, ' '); // Convert all new line characters to spaces
    const STR_LENGTH = formattedStr.length;
    const CHARACTERS_PER_LINE = 33; // Limit characters per line to 33 characters

    let parsedText = '';
    let lineStartIndex = 1;
    let lineEndIndex = CHARACTERS_PER_LINE;

    if (formattedStr.length <= CHARACTERS_PER_LINE) {
      parsedText = formattedStr;
    } else {
      for (let charIndex = 0; charIndex < STR_LENGTH; charIndex++) {
        parsedText += formattedStr[charIndex];
        if (charIndex === lineEndIndex && formattedStr[lineEndIndex] === ' ') {
          parsedText += `\n`;
          lineStartIndex++;
          lineEndIndex = CHARACTERS_PER_LINE * lineStartIndex;
        } else if (charIndex === lineEndIndex && lineEndIndex !== ' ') {
          lineEndIndex++;
        }
      }
    }

    const { frameText, emojiData } = this.parseEmoji(parsedText);
    return { linesOfText: lineStartIndex, frameText, emojiData };
  }

  async frameTweet() {
    try {
      registerFont(`${ASSETS_DIR}/fonts/Eczar-SemiBold.ttf`, {
        family: 'sans-serif',
      });

      const frameImage = await this.getFrameImage();
      const image = await loadImage(frameImage);
      this.CANVAS_WIDTH = image.width;
      this.CANVAS_HEIGHT = image.height;

      const canvas = createCanvas(this.CANVAS_WIDTH, this.CANVAS_HEIGHT);
      const context = canvas.getContext('2d');
      this.CONTEXT = context;

      this.CONTEXT.drawImage(
        image,
        0,
        0,
        this.CANVAS_WIDTH,
        this.CANVAS_HEIGHT
      );

      const { frameText, linesOfText, emojiData } = this.breakTweetIntoLines();
      const marginBottom = 24; // Assume margin bottom of each line to be 20px
      const frameTextHeight = (this.FONT_SIZE + marginBottom) * linesOfText;
      const frameTextWidth = this.CONTEXT.measureText(frameText).width;

      this.CONTEXT.font = `bold ${this.FONT_SIZE}px Eczar`;
      this.CONTEXT.textAlign = 'left';
      this.CONTEXT.fillStyle = '#ffffff';

      // Center text vertically
      const textPositionY = this.CANVAS_HEIGHT / 2 - frameTextHeight / 2;
      const textPositionX = this.CANVAS_WIDTH / 2 - frameTextWidth / 2;

      this.CONTEXT.textBaseline = 'middle';
      this.OFFSET_TEXT_LEFT = textPositionX - frameTextWidth;
      this.CONTEXT.fillText(frameText, this.OFFSET_TEXT_LEFT, textPositionY);

      // OFFSET_TOP = Calculated distance between top of frame to beginning of first line of text
      // Had to tinker to arrive at the value 105 in order to adjust the vertical position of an emoji
      this.OFFSET_TEXT_TOP = textPositionY + this.FONT_SIZE - 105;
      // Assumed bottom margin between lines of text to be 24px
      this.LINE_GAP = this.FONT_SIZE + marginBottom;

      return new Promise((resolve, reject) => {
        // Draw emoji in given positions
        const emojis = this.drawEmojiOnPositions(emojiData);
        Promise.all(emojis)
          .then(() => resolve(canvas.toDataURL()))
          .catch((error) => reject(error));
      });
    } catch (error) {
      throw new Error(error);
    }
  }
}

module.exports = FrameGenerator;
