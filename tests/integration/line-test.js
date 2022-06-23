import qunit from 'qunit';
import { render, specificationFixture } from '../test-helpers.js';
import { testSelector } from '../test-helpers.js';

const { module, test } = qunit;

const pointSelector = testSelector('marks-mark-point');

module('Integration | Component | falcon-charts | line', function () {
  test('renders a line chart', async function (assert) {
    const spec = specificationFixture('line');
    await render(`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    const selector = testSelector('mark');

    assert.dom(selector).exists();
    assert.dom(selector).hasAttribute('d');

    const pathStrings = [...this.element.querySelectorAll(selector)].map((node) =>
      node.getAttribute('d'),
    );

    pathStrings.forEach((pathString) => {
      assert.ok(pathString.length > 0, 'path string is not empty');
      assert.equal((pathString.match(/NaN/g) || []).length, 0, 'path string does not contain NaN');
    });
  });

  test('renders a line chart with points', async function (assert) {
    const spec = specificationFixture('line');
    await render(`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);
    assert.dom(pointSelector).exists();
  });

  test('renders a line chart without points', async function (assert) {
    const spec = specificationFixture('line');

    delete spec.mark.point;
    await render(`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);
    assert.dom(pointSelector).doesNotExist();
  });

  test('renders a line chart with arbitrary field names', async function (assert) {
    const spec = specificationFixture('line');
    const propertyMap = {
      label: '_',
      group: '*',
      value: '.',
    };

    spec.data.values = spec.data.values.map((item) => {
      Object.entries(propertyMap).forEach(([a, b]) => {
        item[b] = item[a];
        delete item[a];
      });

      return { ...item };
    });
    Object.entries(spec.encoding).forEach(([, definition]) => {
      const old = definition.field;

      definition.field = propertyMap[old];
    });
    await render(`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);
    assert.dom(pointSelector).exists();
  });
});
