import * as d3 from 'd3';

const defaultColor = 'steelblue';

/**
 * create a color palette from the available hue range
 * for use as a categorical scale
 * @param {number} count number of colors
 * @returns {array} color palette
 */
const colors = (count) => {
    if (!count || count === 1) {
        return [defaultColor];
    }
    const swatch = d3.range(count).map((item, index) => {
        return `hsl(${(360 / count) * index}, 90%, 70%)`;
    });

    return swatch;
};

export { colors, defaultColor }
