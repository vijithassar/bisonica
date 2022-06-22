import {
  create,
  falconChartsDefinition,
  render,
  specificationFixture,
  testSelector,
  tooltipContentUpdate,
} from '../test-helpers.js';
import { module, test } from 'qunit';

module('Integration | Component | falcon-charts | tooltips', function () {

  test('renders a chart with SVG title tooltips', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.usermeta = { tooltipHandler: false };

    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('mark-title')).exists();
  });

  test('renders a chart without SVG title tooltips', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.usermeta = { tooltipHandler: false };

    delete spec.mark.tooltip;
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('mark-title')).doesNotExist();
  });

  test('disables SVG title tooltips when a custom tooltip handler is indicated', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.usermeta = { tooltipHandler: true };

    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('mark-title')).doesNotExist();
  });

  test('disables tooltips from the encoding hash', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.encoding.tooltip = null;
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('mark-title')).doesNotExist();
  });

  test('renders a chart with encoding values in the SVG title tooltip', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.usermeta = { tooltipHandler: false };

    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    Object.entries(spec.encoding).forEach(([channel, definition]) => {
      const field = definition.field || definition.aggregate;

      assert
        .dom(testSelector('mark-title'))
        .includesText(
          `${field}:`,
          `${field} field for ${channel} encoding is included in tooltip content`,
        );
      assert
        .dom(testSelector('mark-title'))
        .doesNotIncludeText(
          `${field}: undefined`,
          `value of ${field} field for ${channel} encoding is undefined`,
        );
    });
  });

  test('renders a stacked bar chart with SVG title tooltips', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.usermeta = { tooltipHandler: false };

    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('mark-title')).exists();
    assert.dom(testSelector('mark-title')).hasAnyText();
    assert.dom(testSelector('mark-title')).doesNotIncludeText('undefined');
  });

  test('renders a circular chart with SVG title tooltips', async function (assert) {
    const spec = specificationFixture('circular');

    spec.usermeta = { tooltipHandler: false };

    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('mark-title')).exists();
    assert.dom(testSelector('mark-title')).hasAnyText();
    assert.dom(testSelector('mark-title')).doesNotIncludeText('undefined');
  });

  test('renders a line chart with SVG title tooltips', async function (assert) {
    const spec = specificationFixture('line');

    spec.usermeta = { tooltipHandler: false };

    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('point-title')).exists();
    assert.dom(testSelector('point-title')).hasAnyText();
    assert.dom(testSelector('point-title')).doesNotIncludeText('undefined');
  });

  test('follows tooltip rendering instructions in charts with nested layers', async function (assert) {
    const graphic = specificationFixture('circular');

    graphic.mark.innerRadius = 50;

    const text = {
      mark: { type: 'text', text: 'test' },
    };
    const spec = {
      title: { text: 'layer tooltip rendering test' },
      layer: [graphic, text],
      usermeta: {},
    };

    spec.usermeta = { tooltipHandler: true };

    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('mark')).exists();
    assert.dom(testSelector('mark-title')).doesNotExist();
  });

  test('emits a CustomEvent with tooltip details in response to mouseover', async function (assert) {
    const spec = specificationFixture('circular');

    this.page = create(falconChartsDefinition());
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
      <div data-falcon-portal="tooltip"></div>
    `);

    const event = new MouseEvent('mouseover', { bubbles: true });
    let tooltipEvent = null;

    this.element.querySelector('.chart').addEventListener('tooltip', (event) => {
      // eslint-disable-next-line no-unused-vars
      tooltipEvent = event;
    });

    this.page.mark()[0].dispatchEvent(event);

    assert.equal(typeof tooltipEvent.detail.datum, 'object', 'custom event detail has datum');
    assert.equal(
      typeof tooltipEvent.detail.interaction.target.querySelector,
      'function',
      'custom event detail has original interaction event',
    );
    assert.equal(
      typeof tooltipEvent.detail.node.querySelector,
      'function',
      'custom event detail has node',
    );
  });

  test('displays a custom tooltip', async function (assert) {
    const spec = specificationFixture('circular');

    this.page = create(falconChartsDefinition());
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
      <div data-falcon-portal="tooltip"></div>
    `);

    const event = new MouseEvent('mouseover', { bubbles: true });

    this.page.mark()[0].dispatchEvent(event);

    let tooltipContent = await tooltipContentUpdate(this.element);

    assert.ok(tooltipContent.includes('group'), 'tooltip content includes key "group"');
    assert.ok(
      tooltipContent.includes('Custom Intelligence'),
      'tooltip content includes value "Custom Intelligence"',
    );
    assert.ok(tooltipContent.includes('value'), 'tooltip content includes key "label"');
    assert.ok(tooltipContent.includes('167'), 'tooltip content includes value "167"');
  });
});
