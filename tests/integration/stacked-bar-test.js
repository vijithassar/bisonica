import qunit from 'qunit';
import { render, testSelector } from '../test-helpers.js';
import { specificationFixture } from '../test-helpers.js';

const { module, test } = qunit;

module('integration > stacked-bar', function () {
  test('renders a stacked bar chart', async function (assert) {
    const spec = specificationFixture('stackedBar');
    const element = render(spec);

    const mark = testSelector('mark');

    assert.ok(element.querySelector(mark));
    assert.ok(element.querySelector(mark).tagName, 'rect');

    const nodes = [...element.querySelectorAll(mark)];
    const nodeHasPositiveHeight = (node) => Number(node.getAttribute('height')) >= 0;
    const nodeHasZeroHeight = (node) => Number(node.getAttribute('height')) === 0;
    const nodesHavePositiveHeights = nodes.every(nodeHasPositiveHeight);
    const nodesHaveZeroHeights = nodes.every(nodeHasZeroHeight);

    assert.ok(
      nodesHavePositiveHeights,
      'all mark rects have positive numbers as height attributes',
    );
    assert.ok(!nodesHaveZeroHeights, 'some mark rects have nonzero height attributes');
  });
});
