const { parse } = require('twemoji-parser');

const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-GB').format(new Date(date));
};

const breakTweetIntoLines = (str) => {
  const formattedStr = str.replace(/\n+/g, ' '); // Convert all new line characters to spaces
  const STR_LENGTH = formattedStr.length;
  const CHARACTERS_PER_LINE = 82; // Limit characters per line to 82 characters

  let parsedText = '';
  let numLinesOfText = 1;
  let lineEndIndex = CHARACTERS_PER_LINE;

  if (formattedStr.length <= CHARACTERS_PER_LINE) {
    parsedText = formattedStr;
  } else {
    for (let charIndex = 0; charIndex < STR_LENGTH; charIndex++) {
      parsedText += formattedStr[charIndex];
      if (charIndex === lineEndIndex && formattedStr[lineEndIndex] === ' ') {
        parsedText += `\n`;
        numLinesOfText++;
        lineEndIndex = CHARACTERS_PER_LINE * numLinesOfText;
      } else if (charIndex === lineEndIndex && lineEndIndex !== ' ') {
        lineEndIndex++;
      }
    }
  }

  return { parsedText, numLinesOfText };
};

const parseEmoji = (context, text) => {
  // Node-Canvas doesn't traditionally support emoji's for now
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
        const charsBeforeEmoji = line.substr(0, emojiObj.indices[0]);
        const textWidth = context.measureText(charsBeforeEmoji).width;
        const emojiDetails = {
          ...emojiObj,
          textWidth,
          rowIndex: index + 1,
        };
        emojiData.push(emojiDetails);
      });
    }
  });
  const textWithoutEmojis = linesOfText.join('\n');
  return { textWithoutEmojis, emojiData };
};

const combineTextWithEmojis = ({ context, text }) => {
  const { parsedText, numLinesOfText } = breakTweetIntoLines(text);
  const { textWithoutEmojis, emojiData } = parseEmoji(context, parsedText);
  return { numLinesOfText, textWithoutEmojis, emojiData };
};

module.exports = {
  formatDate,
  combineTextWithEmojis,
};
