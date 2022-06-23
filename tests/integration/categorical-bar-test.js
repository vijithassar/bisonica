import qunit from 'qunit';
import {
  nodesHavePositiveHeights,
  specificationFixture,
} from '../test-helpers.js';
import { render, testSelector } from '../test-helpers.js';

const { module, test } = qunit;

const approximate = (value) => Math.round(value * 100) / 100;

module('Integration | Component | falcon-charts | categorical-bar', function () {
  test('renders a categorical bar chart', async function (assert) {
    const spec = specificationFixture('categoricalBar');

    const element = render(spec);
    const mark = testSelector('mark');

    assert.dom(mark).exists();
    assert.dom(mark).hasTagName('rect');

    const nodes = [...element.querySelectorAll(mark)];

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

    const element = render(spec);
    assert.dom('rect.mark').hasAttribute('height', '0');
  });
});
