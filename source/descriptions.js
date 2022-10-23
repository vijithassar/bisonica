import { datum } from './helpers.js';
import { encodingValue } from './encodings.js';
import { memoize } from './memoize.js';
import { tooltipContent } from './tooltips.js';

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
            return tooltipContent(s)(d);
        }
    };
};
const markDescription = memoize(_markDescription);

export { markDescription }