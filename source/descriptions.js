import * as d3 from 'd3';
import { datum } from './helpers.js';
import { encodingValue, encodingChannelQuantitative } from './encodings.js';
import { memoize } from './memoize.js';
import { getTooltipField, tooltipContent } from './tooltips.js';
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

/**
 * return an empty string as a default value
 * @returns {string} empty string
 */
const empty = () => ''

/**
 * render descriptive text highlighting the minimum
 * and maximum values in the data set
 * @param {object} s Vega Lite specification
 * @returns {function(object)} extent description
 */
const extentDescription = (s) => {
    const disabled = s.usermeta?.description?.extent === false;
    if (disabled || s.layer) {
        return empty;
    }
    const extents = calculateExtents(s);
    if (Object.keys(extents).length !== 1) {
        return empty;
    }
    const channel = encodingChannelQuantitative(s);
    const value = (d) => getTooltipField(s, channel)(d).value;
    return (d) => {
        const endpoint = extents[channel].get(value(d));
        if (!endpoint) {
            return '';
        } else {
            return `; ${endpoint.type} value of ${s.encoding[channel].field} field`;
        }
    };
};

/**
 * compute the text string to describe a mark
 * @param {object} s Vega Lite specification
 * @returns {function} description computation function
 */
const _description = (s) => {
    return (d) => {
        if (s.encoding.description) {
            return encodingValue(s, 'description')(datum(s, d));
        } else {
            return `${tooltipContent(s)(d)}${extentDescription(s)(d)}`;
        }
    };
};
const description = memoize(_description);

/**
 * render a description into the DOM
 * @param {object} s Vega Lite specification
 * @returns {function(object)} mark description renderer
 */
const markDescription = (s) => {
    return (d) => {
        if (s.mark.tooltip === false || s.mark.aria === false) {
            return;
        }
        return description(s)(d);
    };
};

export { markDescription }