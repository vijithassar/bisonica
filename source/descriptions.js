import * as d3 from 'd3';
import { datum } from './helpers.js';
import { encodingValue } from './encodings.js';
import { memoize } from './memoize.js';
import { tooltipContent } from './tooltips.js';
import { data } from './data.js';
import { feature } from './feature.js';

const quantitativeChannels = (s) => {
    const result = Object.entries(s.encoding)
        .filter(([,definition]) => {
            return definition.type === 'quantitative';
        })
        .map(([channel]) => channel);
    return result;
};

/**
 * calculate minimum and maximum value for
 * each quantitative channel
 * @param {object} s Vega Lite specification
 * @returns {object} extents
 */
const calculateExtents = (s) => {
    const quantitative = quantitativeChannels(s);

    let result = {};

    let values;
    let value;
    if (feature(s).isCircular()) {
        values = data(s);
        value = (d) => d.value;
    } else if (feature(s).isLine()) {
        values = data(s).map((series) => series.values).flat();
        value = (d) => d.value;
    } else if (feature(s).isBar()) {
        values = data(s).flat();
        value = (d) => d[1] - d[0];
    } else {
        values = data(s);
        value = (d) => d;
    }

    quantitative.forEach((channel) => {
        result[channel] = new Map();
        const [min, max] = d3.extent(values, value);
        result[channel].set(min, {type: 'minimum' });
        result[channel].set(max, { type: 'maximum' });
    });

    return result;
};

const extentDescription = (s) => {
    const disabled = s.usermeta?.description?.extent === false;
    if (disabled) {
        return () => '';
    }
    const extents = calculateExtents(s);
    return () => {
        return '';
    };
};

/**
 * compute the text string to describe a mark
 * @param {object} s Vega Lite specification
 * @returns {function} mark description computation function
 */
const _markDescription = (s) => {
    return (d) => {
        if (s.mark.aria === false) {
            return;
        } else if (s.encoding.description) {
            return encodingValue(s, 'description')(datum(s, d));
        } else {
            return `${tooltipContent(s)(d)}${extentDescription(s)(d)}`;
        }
    };
};
const markDescription = memoize(_markDescription);

export { markDescription }