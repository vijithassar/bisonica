import { stackedAreaChartSpec } from '../fixtures/stacked-area.js'
import { categoricalBarChartSpec } from '../fixtures/categorical-bar.js';
import { circularChartSpec } from '../fixtures/circular.js';
import { groupedBarChartSpec } from '../fixtures/grouped-bar.js';
import { lineChartSpec } from '../fixtures/line.js';
import { rulesSpec } from '../fixtures/rules.js';
import { scatterPlotSpec } from '../fixtures/scatter-plot.js';
import { stackedBarChartSpec } from '../fixtures/stacked-bar.js';
import { temporalBarChartSpec } from '../fixtures/temporal-bar.js';
import { singleBarChartSpec } from '../fixtures/single-bar.js';
import { select } from 'd3';
import { chart } from '../source/chart.js';

export const testSelector = (string) => `[data-test-selector="${string}"]`;

export const render = (specification, dimensions = { x: 500, y: 500 }) => {
  const node = document.createElement('div');
  select(node).call(chart(specification, dimensions));
  return node;
}

const TEST_SELECTORS = {
  tooltipContent: 'chart-tooltip-content',
  marks: 'marks',
  mark: 'mark',
};

export const marksWithUrls = (element) => {
  return [
    ...element.querySelectorAll(testSelector(TEST_SELECTORS.mark))
  ].filter((mark) => select(mark).datum().url)
};

export const tooltipContentUpdate = (page) => {
  return new Promise((resolve) => {
    const observer = new MutationObserver((mutations) => {
      const toolTipText = ` ${mutations.pop().target.innerText}`.trim().replace(/\s*\n+\s*/g, '\n');

      observer.disconnect();
      resolve(toolTipText);
    });

    observer.observe(page.querySelector('[data-falcon-portal="tooltip"]'), {
      childList: true,
      subtree: true,
    });
  });
};

export const nodesHavePositiveHeights = (nodes) =>
  nodes.every((node) => {
    return Number(node.getAttribute('height')) >= 0;
  });

export function specificationFixture(type) {
  let spec;

  if (type === 'stackedBar') {
    spec = stackedBarChartSpec;
  } else if (type === 'stackedArea') {
    spec = stackedAreaChartSpec;
  } else if (type === 'singleBar') {
    spec = singleBarChartSpec;
  } else if (type === 'circular') {
    spec = circularChartSpec;
  } else if (type === 'line') {
    spec = lineChartSpec;
  } else if (type === 'categoricalBar') {
    spec = categoricalBarChartSpec;
  } else if (type === 'groupedBar') {
    spec = groupedBarChartSpec;
  } else if (type === 'temporalBar') {
    spec = temporalBarChartSpec;
  } else if (type === 'rules') {
    spec = rulesSpec;
  } else if (type === 'scatterPlot') {
    spec = scatterPlotSpec;
  } else {
    console.error(`unknown specification fixture type ${type}`);
  }

  const result = JSON.parse(JSON.stringify(spec));

  return result;
}
