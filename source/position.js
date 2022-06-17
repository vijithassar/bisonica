import { GRID, WRAPPER_CLASS } from './config.js';
import { feature } from './feature.js';
import { longestAxisTickLabelTextWidth, rotation } from './text.js';
import { memoize } from './memoize.js';
import { polarToCartesian } from './helpers.js';
import { radius } from './marks.js';

const MARGIN_MAXIMUM = 120;

const axes = { x: 'bottom', y: 'left' };

/**
 * compute margin for a circular chart
 * @returns {object} D3 margin convention object
 */
const marginCircular = () => {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  };
};

/**
 * compute margin for a Cartesian chart
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {object} D3 margin convention object
 */
const tickMargin = (s, dimensions) => {
  const textLabels = longestAxisTickLabelTextWidth(s, dimensions);
  const result = {};

  Object.entries(axes).forEach(([channel, position]) => {
    const angle = rotation(s, channel);

    if (textLabels[channel] && typeof angle === 'number') {
      const coordinates = polarToCartesian(textLabels[channel], angle);
      const opposite = Object.keys(axes).find((axis) => axis !== channel);
      const margin = Math.abs(coordinates[opposite]);

      result[position] = Math.min(MARGIN_MAXIMUM, margin + GRID);
    }
  });

  return result;
};

/**
 * compute margin for a Cartesian chart
 * @param {object} s Vega Lite specification
 * @returns {object} D3 margin convention object
 */
const titleMargin = (s) => {
  return {
    bottom: feature(s).hasAxisTitleX() ? GRID * 4 : 0,
    left: feature(s).hasAxisTitleY() ? GRID * 4 : 0,
  };
};

/**
 * compute margin for a Cartesian chart
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {object} D3 margin convention object
 */
const marginCartesian = (s, dimensions) => {
  const defaultMargin = {
    top: GRID * 2,
    right: GRID * 2,
    bottom: GRID * 4,
    left: GRID * 4,
  };

  const dynamicMargin = {};

  Object.values(axes).forEach((position) => {
    dynamicMargin[position] =
      tickMargin(s, dimensions)?.[position] + titleMargin(s)?.[position] + GRID;
  });

  return {
    top: defaultMargin.top,
    right: defaultMargin.right,
    bottom: dynamicMargin.bottom || defaultMargin.bottom,
    left: dynamicMargin.left || defaultMargin.left,
  };
};

const _margin = (s, dimensions) => {
  if (feature(s).isCircular()) {
    return marginCircular();
  } else {
    return marginCartesian(s, dimensions);
  }
};

/**
 * compute margin values based on chart type
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {object} D3 margin convention object
 */
const margin = memoize(_margin);

/**
 * transform string for positioning charts
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} positioning function
 */
const position = (s, dimensions) => {
  const setPosition = (selection) => {
    const yOffsetCircular =
      dimensions.x > dimensions.y ? (dimensions.y - radius(dimensions) * 2) * 0.5 : 0;
    const middle = {
      x: dimensions.x * 0.5,
      y: dimensions.y * 0.5 + yOffsetCircular,
    };

    let margins;

    const { left, top } = margin(s, dimensions);

    margins = {
      x: left,
      y: top,
    };

    const transform = feature(s).isCircular() ? middle : margins;
    const transformString = `translate(${transform.x},${transform.y})`;

    selection.select(`g.${WRAPPER_CLASS}`).attr('transform', transformString);
  };

  return setPosition;
};

export { margin, tickMargin, position };
