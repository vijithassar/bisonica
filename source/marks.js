import * as d3 from 'd3';

import { BAR_WIDTH_MINIMUM } from './config.js';
import { createAccessors } from './accessors.js';
import {
  createEncoders,
  encodingChannelQuantitative,
  encodingType,
  encodingValue,
  encodingValueQuantitative,
} from './encodings.js';
import { data, pointData } from './data.js';
import { datum, isDiscrete, key, missingSeries, values } from './helpers.js';
import { feature } from './feature.js';
import { memoize } from './memoize.js';
import { parseScales } from './scales.js';
import { parseTime, timePeriod } from './time.js';
import { sortMarkData } from './sort.js';
import { tooltipContent, tooltips } from './tooltips.js';

/**
 * aggregate and sort mark data
 * @param {object} s Vega Lite specification
 * @returns {array} aggregated and sorted data for data join
 */
const markData = (s) => {
  const series = Array.isArray(data(s)) && data(s).every(Array.isArray);

  if (series) {
    return data(s).map((item) => item.sort(sortMarkData(s)));
  } else {
    return data(s).sort((a, b) => sortMarkData(s)(a, b));
  }
};

const category = {
  get(key) {
    return this.datum.get(key) || this.datum.get(d3.select(key).datum()) || this.node.get(key);
  },
  datum: new Map(),
  node: d3.local(),
  set(key, category) {
    const isNode = typeof key.querySelector === 'function';

    if (isNode) {
      this.datum.set(d3.select(key).datum(), category);
      this.node.set(key, category);
    } else {
      this.datum.set(key, category);
    }
  },
};

const stroke = 3;

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

/**
 * bar chart bar width
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {number} bar width
 */
const _barWidth = (s, dimensions) => {
  const channel = ['x', 'y'].find((channel => channel !== encodingChannelQuantitative(s)));
  const barWidthMaximum = dimensions[channel] / 3;
  const stacked = markData(s);
  const type = encodingType(s, channel);
  const temporal = type === 'temporal';
  const customDomain = s.encoding[channel]?.scale?.domain?.length;

  let count;

  if (customDomain) {
    count = customDomain;
  } else if (temporal) {
    // this check is logically the same as parseScales()[channel].domain()
    // but writing it that way would be circular
    const domain = s.encoding[channel].scale?.domain?.map(parseTime);
    const extent = d3.extent(stacked.flat(), (d) => parseTime(d.data.key));
    const endpoints = domain || extent;
    const periods = d3[timePeriod(s, channel)].count(endpoints[0], endpoints[1]);
    count = periods;
  } else {
    count = d3.max(stacked, (d) => d.length);
  }

  const dynamic = (dimensions[channel] / count) * 0.5;

  if (dynamic > BAR_WIDTH_MINIMUM && dynamic < barWidthMaximum) {
    return dynamic;
  } else if (dynamic < BAR_WIDTH_MINIMUM) {
    return BAR_WIDTH_MINIMUM;
  } else if (dynamic > barWidthMaximum) {
    return barWidthMaximum;
  }
};
const barWidth = memoize(_barWidth);

/**
 * mark tagName
 * @param {object} s Vega Lite specification
 * @returns {('rect'|'path'|'circle'|'line')} tagName to use in DOM for mark
 */
const markSelector = (s) => {
  if (feature(s).isBar()) {
    return 'rect';
  } else if (feature(s).isLine() || feature(s).isCircular() || feature(s).isArea()) {
    return 'path';
  } else if (!feature(s).isLine() && feature(s).hasPoints()) {
    return 'circle';
  } else if (feature(s).isRule()) {
    return 'line';
  }
};

/**
 * determine the selector string used for interactions
 * @param {object} _s Vega Lite specification
 * @returns {string} DOM selector string
 */
const markInteractionSelector = (_s) => {
  const s = !feature(_s).hasLayers() ? _s : _s.layer.find((layer) => !feature(layer).isRule());

  if (feature(s).isLine()) {
    return '.marks circle.point.mark';
  } else {
    return `.marks ${markSelector(s)}`;
  }
};

/**
 * determine which way marks are oriented
 * @param {object} s Vega Lite specification
 */
const layoutDirection = (s) => {
  if (s.encoding.x?.type === 'quantitative') {
    return 'horizontal';
  } else if (s.encoding.y?.type === 'quantitative') {
    return 'vertical';
  }
};

/**
 * shuffle around mark encoders to
 * facilitate bidirectional layout
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {object} bar encoder methods
 */
const stackEncoders = (s, dimensions) => {
  const encoders = createEncoders(s, dimensions, createAccessors(s));
  const vertical = layoutDirection(s) === 'vertical';
  const laneChannel = vertical ? 'x' : 'y';
  const lane = encoders[laneChannel];
  const start = encoders.start;
  const length = encoders.length;
  const width = () => barWidth(s, dimensions);

  return {
    x: vertical ? lane : start,
    y: vertical ? start : lane,
    height: vertical ? length : width,
    width: vertical ? width : length,
  };
};

/**
 * render a single bar chart mark
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} single mark renderer
 */
const barMark = (s, dimensions) => {
  const { x, y, height, width } = stackEncoders(s, dimensions);

  const markRenderer = (selection) => {
    const rect = selection.append(markSelector(s));

    rect
      .attr('role', 'region')
      .attr('aria-roledescription', 'data point')
      .attr('tabindex', -1)
      .attr('class', 'block mark')
      .attr('y', feature(s).hasEncodingY() ? y : 0)
      .attr('x', feature(s).hasEncodingX() ? x : 0)
      .attr('aria-label', (d) => {
        return markDescription(s)(d);
      })
      .attr('height', height)
      .attr('width', width)
      .classed('link', encodingValue(s, 'href'))
      .call(tooltips(s));
  };

  return markRenderer;
};

/**
 * lane transform for all bar marks
 * @param {*} s
 * @param {*} dimensions
 * @returns {string} transform
 */
const barMarksTransform = (s, dimensions) => {
  const translate = [0, 0];
  let offsetChannel;
  let index;

  if (encodingType(s, 'y') === 'quantitative' && feature(s).hasEncodingX()) {
    offsetChannel = 'x';
    index = 0;
  } else if (encodingType(s, 'x') === 'quantitative' && feature(s).hasEncodingY()) {
    offsetChannel = 'y';
    index = 1;
  }

  const offset = isDiscrete(s, offsetChannel) ? barWidth(s, dimensions) * 0.5 : 0;

  if (typeof index === 'number') {
    translate[index] = offset;
  }

  return `translate(${translate.join(',')})`;
};

/**
 * render bar chart marks
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} bar renderer
 */
const barMarks = (s, dimensions) => {
  const encoders = createEncoders(s, dimensions, createAccessors(s, 'series'));
  const renderer = (selection) => {
    const marks = selection
      .append('g')
      .attr('class', 'marks')
      .attr('transform', barMarksTransform(s, dimensions));

    const series = marks
      .selectAll('g')
      .data(markData(s))
      .enter()
      .append('g')
      .each(function (d) {
        category.set(this, d.key);
        d.forEach((item) => {
          category.set(item, d.key);
        });
      })
      .attr('class', (d) => {
        return ['series', key(category.get(d))].join(' ');
      })
      .attr('role', 'region')
      .attr('aria-label', (d) => `${d.key}`)
      .style('fill', encoders.color);

    series.order();

    series
      .selectAll(markSelector(s))
      .data((d) => d)
      .enter()
      .call(barMark(s, dimensions));
  };

  return renderer;
};

/**
 * assign encoders to area mark methods
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {object} area encoders
 */
const areaEncoders = (s, dimensions) => {
  const {x, y, width, height } = stackEncoders(s, dimensions);
  let base = {
    y0: y,
    x0: x,
    x1: (d) => x(d) + width(d),
  };
  if (encodingChannelQuantitative(s) === 'x') {
    return {
      ...base
    };
  } else if (encodingChannelQuantitative(s) === 'y') {
    return {
      x0: x,
      y0: y,
      y1: (d) => y(d) + height(d),
    };
  }
};

/**
 * render area marks
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} area mark renderer
 */
const areaMarks = (s, dimensions) => {
  const encoders = areaEncoders(s, dimensions);
  const { color } = createEncoders(s, dimensions, createAccessors(s, 'series'));
  const renderer = (selection) => {
    const marks = selection
      .append('g')
      .attr('class', 'marks');

    const area = d3.area();

    ['x0', 'x1', 'y0', 'y1'].forEach((point) => {
      area[point](encoders[point]);
    });

    const layout = data(s);

    marks
      .selectAll(markSelector(s))
      .data(layout)
      .enter()
      .append('path')
      .attr('d', area)
      .attr('role', 'region')
      .attr('aria-roledescription', 'data series')
      .attr('tabindex', -1)
      .attr('fill', color)
      .attr('class', 'area mark')
      .attr('aria-label', (d) => d.key);

  }
  return renderer;
}

/**
 * render point marks
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} points renderer
 */
const pointMarks = (s, dimensions) => {
  const encoders = createEncoders(s, dimensions, createAccessors(s));

  const renderer = (selection) => {
    const radius = stroke * 1.2;

    const marks = selection.append('g').attr('class', () => {
      const classes = ['marks', 'points'];

      if (feature(s).isLine()) {
        classes.push('mark-group');
      }

      return classes.join(' ');
    });

    const getPointData = feature(s).isLine() ? (d) => d.values : pointData(values(s));

    const points = marks
      .selectAll('circle')
      .data(getPointData)
      .enter()
      .append('circle')
      .classed('point', true)
      .classed('mark', true)
      .attr('role', 'region')
      .attr('aria-roledescription', 'data point');

    points
      .each(function (d) {
        if (d.group) {
          category.set(this, d.group);
        }
      })
      .attr('aria-label', (d) => {
        return markDescription(s)(d);
      })
      .attr('cx', encoders.x)
      .attr('cy', encoders.y)
      .attr('r', radius)
      .classed('link', encodingValue(s, 'href'))
      .call(tooltips(s));

    if (!feature(s).isLine()) {
      points.style('stroke', encoders.color);

      if (s.mark?.filled) {
        points.style('fill', encoders.color);
      } else {
        points.style('fill-opacity', 0.001);
      }
    }
  };

  return renderer;
};

/**
 * render line chart marks
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} line renderer
 */
const lineMarks = (s, dimensions) => {
  const encoders = createEncoders(s, dimensions, createAccessors(s));
  const line = d3.line().x(encoders.x).y(encoders.y);

  const renderer = (selection) => {
    const marks = selection.append('g').attr('class', 'marks');
    const markTransforms = ['x', 'y'].map((channel) => {
      const offset = ['nominal', 'ordinal'].includes(s.encoding[channel].type);

      if (offset) {
        const scale = parseScales(s, dimensions)[channel];
        const difference = Math.abs(scale.range()[1] - scale.range()[0]);

        return difference / scale.domain().length / 2;
      }

      return 0;
    });

    if (markTransforms.some((item) => !!item)) {
      marks.attr('transform', `translate(${markTransforms.join(',')})`);
    }

    const series = marks
      .selectAll('g.series')
      .data(markData(s))
      .enter()
      .append('g')
      .classed('series', true);

    series.each((d) => {
      category.set(d, encodingValue(s, 'color')(d));
      d.values.forEach((item) => {
        category.set(item, d.group);
      });
    });

    series.attr('fill', encoders.color);

    const path = series
      .append('g')
      .attr('class', 'mark-group line')
      .attr('aria-hidden', true)
      .append('path')
      .classed('mark', true);

    path
      .attr('d', (d) => line(d.values))
      .attr('aria-label', (d) => {
        const series = category.get(d);

        return typeof series === 'string' && series !== missingSeries() ? series : 'line';
      })
      .style('fill', 'none')
      .style('stroke', encoders.color)
      .style('stroke-width', stroke);

    if (s.mark.point) {
      series.call(pointMarks(s, dimensions));
    }
  };

  return renderer;
};

/**
 * maximum viable radius for a given set of dimensions
 * @param {object} dimensions chart dimensions
 * @returns {number} radius
 */
const radius = (dimensions) => Math.min(dimensions.x, dimensions.y) * 0.5;

/**
 * render arc marks for a circular pie or donut chart
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} circular chart arc renderer
 */
const circularMarks = (s, dimensions) => {
  const outerRadius = radius(dimensions);
  const innerRadiusRatio = s.mark?.innerRadius ? s.mark.innerRadius / 100 : 0;
  const innerRadius = outerRadius * innerRadiusRatio;
  const { color } = parseScales(s);
  const sort = (a, b) => color.domain().indexOf(a.group) - color.domain().indexOf(b.group);
  const layout = d3.pie().value(encodingValueQuantitative(s)).sort(sort);
  const encoders = createEncoders(s, dimensions, createAccessors(s));
  const renderer = (selection) => {
    const marks = selection.append('g').attr('class', 'marks');
    const mark = marks
      .selectAll('path')
      .data(layout(markData(s)))
      .enter()
      .append('path')
      .attr('role', 'region')
      .attr('aria-roledescription', 'data point')
      .each(function (d) {
        category.set(this, d.data.key);
      })
      .attr('class', 'mark arc');
    const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius);

    mark
      .attr('d', arc)
      .attr('aria-label', (d) => {
        return markDescription(s)(d);
      })
      .style('fill', encoders.color)
      .classed('link', (d) => {
        return encodingValue(s, 'href')(datum(s, d))
      })
      .call(tooltips(s));
  };

  return renderer;
};

/**
 * determine orientation of rule marks
 * @param {object} s Vega Lite specification
 * @returns {('diagonal'|'horizontal'|'vertical')} rule orientation
 */
const ruleDirection = (s) => {
  if (s.encoding.x && s.encoding.x2 && s.encoding.y && s.encoding.y2) {
    return 'diagonal';
  }

  if (s.encoding.y && !s.encoding.x) {
    return 'horizontal';
  }

  if (s.encoding.x && !s.encoding.y) {
    return 'vertical';
  }

  if (s.encoding.x && s.encoding.y) {
    if (s.encoding.x2) {
      return 'horizontal';
    }

    if (s.encoding.y2) {
      return 'vertical';
    }
  }
};

/**
 * render rule marks
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} rule renderer
 */
const ruleMarks = (s, dimensions) => {
  const renderer = (selection) => {
    const marks = selection.append('g').attr('class', 'marks');
    const encoders = createEncoders(s, dimensions, createAccessors(s));

    const rule = {};

    rule.vertical = (selection) => {
      selection
        .attr('x1', encoders.x)
        .attr('x2', encoders.x)
        .attr('y1', encoders.y || 0)
        .attr('y2', encoders.y2 || dimensions.y);
    };

    rule.horizontal = (selection) => {
      selection
        .attr('x1', encoders.x || 0)
        .attr('x2', encoders.x2 || dimensions.x)
        .attr('y1', encoders.y)
        .attr('y2', encoders.y);
    };

    const mark = marks.selectAll('line').data(values(s)).enter().append('line');

    mark
      .call(rule[ruleDirection(s)])
      .each(function (d) {
        category.set(this, encodingValue(s, 'color')(d));
      })
      .style('stroke', encoders.color)
      .attr('class', 'mark rule')
      .attr('role', 'region')
      .attr('aria-roledescription', 'data point')
      .attr('aria-label', (d) => {
        return markDescription(s)(d);
      })
      .style('fill', encoders.color);
  };

  return renderer;
};

const textMarks = (s, dimensions) => {
  return (selection) => {
    const marks = selection.append('g').attr('class', 'marks');
    const encoders = createEncoders(s, dimensions, createAccessors(s));

    let text;

    if (feature(s).hasData()) {
      text = marks.selectAll('text').data(markData(s)).enter().append('text').attr('class', 'mark');
      text.text(encoders.text);
    } else if (s.mark.text) {
      text = marks.append('text').classed('mark', true);
      text.text(s.mark.text);
    }

    // encoded attributes
    ['x', 'y'].forEach((channel) => {
      if (typeof encoders[channel] === 'function') {
        text.attr(channel, encoders[channel]);
      }
    });

    // encoded attributes with aliases
    if (encoders.color) {
      text.attr('fill', encoders.color);
    }

    // static attributes
    ['dx', 'dy'].forEach((attribute) => {
      if (s.mark[attribute]) {
        text.attr(attribute, s.mark[attribute]);
      }
    });

    // styles with aliases
    const styles = {
      fontSize: 'font-size',
      font: 'font-family',
      fontStyle: 'font-style',
      fontWeight: 'font-weight',
    };

    Object.entries(styles).forEach(([key, value]) => {
      if (s.mark[key]) {
        text.style(value, s.mark[key]);
      }
    });

    text.attr('text-anchor', s.mark.align || 'middle');
    text.attr('alignment-baseline', s.mark.baseline || 'baseline');

    const dy = text.node().getBoundingClientRect().height * 0.25;

    text.attr('transform', `translate(0,${dy})`);
    text.classed('link', encodingValue(s, 'href'));

  };
};

/**
 * select an appropriate mark renderer
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} mark renderer
 */
const marks = (s, dimensions) => {
  try {
    if (feature(s).isBar()) {
      return barMarks(s, dimensions);
    } else if (feature(s).isArea()) {
      return areaMarks(s, dimensions);
    } else if (feature(s).isCircular()) {
      return circularMarks(s, dimensions);
    } else if (feature(s).isLine()) {
      return lineMarks(s, dimensions);
    } else if (feature(s).isRule()) {
      return ruleMarks(s, dimensions);
    } else if (feature(s).hasPoints() && !feature(s).isLine()) {
      return pointMarks(s, dimensions);
    } else if (feature(s).isText()) {
      return textMarks(s, dimensions);
    }
  } catch (error) {
    error.message = `could not render marks - ${error.message}`;
    throw error;
  }
};

export { marks, radius, barWidth, layoutDirection, markSelector, markInteractionSelector, category };
