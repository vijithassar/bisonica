import * as d3 from 'd3';

const defaultColor = '--graph-1';

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

export { colors, defaultColor }
