import { identity } from './helpers.js';
import { memoize } from './memoize.js';

/**
 * create a function to perform a single calculate expression
 * @param {string} expression a calculate expression describing string interpolation
 * @returns {function} string interpolation function
 */
const calculate = (expression) => {
  const segments = expression
    .split('+')
    .map((item) => item.trim())
    .map((item) => {
      const interpolate = typeof item === 'string' && item.startsWith('datum.');
      const literal = item.startsWith("'") && item.endsWith("'");

      if (literal) {
        return item.slice(1, -1);
      } else if (interpolate) {
        return item;
      }
    })
    .filter((item) => !!item);

  return (d) =>
    segments
      .map((segment) => {
        if (segment.startsWith('datum.')) {
          const key = segment.slice(6);

          return d[key];
        } else {
          return segment;
        }
      })
      .join('');
};

const _composeTransforms = (transforms) => {
  return (d) => {
    if (!transforms?.length) {
      return identity;
    }

    return transforms.reduce(
      (previous, current) => {
        if (!current.calculate) {
          throw new Error('only calculate transforms are currently supported');
        }

        return {
          ...previous,
          [current.as]: calculate(current.calculate)({ ...d }),
        };
      },
      { ...d },
    );
  };
};

/**
 * create a function to augment a datum with multiple calculate expressions
 * @param {array} transforms an array of calculate expressions
 * @returns {function} transform function
 */
const composeTransforms = memoize(_composeTransforms);

/**
 * create a function to run transforms on a specification
 * @param {object} s Vega Lite specification
 * @returns {function} transform function
 */
const transform = (s) => {
  return composeTransforms(s.transform);
};

export { calculate, transform };
