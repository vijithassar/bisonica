import * as d3 from 'd3';
import { MINIMUM_TICK_COUNT } from './config.js';
import { encodingType } from './encodings.js';
import { getTimeFormatter } from './time.js';
import { memoize } from './memoize.js';
import { parseScales } from './scales.js';
import { ticks } from './axes.js';

const canvas = document.createElement('canvas');
const context = canvas.getContext('2d');

/**
 * measure the width of a text string
 * @param {string} text text string
 * @param {object} [styles] styles
 * @returns {number} string width
 */
const _measureText = (text, styles = {}) => {
  // set styles
  Object.entries(styles).forEach(([key, value]) => {
    context[key] = value;
  });

  const value = context.measureText(text).width;

  // reset styles on shared global <canvas> DOM node
  Object.entries(styles).forEach(([key]) => {
    context[key] = null;
  });

  return value;
};

const measureText = memoize(_measureText);

/**
 * extract font styles relevant to string width
 * from a DOM node
 * @param {object} node DOM node
 * @returns {object} hashmap of styles
 */
const fontStyles = (node) => {
  const fontStyleProperties = ['letter-spacing', 'font-size', 'font', 'font-weight'];
  const computedStyles = getComputedStyle(node);
  let fontStyles = {};

  fontStyleProperties.forEach((property) => {
    const value = computedStyles[property];

    if (value) {
      fontStyles[property] = value;
    }
  });

  return fontStyles;
};

/**
 * abbreviate axis tick label text
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @param {'x'|'y'} channel encoding channel
 * @returns {function} abbreviation function
 */
const _abbreviate = (s, dimensions, channel) => {
  return (tick) => {
    if (encodingType(s, channel) !== 'quantitative') {
      return tick;
    }

    const scales = parseScales(s, dimensions);

    const hasLargeValues = scales[channel]
      .ticks()
      .some((tick) => typeof tick === 'number' && tick >= 1000);

    if (!hasLargeValues) {
      return tick;
    }

    const si = scales[channel].tickFormat(MINIMUM_TICK_COUNT, '.1~s');

    return si(tick).toUpperCase().replace('G', 'B');
  };
};
const abbreviate = memoize(_abbreviate);

/**
 * format axis tick label text
 * @param {object} s Vega Lite specification
 * @param {'x'|'y'} channel encoding channel
 * @returns {function} formatting function
 */
const format = (s, channel) => {
  const formatter =
    encodingType(s, channel) === 'temporal'
      ? getTimeFormatter(s, channel)
      : (label) => label.toString();

  return (text) => formatter(text);
};

/**
 * rotate axis tick label text
 * @param {object} s Vega Lite specification
 * @returns {number} axis tick text rotation
 */
const rotation = (s, channel) => (s.encoding?.[channel]?.axis?.labelAngle * Math.PI) / 180 || 0;

/**
 * truncate axis tick label text
 *
 * This returns a string instead of acting as a factory
 * because the string length computation is expensive
 * so it's particularly helpful to be able to memoize
 * all the arguments at once.
 *
 * @param {object} s Vega Lite specification
 * @param {'x'|'y'} channel encoding channel
 * @param {string} text text to truncate
 * @param {array} [styles] styles to incorporate when measuring text width
 * @returns {string} truncated string
 */
const _truncate = (s, channel, text, styles = []) => {
  const max = 180;

  let limit = d3.min([s.encoding[channel].axis?.labelLimit, max]);

  if (limit === 0) {
    return text;
  }

  let substring = text;

  while (measureText(`${substring}…`, styles) > limit && substring.length > 0) {
    substring = substring.slice(0, -1);
  }

  const suffix = substring.length < text.length ? '…' : '';

  return `${substring}${suffix}`;
};
const truncate = memoize(_truncate);

/**
 * process axis tick text content
 * @param {object} s Vega Lite specification
 * @param {'x'|'y'} channel axis dimension
 * @param {string} textContent text to process
 * @param {array} [styles] styles to incorporate when measuring text width
 * @returns {string} text processing function
 */
const _axisTickLabelTextContent = (s, channel, textContent, styles) => {
  let text = textContent;

  text = format(s, channel)(text);

  text = abbreviate(s, channel)(text);

  text = truncate(s, channel, text, styles);

  return text;
};
const axisTickLabelTextContent = memoize(_axisTickLabelTextContent);

/**
 * compute margin values based on chart type
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {object} longest axis tick label text length in pixels
 */
const longestAxisTickLabelTextWidth = (s, dimensions) => {
  const scales = parseScales(s, dimensions);

  const channels = ['x', 'y'];
  const tickLabels = channels.map((channel) => {
    const type = encodingType(s, channel);
    const processText = (tick) => axisTickLabelTextContent(s, channel, tick, []);

    if (['quantitative', 'temporal'].includes(type)) {
      return scales[channel].ticks(ticks(s, channel)).map(processText);
    } else if (['nominal', 'ordinal'].includes(type)) {
      return scales[channel].domain().map(processText);
    } else {
      return [''];
    }
  });

  const longest = tickLabels.map((ticks) => {
    return d3.max(ticks, (d) => measureText(d));
  });

  const result = longest.reduce((previous, current, index) => {
    return {
      ...previous,
      [channels[index]]: current ? current : null,
    };
  }, {});

  return result;
};

/**
 * render axis tick text
 * @param {object} s Vega Lite specification
 * @param {'x'|'y'} channel encoding channel
 * @returns {function} text processing function
 */
const axisTickLabelText = (s, channel) => {
  let styles = {};

  return (selection) => {
    // only retrieve rendered font styles once per axis instead of separately
    // for each tick to avoid performance issues
    const node = selection.node();

    if (!styles[channel] && node) {
      styles[channel] = fontStyles(node);
    }

    selection.each(function (label) {
      d3.select(this).text(axisTickLabelTextContent(s, channel, label, styles[channel]));
    });
  };
};

export {
  abbreviate,
  rotation,
  format,
  truncate,
  axisTickLabelTextContent,
  axisTickLabelText,
  longestAxisTickLabelTextWidth,
};
