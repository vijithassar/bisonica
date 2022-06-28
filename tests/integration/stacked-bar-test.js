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

    const nodeHasPositiveHeight = (node) => Number(node.getAttribute('height')) >= 0;
    const nodesHavePositiveHeights = [...element.querySelectorAll(mark)].every(
      nodeHasPositiveHeight,
    );

    assert.ok(
      nodesHavePositiveHeights,
      'all mark rects have positive numbers as height attributes',
    );
  });
});
