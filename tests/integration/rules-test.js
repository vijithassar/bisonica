import qunit from 'qunit';
import { render, testSelector } from '../test-helpers.js';
import { specificationFixture } from '../test-helpers.js';

const { module, test } = qunit;

module('Integration | Component | falcon-charts | rules', function () {
  test('renders rules', async function (assert) {
    const spec = specificationFixture('rules');
    const element = render(spec);

    const markSelector = testSelector('mark');
    const axisSelectors = {
      y: testSelector('axes-y'),
      x: testSelector('axes-x'),
    };
    const mark = [...this.element.querySelectorAll(markSelector)];

    assert.dom(axisSelectors.y).exists();
    assert.dom(axisSelectors.x).doesNotExist();
    assert.dom(markSelector).exists();
    assert.dom(markSelector).hasTagName('line');
    mark.forEach((item) => {
      assert.equal(
        item.getAttribute('y1'),
        item.getAttribute('y2'),
        'rule y attributes are the same',
      );
      assert.notEqual(
        item.getAttribute('x1'),
        item.getAttribute('x2'),
        'rule x attributes are not the same',
      );
    });
  });
});
