import * as d3 from 'd3';

import { axisTickLabelText, rotation } from './text.js';
import { barWidth } from './marks.js';
import { degrees, isDiscrete, noop, overlap } from './helpers.js';
import { encodingChannelQuantitative, encodingType } from './encodings.js';
import { feature } from './feature.js';
import { layerMatch } from './views.js';
import { parseScales } from './scales.js';
import { tickMargin } from './position.js';
import { timeMethod, timePeriod } from './time.js';

/**
 * tick count specifier
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 */
const ticks = (s, channel) => {
  const tickCount = s.encoding[channel].axis?.tickCount;
  const hasTimeUnit = !!s.encoding[channel]?.timeUnit;

  if (typeof tickCount === 'number') {
    return tickCount;
  }

  if (encodingType(s, channel) === 'temporal' && hasTimeUnit) {
    let timeSpecifier;

    if (typeof tickCount === 'string') {
      timeSpecifier = tickCount;
    } else if (typeof tickCount?.interval === 'string') {
      timeSpecifier = tickCount.interval;
    } else {
      timeSpecifier = timePeriod(s, channel);
    }

    if (timeSpecifier) {
      let step = tickCount?.step || 1;

      return d3[timeMethod(timeSpecifier)].every(step);
    }
  }

  const scales = parseScales(s);

  const hasSingleValue = scales[channel].domain()[0] === scales[channel].domain()[1];

  if (hasSingleValue) {
    return 1;
  }

  const max = scales[channel].domain()[1];
  const hasIntegerMax = max === parseInt(max, 10);
  const hasZeroMin = scales[channel].domain()[0] === 0;
  const hasSingleDigitMax = max < 10;

  if (hasIntegerMax && hasZeroMin && hasSingleDigitMax) {
    return max;
  }

  return 10;
};

/**
 * retrieve axis title
 * @param {object} s Vega Lite specification
 * @param {object} channel visual encoding channel
 * @returns {string} title
 */
const title = (s, channel) => {
  const encoding = s.encoding[channel];

  return encoding.axis?.title || encoding.aggregate || encoding.field;
};

/**
 * alternate ticks
 * @param {object} s Vega Lite specification
 * @returns {function} alternatassdfe
 */
const alternate = (s) => {
  return (selection) => {
    ['x', 'y'].forEach((channel) => {
      if (typeof s.encoding[channel] === 'undefined') {
        return;
      }

      const axisSelector = `.${channel}`;
      const ticks = selection.select(axisSelector).selectAll('.tick');

      if (encodingType(s, channel) !== 'nominal') {
        if (overlap([...ticks.nodes()])) {
          selection.select(axisSelector).classed('alternate-ticks', true);
        }
      }
    });
  };
};

/**
 * render axis tick text content
 * @param {object} s Vega Lite specification
 * @param {*} channel encoding channel
 * @returns {function} tick text renderer
 */
const tickText = (s, channel) => {
  return (selection) => {
    const hasLabels = feature(s)[`hasAxisLabels${channel.toUpperCase()}`]();
    const ticks = selection.selectAll('.tick').select('text');

    if (hasLabels) {
      ticks.call(axisTickLabelText(s, channel));
    } else {
      ticks.text('');
    }
  };
};

/**
 * render x axis
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} x axis renderer
 */
const x = (s, dimensions) => {
  return (selection) => {
    const scales = parseScales(s, dimensions);
    const barOffset = feature(s).isBar() ? barWidth(s, dimensions) : 0;

    const axis = d3.axisBottom(scales.x);

    axis.ticks(ticks(s, 'x'));

    // removing axis ticks for bar charts makes the text labels
    // appear to label the bars directly
    if (feature(s).isBar()) {
      axis.tickSize(0);
    }

    const x = selection.select('g.x').attr('class', 'x');
    const xAxis = x
      .append('g')
      .attr('class', () => {
        const classes = ['axis', encodingType(s, 'x'), rotation(s, 'x') ? 'angled' : ''];

        return classes.join(' ');
      })
      .classed(encodingType(s, 'x'), true);

    xAxis.call(axis);
    x.call(tickText(s, 'x'));

    if (feature(s).hasAxisTitleX()) {
      const xTitle = x.append('text').attr('class', 'title');

      xTitle
        .attr('x', dimensions.x * 0.5 - barOffset * 0.5)
        .attr('y', () => {
          const axisHeight = xAxis.node().getBBox().height * 2;
          const tickHeight = tickMargin(s, dimensions).bottom;
          const yPosition = axisHeight + tickHeight;

          return yPosition;
        })
        .text(title(s, 'x'));
    }

    const shift = feature(s).isBar() && encodingType(s, 'x') === 'temporal';

    x.attr('transform', () => {
      const xOffset = shift ? barOffset * 0.5 : 0;
      let yOffset;

      if (scales.y) {
        yOffset =
          isDiscrete(s, 'y') || encodingType(s, 'y') === 'temporal'
            ? scales.y.range().pop()
            : scales.y.range()[0];
      } else {
        if (feature(s).isBar() && !feature(s).hasEncodingY()) {
          yOffset = barWidth(s, dimensions)
        } else {
          yOffset = 0;
        }
      }

      return `translate(${xOffset},${yOffset})`;
    });

    const angle = degrees(rotation(s, 'x'));

    if (angle) {
      x.selectAll('.tick text')
        .attr('transform', function () {
          const textHeight = d3.select(this).node().getBBox().height;
          const position = [textHeight * 0.5 * -1, 0];

          return `translate(${position.join(', ')}) rotate(${angle})`;
        })
        .attr('text-anchor', () => {
          const degrees = angle % 360;
          const below = degrees > 0 && degrees < 180;

          return below ? 'start' : 'end';
        });
    }

    return axis;
  };
};

/**
 * render y axis
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} y axis renderer
 */
const y = (s, dimensions) => {
  return (selection) => {
    const scales = parseScales(s, dimensions);
    const barOffset = feature(s).isBar() ? barWidth(s, dimensions) : 0;

    const axis = d3.axisLeft(scales.y);

    axis.ticks(ticks(s, 'y'));

    const y = selection.select('g.y');
    const yAxis = y.append('g').classed('axis', true).classed(encodingType(s, 'y'), true);

    yAxis.call(axis).select('.domain').attr('stroke-width', 0);
    y.call(tickText(s, 'y'));

    const angle = degrees(rotation(s, 'y'));

    if (typeof angle !== 'undefined') {
      yAxis.selectAll('.tick text').attr('transform', function () {
        const textHeight = d3.select(this).node().getBBox().height;
        const position = [textHeight * 0.5 * -1, 0];

        return `translate(${position.join(', ')}) rotate(${angle})`;
      });
    }

    if (feature(s).hasAxisTitleY()) {
      const yTitle = y.append('text').attr('class', 'title');
      const yTitlePadding = {
        x: 0.2,
      };
      const yTitlePosition = {
        x: yAxis.node().getBBox().width * (1 + yTitlePadding.x) * -1,
        y: dimensions.y * 0.5,
      };

      yTitle
        .attr('x', yTitlePosition.x)
        .attr('y', yTitlePosition.y)
        .attr('transform', `rotate(270 ${yTitlePosition.x} ${yTitlePosition.y})`)
        .text(title(s, 'y'));
    }

    // extend y axis ticks across the whole chart
    if ((feature(s).isBar() || feature(s).isLine()) && encodingChannelQuantitative(s) === 'y') {
      selection
        .select('.y .axis')
        .selectAll('.tick')
        .select('line')
        .attr('x1', () => {
          if (feature(s).hasEncodingX()) {
            return scales.x.range()[1] + barOffset;
          }
        });
    }
  };
};

/**
 * render chart axes
 * @param {object} _s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} renderer
 */
const axes = (_s, dimensions) => {
  const test = (s) => {
    if (!_s.layer) {
      return s;
    } else {
      return s.encoding?.x?.type && s.encoding?.y?.type;
    }
  };
  let s = layerMatch(_s, test);

  if (!s) {
    return noop;
  }

  const renderer = (selection) => {
    if (typeof s.encoding !== 'object') {
      return noop;
    }

    const axes = selection.select('g.axes');

    if (feature(s).hasEncodingY()) {
      axes.call(y(s, dimensions));
    }

    if (feature(s).hasEncodingX()) {
      axes.call(x(s, dimensions));
    }

    axes.call(alternate(s));
  };

  return renderer;
};

export { axes, ticks };
