import { categoricalBarChartSpec } from '@crowdstrike/falcon-charts/components/falcon-charts/-meta/specification-fixtures/categorical-bar';
import { circularChartSpec } from '@crowdstrike/falcon-charts/components/falcon-charts/-meta/specification-fixtures/circular';
import { groupedBarChartSpec } from '@crowdstrike/falcon-charts/components/falcon-charts/-meta/specification-fixtures/grouped-bar';
import { lineChartSpec } from '@crowdstrike/falcon-charts/components/falcon-charts/-meta/specification-fixtures/line';
import { meta } from './chart/meta';
import { rulesSpec } from '@crowdstrike/falcon-charts/components/falcon-charts/-meta/specification-fixtures/rules';
import { scatterPlotSpec } from '@crowdstrike/falcon-charts/components/falcon-charts/-meta/specification-fixtures/scatter-plot';
import { scopeIdentifier, testSelector } from 'test-support';
import { select } from 'd3';
import { stackedBarChartSpec } from '@crowdstrike/falcon-charts/components/falcon-charts/-meta/specification-fixtures/stacked-bar';
import { temporalBarChartSpec } from '@crowdstrike/falcon-charts/components/falcon-charts/-meta/specification-fixtures/temporal-bar';

const TEST_SELECTORS = {
  tooltipContent: 'chart-tooltip-content',
  marks: 'marks',
  mark: 'mark',
};

export function falconChartsDefinition(identifier) {
  const page = {
    scope: scopeIdentifier(identifier),
    marks: () => document.querySelector(testSelector(TEST_SELECTORS.marks)),
    mark: () => [...document.querySelectorAll(testSelector(TEST_SELECTORS.mark))],
    tooltipContent: () => {
      return document.querySelector(testSelector(TEST_SELECTORS.tooltipContent));
    },
  };

  page.marksWithUrls = () => page.mark().filter((mark) => select(mark).datum().url);

  return page;
}

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

  meta(result);

  return result;
}
