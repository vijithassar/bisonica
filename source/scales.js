import * as d3 from 'd3';

import { barWidth } from './marks';
import { data, sumByPeriod } from './data';
import { defaultColor } from './config';
import { encodingFieldQuantitative, encodingType, encodingValue } from './encodings';
import { feature } from './feature';
import { identity, values } from './helpers';
import { memoize } from './memoize';
import { parseTime } from './time';
import { sorter } from './sort';

/**
 * create a color palette from the available hue range
 * for use as a categorical scale
 * @param {number} count number of colors
 * @returns {array} color palette
 */
const colors = (count = 5) => {
  const swatch = d3.range(count).map((item, index) => {
    return `hsl(${(360 / count) * index}, 90%, 70%)`;
  });

  return swatch;
};

/**
 * determine the d3 method name of the scale function to
 * generate for a given dimension of visual encoding
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding parameter
 * @returns {string} d3 scale type
 */
const scaleType = (s, channel) => {
  let methods = {
    temporal: 'Utc',
    nominal: 'Ordinal',
    quantitative: 'Linear',
    ordinal: 'Ordinal',
  };
  const key = encodingType(s, channel);

  if (typeof key === 'string') {
    const method = channel === 'x' && ['nominal', 'ordinal'].includes(key) ? 'Band' : methods[key];

    return `scale${method}`;
  } else if (typeof key === 'undefined') {
    throw new Error(
      `could not determine scale method for ${channel} channel because encoding type is undefined`,
    );
  }
};

/**
 * get the specified domain from a specification
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding parameter
 * @returns {array} domain
 */
const customDomain = (s, channel) => {
  const domain = s.encoding[channel]?.scale?.domain;

  if (domain) {
    if (encodingType(s, channel) === 'temporal') {
      return domain.map(parseTime);
    } else {
      return domain;
    }
  }
};

/**
 * determine whether a given channel is text based
 * @param {string} channel encoding parameter
 * @returns {boolean} whether the field is text based
 */
const isTextChannel = (channel) => {
  return ['href', 'text', 'tooltip', 'description'].includes(channel);
};

/**
 * sanitize channel name
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding parameter
 * @returns {string} visual encoding channel
 */
const channelRoot = (s, channel) => {
  return channel.endsWith('2') ? channel.slice(0, -1) : channel;
};

/**
 * compute scale domain
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding parameter
 * @returns {number[]} domain
 */
const domain = (s, channel) => {
  const domains = {
    x: (values) => {
      const type = encodingType(s, 'x');

      if (type === 'temporal') {
        const date = (d) => parseTime(encodingValue(s, 'x')(d));

        return d3.extent(values, date);
      } else if (type === 'nominal' || type === 'ordinal') {
        return values.map((item) => encodingValue(s, 'x')(item));
      } else if (type === 'quantitative') {
        return d3.extent(values, (item) => encodingValue(s, 'x')(item));
      }
    },
    y: (values) => {
      const type = encodingType(s, 'y');
      let yMin;
      let yMax;

      if (type === 'nominal') {
        return [...new Set(values.map((item) => encodingValue(s, 'y')(item)))];
      } else if (feature(s).isBar()) {
        yMin = 0;
        yMax = d3.max(sumByPeriod(s));
      } else if (feature(s).isLine()) {
        const daily = data(s)
          .map((item) => item.values)
          .flat();
        const y = encodingValue(s, 'y');
        const nonzero = s.encoding.y.scale?.zero === false;
        const min = d3.min(daily, y);
        const positive = typeof min === 'number' && min > 0;

        if (nonzero && positive) {
          yMin = min;
        } else if (!positive) {
          yMin = min;
        } else {
          yMin = 0;
        }

        yMax = d3.max(daily, y);
      } else {
        yMin = 0;
        yMax = d3.max(values, encodingValue(s, 'y'));
      }

      return [yMin, yMax];
    },
    theta: () => {
      return [0, 360];
    },
    color: (values) => {
      const colors = Array.from(new Set(values.map(encodingValue(s, 'color'))));

      return colors;
    },
  };

  const domain = customDomain(s, channel) || domains[channelRoot(s, channel)](values(s));

  if (!s.encoding[channel].sort || s.encoding[channel].sort === null) {
    return domain;
  }

  return domain.slice().sort(sorter(s, channel));
};

/**
 * compute scale range
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding parameter
 * @returns {number[]} range
 */
const range = (s, dimensions, channel) => {
  const ranges = {
    x: () => {
      const rangeDeltas = () => {
        if (feature(s).isBar() && encodingType(s, 'x') === 'temporal') {
          return { x: barWidth(s, dimensions) };
        } else {
          return { x: 0 };
        }
      };

      return [0, dimensions.x - rangeDeltas().x];
    },
    y: () => {
      const type = encodingType(s, 'y');

      if (['nominal', 'ordinal'].includes(type)) {
        const count = domain(s, channel).length;
        const interval = dimensions.y / count;

        return Array.from({ length: count }).map((item, index) => index * interval);
      } else {
        return [dimensions.y, 0];
      }
    },
    color: () => {
      let colorRangeProcessor;

      if (feature(s).isRule()) {
        colorRangeProcessor = identity;
      } else {
        colorRangeProcessor = data;
      }

      return (
        s.encoding.color?.scale?.range ||
        colors((customDomain(s, 'color') || colorRangeProcessor(s)).length)
      );
    },
    theta: () => [0, Math.PI * 2],
  };

  return ranges[channelRoot(s, channel)]();
};

/**
 * generate scale functions described by the
 * specification's encoding section
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {object} hash of d3 scale functions
 */
const coreScales = (s, dimensions) => {
  if (typeof s.encoding !== 'object') {
    return;
  }

  const scales = {};

  Object.entries(s.encoding).forEach(([channel, definition]) => {
    if (definition !== null && definition.value) {
      scales[channel] = () => definition.value;
    }

    if (definition.datum && isTextChannel(channel)) {
      scales[channel] = identity;
    }
  });

  Object.entries(s.encoding)
    .filter(([channel]) => !isTextChannel(channel) && !scales[channel])
    .forEach(([channel]) => {
      try {
        const method = scaleType(s, channelRoot(s, channel));
        const scale = d3[method]().domain(domain(s, channel)).range(range(s, dimensions, channel));

        if (method === 'scaleLinear') {
          scale.nice();
        }

        scales[channel] = scale;
      } catch (error) {
        error.message = `could not generate ${channel} scale - ${error.message}`;
        throw error;
      }
    });

  if (!scales.color && !feature(s).isMulticolor()) {
    scales.color = () => defaultColor;
  }

  return scales;
};

/**
 * determine whether a specification describes a chart that
 * will require scale functions beyond the ones listed directly
 * in the s's encoding section
 * @param {object} s Vega Lite specification
 * @returns {string[]} additional scale functions required
 */
const detectScaleExtensions = (s) => {
  const extensions = [];

  if (feature(s).isBar()) {
    extensions.push('length');
  }

  if (feature(s).isText() && !s.mark.text && s.encoding.text.field) {
    extensions.push('text');
  }

  return extensions;
};

/**
 * generate additional necessary scale functions beyond those
 * described in the s's encoding section
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @param {object} scales a hash of the core scale functions
 * @returns {object} hash of extended d3 scale functions
 */
const extendScales = (s, dimensions, scales) => {
  const extendedScales = { ...scales };
  const extensions = detectScaleExtensions(s);

  if (extensions.includes('length')) {
    const channel = encodingFieldQuantitative(s);

    extendedScales.barLength = (d) => {
      if (extendedScales[channel].domain().every((endpoint) => endpoint === 0)) {
        return 0;
      }

      return dimensions[channel] - extendedScales[channel](d);
    };

    extendedScales.barStart = (d) => {
      return extendedScales[channel](d[0]) - extendedScales.barLength(d[1] - d[0]);
    };
  }

  if (extensions.includes('text')) {
    extendedScales.text = (d) => `${d}`;
  }

  return extendedScales;
};

const _parseScales = (s, dimensions) => {
  const core = coreScales(s, dimensions);
  const extended = extendScales(s, dimensions, core);

  return extended;
};

/**
 * generate all scale functions necessary to render a s
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {object} hash of all necessary d3 scale functions
 */
const parseScales = memoize(_parseScales);

export { colors, parseScales };
