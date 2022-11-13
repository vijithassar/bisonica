import * as d3 from 'd3';
import { datum } from './helpers.js';
import { encodingValue } from './encodings.js';
import { memoize } from './memoize.js';
import { getTooltipField, tooltipContent } from './tooltips.js';
import { data } from './data.js';
import { feature } from './feature.js';
import { extension } from './extensions.js';

const delimiter = '; ';

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
    }

    quantitative.forEach((channel) => {
        // if the value function can't be determined before
        // this point, there may be multiple quantitative
        // encodings
        if (!value) {
            value = (d) => encodingValue(s, channel)(d);
        }

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
const _extentDescription = (s) => {
    const disabled = extension(s, 'description')?.extent === false;
    if (disabled || s.layer) {
        return empty;
    }
    const extents = calculateExtents(s);
    return (d) => {
        const endpoints = quantitativeChannels(s).map((channel) => {
            const value = (d) => getTooltipField(s, channel)(d).value;
            const endpoint = extents[channel].get(value(d));
            if (!endpoint) {
                return '';
            }
            return `${endpoint.type} value of ${s.encoding[channel].field} field`;
        }).filter(Boolean);
        if (endpoints.length) {
            return delimiter + endpoints.join(delimiter);
        } else {
            return '';
        }
    };
};
const extentDescription = memoize(_extentDescription);

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