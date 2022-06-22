import { module, test } from 'qunit';
import { render, testSelector, specificationFixture } from '../test-helpers.js';

module('Integration | Component | falcon-charts | axes', function () {
  test('renders a chart with axes', async function (assert) {
    const spec = specificationFixture('stackedBar');

    this.spec = spec;
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    const single = [testSelector('axes'), testSelector('axes-x'), testSelector('axes-y')];

    single.forEach((selector) => assert.dom(selector).exists({ count: 1 }));

    assert.dom(testSelector('tick')).exists();
  });

  test('renders a chart with custom axis titles', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.encoding.x.axis = { title: 'a' };
    spec.encoding.y.axis = { title: 'b' };
    this.set('spec', spec);
    await render(hbs`

      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);
    assert.dom(testSelector('axes-x-title')).hasText(spec.encoding.x.axis.title);
    assert.dom(testSelector('axes-y-title')).hasText(spec.encoding.y.axis.title);
  });

  test('renders a chart without y-axis tick labels', async function (assert) {
    this.spec = specificationFixture('stackedBar');
    await render(hbs`

      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    let tickLabelTexts = findAll(`${testSelector('axes-y')} .tick text`);

    assert.ok(tickLabelTexts.every((el) => el.textContent.length));

    const spec = specificationFixture('stackedBar');

    spec.encoding.y.axis.labels = false;
    this.spec = spec;
    await render(hbs`

      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);
    tickLabelTexts = findAll(`${testSelector('axes-y')} .tick text`);

    assert.ok(!tickLabelTexts.some((el) => el.textContent.length));
  });

  test('renders a chart with custom axis tick intervals', async function (assert) {
    const spec = specificationFixture('stackedBar');

    const dates = spec.data.values.map((item) => new Date(item.label));
    const differenceMilliseconds = Math.abs(Math.min(...dates) - Math.max(...dates));
    const differenceDays = Math.floor(differenceMilliseconds / (24 * 60 * 60 * 1000));

    spec.encoding.x.axis = { tickCount: { interval: 'utchour' } };
    this.spec = spec;
    await render(hbs`

      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    const hourly = findAll(`${testSelector('axes-x')} .tick`);

    assert.ok(hourly.length > differenceDays);

    spec.encoding.x.axis = { tickCount: { interval: 'utcweek' } };
    this.spec = spec;
    await render(hbs`

      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    const weekly = findAll(`${testSelector('axes-x')} .tick`);

    assert.ok(weekly.length < differenceDays);
  });

  test('renders a chart with custom axis tick steps', async function (assert) {
    const spec = specificationFixture('stackedBar');

    const dates = spec.data.values.map((item) => new Date(item.label));
    const differenceMilliseconds = Math.abs(Math.min(...dates) - Math.max(...dates));
    const differenceDays = Math.floor(differenceMilliseconds / (24 * 60 * 60 * 1000));

    spec.encoding.x.axis = { tickCount: { interval: 'utcday', step: 2 } };
    this.spec = spec;
    await render(hbs`

      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    const ticks = findAll(`${testSelector('axes-x')} .tick`);

    assert.ok(ticks.length < differenceDays);
  });

  test('renders a chart without axes', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.encoding.x.axis = { title: null };
    spec.encoding.y.axis = { title: null };
    this.spec = spec;
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    const selectors = [testSelector('axes-x-title'), testSelector('axes-y-title')];

    selectors.forEach((selector) => assert.dom(selector).doesNotExist());
  });

  test('renders a chart with truncated axis labels', async function (assert) {
    const max = 20;
    const spec = specificationFixture('categoricalBar');

    spec.encoding.x.axis = { labelLimit: max };

    this.set('spec', spec);
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    [...this.element.querySelectorAll(`${testSelector('axes-x')} .tick text`)].forEach((node) => {
      assert.ok(node.getBoundingClientRect().width <= max);
    });
  });
});
