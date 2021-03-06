import { WRAPPER_CLASS } from './config.js';
import { feature } from './feature.js';

/**
 * prepare the DOM of a specified element for rendering a chart
 * @param {object} s Vega Lite specification
 * @param {object} dimensions desired dimensions of the chart
 */
const init = (s, dimensions) => {
  const initializer = (selection) => {
    selection.html('');

    const chartNode = selection.append('div').classed('chart', true);

    const graphic = chartNode.append('div').classed('graphic', true);

    chartNode.append('div').classed('legend', true);

    const svg = graphic.append('svg');

    const wrapper = svg.append('g').classed(WRAPPER_CLASS, true);

    svg.attr('width', dimensions.x);
    svg.attr('role', 'document');

    try {
      svg.attr('aria-label', s.title.text);
    } catch {
      throw new Error('specification title is required');
    }

    if (feature(s).hasAxis()) {
      const axes = wrapper.append('g').classed('axes', true);

      axes.attr('aria-hidden', true);

      if (feature(s).hasEncodingX()) {
        axes.append('g').attr('class', 'x');
      }

      if (feature(s).hasEncodingY()) {
        axes.append('g').attr('class', 'y');
      }
    }

    const id = s.usermeta?.id;

    if (id) {
      svg.attr('aria-labelledby', `title-${id}`);
    }
  };

  return initializer;
};

export { init };
