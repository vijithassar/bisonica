import { module, test } from 'qunit';
import { render, testSelector } from '../test-helpers.js';
import { specificationFixture } from '../test-helpers.js';

module('Integration | Component | falcon-charts | stacked-bar', function () {
  test('renders a stacked bar chart', async function (assert) {
    this.set('spec', specificationFixture('stackedBar'));
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    const mark = testSelector('mark');

    assert.dom(mark).exists();
    assert.dom(mark).hasTagName('rect');

    const nodeHasPositiveHeight = (node) => Number(node.getAttribute('height')) >= 0;
    const nodesHavePositiveHeights = [...this.element.querySelectorAll(mark)].every(
      nodeHasPositiveHeight,
    );

    assert.ok(
      nodesHavePositiveHeights,
      'all mark rects have positive numbers as height attributes',
    );
  });
});
