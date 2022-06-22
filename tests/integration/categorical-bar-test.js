import { module, test } from 'qunit';
import {
  nodesHavePositiveHeights,
  specificationFixture,
} from '../test-helpers.js';
import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';
import { testSelector } from 'test-support';

const approximate = (value) => Math.round(value * 100) / 100;

module('Integration | Component | falcon-charts | categorical-bar', function (hooks) {
  setupRenderingTest(hooks);
  test('renders a categorical bar chart', async function (assert) {
    const spec = specificationFixture('categoricalBar');

    this.set('spec', spec);
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
    const spec = specificationFixture('categoricalBar');

    spec.data.values.forEach((item) => {
      item.value = 0;
    });

    this.set('spec', spec);
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
