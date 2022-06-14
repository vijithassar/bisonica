import { encodingField, encodingFieldQuantitative, encodingValue } from './encodings.js';
import { feature } from './feature.js';
import { mark } from './helpers.js';
import { memoize } from './memoize.js';
import { parseTime } from './time.js';

/**
 * generate accessor methods which can look up
 * data points for a particular chart type
 * @param {object} s Vega Lite specification
 * @param {('arc'|'bar'|'line'|'point'|'rule'|'series'|'text')} [type] mark type
 * @returns {object} accessor methods
 */
const _createAccessors = (s, type = null) => {
  const key = type || mark(s);

  const accessors = {};

  // create an accessor function with standard property lookup behavior
  const accessor = (channel) => (d) => encodingValue(s, channel)(d);

  // helper to quickly create standard accessors based solely on channel names
  const standard = (...channels) => {
    channels.forEach((channel) => {
      if (encodingField(s, channel)) {
        accessors[channel] = accessor(channel);
      }
    });
  };

  if (key === 'series') {
    accessors.color = (d) => d.key;
  }

  if (key === 'bar') {
    accessors.y = (d) => d[0];
    accessors.x = (d) => d.data.key;
    accessors.barStart = (d) => (d[1] ? d : [d[0], d[0]]);

    accessors.barLength = (d) => {
      return isNaN(d[1]) ? 0 : d[1] - d[0];
    };
  }

  if (key === 'arc') {
    accessors.theta = (d) => encodingValue(s, encodingFieldQuantitative(s))(d);
    accessors.color = (d) => d.data.key;
  }

  if (key === 'rule') {
    standard('x', 'y', 'color');
  }

  if (key === 'point') {
    standard('x', 'y', 'color');
  }

  if (key === 'line') {
    standard('y');
    accessors.x = feature(s).isTemporal() ? (d) => parseTime(d.period) : accessor('x');
    accessors.color = (d) => (feature(s).hasColor() ? encodingValue(s, 'color')(d) : null);
  }

  if (key === 'text') {
    standard('x', 'y', 'color', 'text');
  }

  if (!s.encoding) {
    return accessors;
  }

  Object.entries(s.encoding).forEach(([channel, encoding]) => {
    if (encoding.datum) {
      accessors[channel] = () => encoding.datum;
    }
  });

  Object.entries(s.encoding).forEach(([channel, encoding]) => {
    if (encoding?.type === 'temporal') {
      const originalAccessor = accessors[channel];

      accessors[channel] = (d) => parseTime(originalAccessor(d));
    }
  });

  return accessors;
};
const createAccessors = memoize(_createAccessors);

export { createAccessors };
