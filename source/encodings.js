import { feature } from './feature.js';
import { memoize } from './memoize.js';
import { parseScales } from './scales.js';
import { parseTime } from './time.js';
import { transform } from './transform.js';
import { nested } from './helpers.js';

/**
 * look up the field used for a visual encoding
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {string} encoding field
 */
const encodingField = (s, channel) => {
  return (
    s.encoding?.[channel]?.aggregate || s.encoding?.[channel]?.field || s.facet?.[channel]?.field
  );
};

/**
 * look up the data type used for an encoding in the s
 * (these are types of data sets, not JavaScript primitive types)
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {('nominal'|'ordinal'|'quantitative'|'temporal')} encoding type
 */
const encodingType = (s, channel) => {
  return s.encoding?.[channel]?.type;
};

/**
 * create a function which looks up the data value used for
 * a visual encoding
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {function(object)}
 */
const encodingValue = (s, channel) => {
  const key = encodingField(s, channel);
  const nesting = key && key.includes('.');
  return (d) => {
    if (!nesting && typeof d[key] !== 'undefined') {
      return d[key];
    } else if (nesting) {
      return nested(d, key);
    }

    if (s.transform) {
      return transform(s)(d)[key];
    }
  };
};

/**
 * determine which channel is used for quantitative encoding
 * @param {object} s Vega Lite specification
 * @returns {string} visual encoding channel
 */
const encodingChannelQuantitative = (s) => {
  const test = (channel, definition) => definition.type === 'quantitative';

  return encodingTest(s, test);
};

/**
 * create a function which looks up the data value used for
 * the quantitative visual encoding
 * @param {object} s Vega Lite specification
 * @returns {function(object)}
 */
const encodingValueQuantitative = (s) => {
  return encodingValue(s, encodingChannelQuantitative(s));
};

/**
 * determine which channel matches a predicate function
 * @param {object} s Vega Lite specification
 * @param {function} test test
 * @returns {string} visual encoding channel
 */
const _encodingTest = (s, test) => {
  const encodings = Object.entries(s.encoding).filter(([channel, definition]) => {
    return test(channel, definition);
  });

  if (encodings.length === 1) {
    return encodings[0][0];
  }

  if (encodings.length === 0) {
    throw new Error('no channels match test function');
  }

  if (encodings.length > 1) {
    const list = encodings.map((encoding) => encoding[0]).join(', ');

    throw new Error(`multiple channels (${list}) match test function`);
  }
};
const encodingTest = memoize(_encodingTest);

/**
 * determine which channel is used for the independent variable
 * @param {object} s Vega Lite specification
 * @returns {string} visual encoding channel
 */
const encodingChannelCovariate = (s) => {
  if ((feature(s).isCircular() || feature(s).isLinear()) && feature(s).hasColor()) {
    return 'color';
  } else if (feature(s).isCartesian()) {
    const covariate = Object.entries(s.encoding).filter(
      ([channel, definition]) =>
        channel !== 'color' && definition.type && definition.type !== 'quantitative',
    );

    if (covariate.length !== 1) {
      throw new Error('could not identify independent variable');
    }

    return covariate.pop()[0];
  }
};

/**
 * determine which channel of a Cartesian specification object
 * is secondary to the quantitative channel
 * @param {object} s Vega Lite specification
 * @returns {string} visual encoding chanel
 */
const encodingChannelCovariateCartesian = (s) => {
    const channel = ['x', 'y'].find((channel => channel !== encodingChannelQuantitative(s)));
    if (channel) {
      return channel;
    } else {
      const message = feature(s).isCartesian() ? 'could not determine Cartesian covariate encoding' : 'specification is not Cartesian';
      throw new Error(message);
    }
};

/**
 * generate a set of complex encoders
 * @param {object} s Vega Lite specification
 * @param {object} dimensions desired dimensions of the chart
 * @param {object} accessors hash of data accessor functions
 * @returns {object} hash of encoder functions with complex data
 * lookup suitable for use as d3 callbacks
 */
const createEncoders = (s, dimensions, accessors) => {
  const result = {};
  const scales = parseScales(s, dimensions);

  Object.keys(accessors).forEach((channel) => {
    const accessor = accessors[channel];
    const encoder = (d) => {
      const scale = scales[channel];

      if (s.encoding[channel]?.value) {
        return scale();
      }

      const value = encodingType(s, channel) === 'temporal' ? parseTime(accessor(d)) : accessor(d);

      if (accessor && typeof scale === 'undefined') {
        throw new Error(`accessor function ${channel}() is missing corresponding scale function`);
      }

      if (typeof d === 'undefined' && value !== null) {
        throw new Error(`datum for ${channel} is undefined`);
      }

      if (typeof scale !== 'function') {
        throw new Error(`scale function for ${channel} is not available`);
      }

      if (typeof value === 'undefined' && feature(s).isMulticolor()) {
        throw new Error(`data value for ${channel} is undefined`);
      }

      const encoded = scale(value);

      if (typeof encoded === 'undefined') {
        throw new Error(`encoded value for ${channel} is undefined`);
      }

      if (Number.isNaN(encoded)) {
        throw new Error(`encoded value for ${channel} is not a number (NaN)`);
      }

      return encoded;
    };

    result[channel] = encoder;
  });

  return result;
};

export {
  encodingField,
  encodingValue,
  encodingType,
  encodingChannelQuantitative,
  encodingChannelCovariate,
  encodingChannelCovariateCartesian,
  createEncoders,
  encodingValueQuantitative,
};
