const selectors = [
  '.graphic',
  'svg',
  'svg > title',
  '.wrapper',
  '.layer',
  '.marks',
  '.mark',
  '.marks .mark.point', // more specific, needs to come after the more general .mark above
  '.axes',
  '.axes .x',
  '.axes .x .title',
  '.axes .y',
  '.axes .y .title',
  '.mark title',
  '.point title',
  '.tick',
  '.legend',
  '.legend .pair',
  '.legend .items-main',
  '.legend .items-more',
];

/**
 * remove dot
 * @param {string} selector DOM selector string
 * @returns {string} sanitized
 */
const stripDots = (selector) => {
  const leading = selector.slice(0, 1) === '.';
  let result;

  result = leading ? selector.slice(1) : selector;

  return result.replace(/\./g, '-');
};

/**
 * filter out unwanted segments from CSS selectors
 * @param {string} segment DOM selector string
 * @returns {boolean} string match
 */
const isAllowedSegment = (segment) => {
  return segment !== '>';
};

/**
 * convert a selector string into a data attribute value
 * @param {string} selector DOM selector string
 * @returns {string} attribute
 */
const convertToTestSelector = (selector) => {
  return selector.split(' ').map(stripDots).filter(isAllowedSegment).join('-');
};

/**
 * add test selector attributes
 */
const testAttributes = (selection) => {
  selectors.forEach((selector) => {
    selection.selectAll(selector).attr('data-test-selector', convertToTestSelector(selector));
  });
};

export { testAttributes };
