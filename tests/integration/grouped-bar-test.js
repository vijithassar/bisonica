import { module, test } from 'qunit';
import { render, testSelector } from '../test-helpers.js';
import { setupRenderingTest } from 'ember-qunit';
import { specificationFixture } from '../test-helpers.js';

module('Integration | Component | falcon-charts | grouped-bar', function (hooks) {
  setupRenderingTest(hooks);
  test('renders a grouped bar chart', async function (assert) {
    this.set('spec', specificationFixture('groupedBar'));
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

    const nodes = [...this.element.querySelectorAll(mark)];
    const nodesHavePositiveHeights = nodes.every(nodeHasPositiveHeight);

    assert.ok(
      nodesHavePositiveHeights,
      'all mark rects have positive numbers as height attributes',
    );

    let baseline = nodes[0].getBoundingClientRect().bottom;
    const nodesHaveIdenticalBaseline = nodes.every((node) => {
      return Math.floor(node.getBoundingClientRect().bottom) === Math.floor(baseline);
    });

    assert.ok(nodesHaveIdenticalBaseline, 'all bars start from the same vertical position');
  });
});
