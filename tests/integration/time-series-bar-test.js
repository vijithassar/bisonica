import { module, test } from 'qunit';
import {
  nodesHavePositiveHeights,
  render,
  specificationFixture,
  testSelector,
} from '../test-helpers.js';

const approximate = (value) => Math.round(value * 100) / 100;

module('Integration | Component | falcon-charts | temporal-bar', function () {
  test('renders a time series bar chart', async function (assert) {
    const spec = specificationFixture('temporalBar');

    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height={{500}}
        @width={{1000}}
      />
    `);

    const mark = testSelector('mark');

    assert.dom(mark).exists();
    assert.dom(mark).hasTagName('rect');

    const nodes = [...this.element.querySelectorAll(mark)];

    assert.ok(
      nodesHavePositiveHeights(nodes),
      'all mark rects have positive numbers as height attributes',
    );

    let baseline = nodes[0].getBoundingClientRect().bottom;

    nodes.forEach((node, i) => {
      let { bottom } = node.getBoundingClientRect();

      assert.equal(
        approximate(bottom),
        approximate(baseline),
        `Rect #${i} starts at the correct position: about: ${approximate(baseline)}`,
      );
    });
  });

  test('handles input data with all zero values', async function (assert) {
    const spec = specificationFixture('temporalBar');

    spec.data.values.forEach((item) => {
      item.value = 0;
    });

    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height={{500}}
        @width={{1000}}
      />
    `);

    assert.dom('rect.mark').hasAttribute('height', '0');
  });
});
