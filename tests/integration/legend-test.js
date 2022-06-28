import qunit from 'qunit';
import { render, specificationFixture, testSelector } from '../test-helpers.js';

const { module, test } = qunit;

module('Integration | Component | falcon-charts | legend', function () {
  test('renders a chart with legend', async function (assert) {
    const spec = specificationFixture('stackedBar');
    const element = render(spec);

    assert.ok(element.querySelector(testSelector('legend')));
  });

  test('renders a chart with legend automatically omitted', async function (assert) {
    const spec = specificationFixture('categoricalBar');
    const element = render(spec);
    assert.equal(element.querySelector(testSelector('legend')).textContent, '');
  });

  test('renders a chart with legend explicitly omitted', async function (assert) {
    const spec = specificationFixture('line');

    spec.encoding.color.legend = null;
    const element = render(spec);

    assert.equal(element.querySelector(testSelector('legend')).textContent, '');
  });

  test('renders a legend with all categories', async function (assert) {
    const spec = specificationFixture('line');
    const categories = [...new Set(spec.data.values.map((item) => item.group))];

    const element = render(spec);

    assert.equal(element.querySelectorAll(testSelector('legend-pair')).length, categories.length)
  });

  test.skip('partitions legend into popup when content overflows', async function (assert) {
    const spec = specificationFixture('line');
    const element = render(spec);
    assert.ok(element.querySelector(testSelector('legend-items-more')));
  });

  test('renders legend in full when content does not overflow', async function (assert) {
    const spec = specificationFixture('line');

    const ids = new Map();

    // it's not possible to change the window size during these tests
    // so instead mutate the data set such that the strings are short
    spec.data.values = spec.data.values.map((item) => {
      if (!ids.has(item.group)) {
        ids.set(item.group, `${ids.size + 1}`);
      }

      return { ...item, group: ids.get(item.group) };
    });
    const element = render(spec);

    assert.notOk(element.querySelector(testSelector('legend-items-more')));
  });
});
