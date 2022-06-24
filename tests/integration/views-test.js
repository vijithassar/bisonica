import { module, test } from 'qunit';
import { render, specificationFixture, testSelector } from '../test-helpers.js';
import { setupRenderingTest } from 'ember-qunit';

module('Integration | Component | falcon-charts | views', function (hooks) {
  setupRenderingTest(hooks);
  test('renders a chart without layers', async function (assert) {
    this.set('spec', specificationFixture('line'));
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('layer')).doesNotExist();
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
    this.set('spec', spec);
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('layer')).exists();
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
    this.set('spec', spec);
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('layer')).exists({ count: 2 });
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

    this.set('spec', layerSpec);
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('layer')).exists();
    assert.dom(testSelector('mark')).exists();
  });
});
