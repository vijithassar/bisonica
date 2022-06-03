import { WRAPPER_CLASS } from './config';
import { axes } from './axes';
import { init } from './init';
import { initializeInteractions, interactions } from './interactions';
import { keyboard } from './keyboard';
import { layer } from './views';
import { legend } from './legend';
import { margin, position } from './position';
import { marks } from './marks';
import { testAttributes } from './markup';

/**
 * generate chart rendering function based on
 * a Vega Lite specification
 * @param {object} s Vega Lite specification
 * @param {object} panelDimensions chart dimensions
 * @returns {function} renderer
 */
const chart = (s, panelDimensions) => {
  let tooltipHandler;
  const renderer = (selection) => {
    selection.call(init(s, panelDimensions));

    const chartNode = selection.select('div.chart');

    initializeInteractions(chartNode.node(), s);

    // render legend
    chartNode.select('.legend').call(legend(s));

    const legendHeight = chartNode.select('.legend').node().getBoundingClientRect().height;

    const svg = chartNode.select('svg');
    const imageHeight = panelDimensions.y - legendHeight;

    svg.attr('height', Math.max(imageHeight, 0));

    const { top, right, bottom, left } = margin(s, panelDimensions);

    // subtract rendered height of legend from dimensions
    const dimensions = {
      x: panelDimensions.x - left - right,
      y: imageHeight - top - bottom,
    };

    if (dimensions.y > 0) {
      const wrapper = chartNode
        .select('.graphic')
        .select('svg')
        .call(position(s, { x: panelDimensions.x, y: imageHeight }))
        .select(`g.${WRAPPER_CLASS}`);

      wrapper
        .call(axes(s, dimensions))
        .call((s.layer ? layer : marks)(s, dimensions))
        .call(keyboard(s))
        .call(interactions(s));
      selection.call(testAttributes);
    }
  };

  renderer.tooltip = (h) => {
    if (typeof h === 'undefined') {
      return tooltipHandler;
    } else {
      if (typeof h === 'function') {
        tooltipHandler = h;
        s.usermeta.tooltipHandler = true;
      } else {
        throw new Error(`tooltip handler must be a function, but input was of type ${typeof h}`);
      }

      return renderer;
    }
  };

  return renderer;
};

export { chart };
