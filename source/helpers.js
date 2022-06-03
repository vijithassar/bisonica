import * as d3 from 'd3';

import { encodingField, encodingType } from './encodings';
import { feature } from './feature';

/**
 * round number based on significant digits
 * @param {number} number number
 * @returns {string} rounded number as string with SI suffix
 */
const abbreviateNumbers = (number) => {
  if (number < 10 && Number.isInteger(number)) {
    return `${number}`;
  } else if (number < 10 && !Number.isInteger(number)) {
    return d3.format('.1f')(number);
  } else if (number > 10) {
    return d3.format('.2s')(number);
  }
};

/**
 * look up data values attached to specification
 * @param {object} s Vega Lite specification
 * @returns {array}
 */
const values = (s) => {
  return s.data?.values.slice();
};

/**
 * return the original data object if it has been nested
 * by a layout generator
 * @param {object} s Vega Lite specification
 * @param {object} d datum, which may or may not be nested
 * @returns {object} datum
 */
const datum = (s, d) => {
  if (feature(s).isCircular() && d.data) {
    return d.data;
  }

  return d;
};

/**
 * get the string used when there's no appropriate name for a series
 * @returns {string} series name
 */
const missingSeries = () => '_';

/**
 * look up the URL attached to a datum
 * @param {object} s Vega Lite specification
 * @param {object} d datum, which may or may not be nested
 * @returns {string} url
 */
const getUrl = (s, d) => {
  const field = encodingField(s, 'href');

  return d.data?.[missingSeries()]?.[field] || d.data?.[field] || d[field];
};

/**
 * look up the mark name from either a simple string
 * or the type property of a mark specification object
 * @param {object} s Vega Lite specification
 * @returns {string} mark name
 */
const mark = (s) => {
  if (typeof s.mark === 'string') {
    return s.mark;
  } else if (typeof s.mark === 'object') {
    return s.mark.type;
  }
};

/**
 * check whether all fields match in a data set
 * @param {array} items array of objects
 * @param {string} field string key to check in all objects
 * @returns {boolean}
 */
const fieldsMatch = (items, field) => {
  if (items.length) {
    const sample = items[0][field];

    return items.every((item) => item[field] === sample);
  } else {
    return false;
  }
};

/**
 * does not do anything; occasionally useful to ensure a function is
 * returned consistently from a factory or composition
 * @returns {function}
 */
const noop = () => {
  return;
};

/**
 * returns the input; occasionally useful for composition
 */
const identity = (x) => x;

/**
 * convert a string to machine-friendly key
 * @param {string} string input string
 * @returns {string} kebab case string
 */
const key = (string) => string?.toLowerCase().replace(/ /g, '-');

/**
 * convert radians to degrees
 * @param {number} radians angle in radians
 * @returns {number} angle in degrees
 */
const degrees = (radians) => (radians * 180) / Math.PI;

/**
 * test whether a channel is continuous
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {boolean}
 */
const isContinuous = (s, channel) => {
  return ['temporal', 'quantitative'].includes(encodingType(s, channel));
};

/**
 * test whether a channel is discrete
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {boolean}
 */
const isDiscrete = (s, channel) => {
  return !isContinuous(s, channel);
};

/**
 * determine whether DOM nodes overlap
 * @param {array} nodes DOM nodes
 * @returns {boolean} overlap
 */
const overlap = (nodes) => {
  const pairs = d3.cross(nodes, nodes).filter(([a, b]) => a !== b);

  return pairs.some(([aNode, bNode]) => {
    const a = aNode.getBoundingClientRect();
    const b = bNode.getBoundingClientRect();
    const overlap = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom);

    return overlap;
  });
};

/**
 * convert polar coordinates to Cartesian
 * @param {number} radius radius
 * @param {number} angle angle in radians
 * @returns {object} equivalent Cartesian coordinates
 */
const polarToCartesian = (radius, angle) => {
  return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) };
};

export {
  abbreviateNumbers,
  mark,
  fieldsMatch,
  values,
  datum,
  missingSeries,
  getUrl,
  noop,
  identity,
  key,
  degrees,
  isContinuous,
  isDiscrete,
  overlap,
  polarToCartesian,
};
