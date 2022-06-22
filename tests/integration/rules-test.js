import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';
import { specificationFixture } from '../test-helpers.js';
import { testSelector } from '@crowdstrike/test-helpers/test-support';

module('Integration | Component | falcon-charts | rules', function (hooks) {
  setupRenderingTest(hooks);
  test('renders rules', async function (assert) {
    this.set('spec', specificationFixture('rules'));
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

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
