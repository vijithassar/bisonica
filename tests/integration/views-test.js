import qunit from 'qunit';
import { render, specificationFixture, testSelector } from '../test-helpers.js';

const { module, test } = qunit;

module('Integration | Component | falcon-charts | views', function () {
  test('renders a chart without layers', async function (assert) {
    const spec = specificationFixture('line');
    const element = render(spec);

    assert.notOk(element.querySelector(testSelector('layer')));
  });

  test('renders a chart with one layer', async function (assert) {
    const spec = { ...specificationFixture('line') };
    const lineLayer = {
      mark: spec.mark,
      encoding: spec.encoding,
    };

    delete spec.mark;
    delete spec.encoding;
    spec.layer = [lineLayer];
    const element = render(spec);

    assert.ok(element.querySelector(testSelector('layer')));
  });

  test('renders a chart with two layers', async function (assert) {
    const spec = { ...specificationFixture('line') };

    const lineLayer = {
      mark: spec.mark,
      encoding: spec.encoding,
    };

    delete spec.mark;
    delete spec.encoding;

    const ruleLayer = {
      data: { values: [{}] },
      encoding: { y: { datum: 15 } },
      mark: { type: 'rule', size: 2 },
    };

    spec.layer = [lineLayer, ruleLayer];
    const element = render(spec);

    assert.equal(element.querySelectorAll(testSelector('layer')).length, 2);
  });

  test('renders a chart with nested layer data', async function (assert) {
    const lineChartSpec = specificationFixture('line');
    const layerSpec = JSON.parse(JSON.stringify(lineChartSpec));
    const lineLayer = {
      data: { values: [...lineChartSpec.data.values] },
      mark: { ...lineChartSpec.mark },
      encoding: { ...lineChartSpec.encoding },
    };

    delete layerSpec.mark;
    delete layerSpec.encoding;
    layerSpec.layer = [lineLayer];

    const element = render(layerSpec);

    assert.ok(element.querySelector(testSelector('layer')));
    assert.ok(element.querySelector(testSelector('mark')));
  });
});
