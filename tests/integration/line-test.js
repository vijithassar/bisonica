import { module, test } from 'qunit';
import { render, specificationFixture } from '../test-helpers.js';
import { testSelector } from '../test-helpers.js';

const pointSelector = testSelector('marks-mark-point');

module('Integration | Component | falcon-charts | line', function () {
  test('renders a line chart', async function (assert) {
    this.set('spec', specificationFixture('line'));
    await render(hbs`
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
    this.set('spec', specificationFixture('line'));
    await render(hbs`
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
    this.set('spec', spec);
    await render(hbs`
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
    this.set('spec', spec);
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);
    assert.dom(pointSelector).exists();
  });
});
