import qunit from 'qunit';
import { render, testSelector } from '../test-helpers.js';
import { specificationFixture } from '../test-helpers.js';

const { module, test } = qunit;

module('Integration | Component | falcon-charts | text', function () {

  test('renders text marks', async function (assert) {
    const spec = {
      $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
      title: {
        text: 'text mark test',
      },
      data: {
        values: [{}],
      },
      mark: {
        type: 'text',
      },
      encoding: {
        text: {
          datum: 'A',
        },
      },
    };

    await render(`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    const markSelector = testSelector('mark');

    assert.dom(markSelector).exists({ count: 1 });
    assert.dom(markSelector).hasTagName('text');
  });

  test('renders text marks with dynamic attributes', async function (assert) {
    const spec = specificationFixture('scatterPlot');

    spec.mark = { type: 'text' };
    spec.encoding.color = { field: 'group', type: 'nominal' };
    spec.encoding.text = { field: 'group', type: 'nominal' };

    await render(`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    const marks = [...this.element.querySelectorAll(testSelector('mark'))];

    const groups = [...new Set(spec.data.values.map((item) => item.group)).values()];

    groups.forEach((group) => {
      const matchingValues = spec.data.values.filter((item) => item.group === group);
      const matchingContent = marks.filter((mark) => mark.textContent === group);

      assert.equal(
        matchingValues.length,
        matchingContent.length,
        `group ${group} has ${matchingValues.length} data values and ${matchingContent.length} mark nodes`,
      );
    });

    assert.ok(
      marks.every((mark) => mark.hasAttribute('x')),
      'every mark has x position',
    );
    assert.ok(
      marks.every((mark) => mark.hasAttribute('y')),
      'every mark has y position',
    );
    assert.ok(
      marks.every((mark) => mark.hasAttribute('fill')),
      'every mark has color',
    );
  });
});
