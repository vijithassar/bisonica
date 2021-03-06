import qunit from 'qunit';
import { render, testSelector } from '../test-helpers.js';
import { specificationFixture } from '../test-helpers.js';

const { module, test } = qunit;

module('integration > text', function () {

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

    const element = render(spec);

    const markSelector = testSelector('mark');

    assert.equal(element.querySelectorAll(markSelector).length, 1);
    assert.equal(element.querySelector(markSelector).tagName, 'text');

  });

  test('renders text marks with dynamic attributes', async function (assert) {
    const spec = specificationFixture('scatterPlot');

    spec.mark = { type: 'text' };
    spec.encoding.color = { field: 'group', type: 'nominal' };
    spec.encoding.text = { field: 'group', type: 'nominal' };

    const element = render(spec);

    const marks = [...element.querySelectorAll(testSelector('mark'))];

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
