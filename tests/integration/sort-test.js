import * as d3 from 'd3';
import { module, test } from 'qunit';
import { render, testSelector } from '../test-helpers.js';
import { specificationFixture } from '../test-helpers.js';

module('Integration | Component | falcon-charts | sort', function () {
  test('renders marks in ascending order', async function (assert) {
    const spec = specificationFixture('categoricalBar');

    spec.encoding.x.sort = 'y';
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=500
      />
    `);

    const markSelector = testSelector('mark');

    const marks = [...this.element.querySelectorAll(markSelector)];
    const data = marks.map((mark) => d3.select(mark).datum());
    const values = data.map((item) => item.data._.value);
    const sorted = values.slice().sort(d3.ascending);

    assert.deepEqual(values, sorted);
  });
  test('renders marks in descending order', async function (assert) {
    const spec = specificationFixture('categoricalBar');

    spec.encoding.x.sort = '-y';
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=500
      />
    `);

    const markSelector = testSelector('mark');

    const marks = [...this.element.querySelectorAll(markSelector)];
    const data = marks.map((mark) => d3.select(mark).datum());
    const values = data.map((item) => item.data._.value);
    const sorted = values.slice().sort(d3.descending);

    assert.deepEqual(values, sorted);
  });
});
