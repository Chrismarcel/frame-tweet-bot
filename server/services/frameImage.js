const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs').promises;

const getRandomImage = async () => {
  const path = 'public/assets/img/quote-bg/';
  try {
    const imageFiles = await fs.readdir(path);

    // Filter out hidden files e.g. .DS_Store
    const acceptedImageFiles = imageFiles.filter(
      (file) => !file.startsWith('.')
    );
    const randomIndex = Math.floor(Math.random() * acceptedImageFiles.length);

    return `${path}${acceptedImageFiles[randomIndex]}`;
  } catch (error) {
    throw new Error(error);
  }
};

const getLineBreakPositions = (str) => {
  const formattedStr = str.replace(/\n+/g, ' '); // Convert all new line characters to spaces
  const STR_LENGTH = formattedStr.length;
  const CHARACTERS_LENGTH_LIMIT = 33;

  let frameText = '';
  let lineStartIndex = 1;
  let lineEndIndex = CHARACTERS_LENGTH_LIMIT;

  for (let charIndex = 0; charIndex < STR_LENGTH; charIndex++) {
    frameText += formattedStr[charIndex];
    if (charIndex === lineEndIndex && formattedStr[lineEndIndex] === ' ') {
      frameText += `\n`;
      lineStartIndex++;
      lineEndIndex = CHARACTERS_LENGTH_LIMIT * lineStartIndex;
    } else if (charIndex === lineEndIndex && lineEndIndex !== ' ') {
      lineEndIndex++;
    }
  }

  // Add additional whitespace between text for readability
  frameText = frameText.replace(/ /g, '   ');
  console.log(frameText);
  return { totalLinesOfText: lineStartIndex, frameText };
};

const getCenterPositions = ({
  parentWidth,
  parentHeight,
  childWidth,
  childHeight,
}) => {
  const centerY = parentHeight / 2 - childHeight / 2;
  const centerX = parentWidth / 2 - childWidth / 2;
  return { centerY, centerX };
};

const frameImage = async (tweet) => {
  try {
    registerFont('public/assets/fonts/Bluebird.otf', {
      family: 'sans-serif',
    });
    const randomImage = await getRandomImage();
    const image = await loadImage(randomImage);

    const CANVAS_WIDTH = image.width;
    const CANVAS_HEIGHT = image.height;
    // Font size: used to calculate height of frame text for positioning
    const FONT_SIZE = 40;

    const canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    context.lineWidth = 35;
    context.strokeStyle = '#344966';
    context.strokeRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const { frameText, totalLinesOfText } = getLineBreakPositions(tweet);
    const frameTextHeight = FONT_SIZE * totalLinesOfText;

    context.fillStyle = 'rgba(217, 219, 226, 0.8)';
    const textOverlayWidth = 950;
    const textOverlayHeight = frameTextHeight < 400 ? 400 : frameTextHeight * 2;

    // Center text bg overlay overlay vertically & horizontally
    const { centerX, centerY } = getCenterPositions({
      parentHeight: CANVAS_HEIGHT,
      parentWidth: CANVAS_WIDTH,
      childHeight: textOverlayHeight,
      childWidth: textOverlayWidth,
    });

    context.fillRect(
      centerX,
      centerY - 20,
      textOverlayWidth,
      textOverlayHeight
    );

    context.font = `bold ${FONT_SIZE}px Bluebird`;
    context.textAlign = 'center';
    context.fillStyle = '#353a4c';

    // Center text vertically
    const { centerY: textPositionY } = getCenterPositions({
      parentHeight: CANVAS_HEIGHT,
      childHeight: frameTextHeight,
    });

    context.textBaseline = 'middle';
    context.fillText(frameText, CANVAS_WIDTH / 2, textPositionY);

    return canvas.toDataURL();
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = frameImage;
