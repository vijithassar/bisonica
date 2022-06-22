import { module, test } from 'qunit';
import { render, testSelector } from '../test-helpers.js';
import { specificationFixture } from '../test-helpers.js';

module('Integration | Component | falcon-charts', function () {
  test('renders a chart', async function (assert) {
    this.set('spec', specificationFixture('stackedBar'));
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    const single = [
      testSelector('legend'),
      testSelector('graphic'),
      testSelector('svg'),
      testSelector('marks'),
    ];

    single.forEach((selector) => assert.dom(selector).exists({ count: 1 }));

    assert.dom(testSelector('mark')).exists();
  });
});
