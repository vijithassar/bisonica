import {
  render,
  specificationFixture,
  testSelector,
  tooltipContentUpdate,
} from '../test-helpers.js';
import qunit from 'qunit';

const { module, test } = qunit;

module('integration > tooltips', function () {

  test('renders a chart with SVG title tooltips', (assert) => {
    const spec = specificationFixture('stackedBar');

    spec.usermeta = { tooltipHandler: false };

    const element = render(spec);

    assert.ok(element.querySelector(testSelector('mark-title')));
  });

  test('renders a chart without SVG title tooltips', (assert) => {
    const spec = specificationFixture('stackedBar');

    spec.usermeta = { tooltipHandler: false };

    delete spec.mark.tooltip;
    const element = render(spec);

    assert.notOk(element.querySelector(testSelector('mark-title')));
  });

  test('disables SVG title tooltips when a custom tooltip handler is indicated', (assert) => {
    const spec = specificationFixture('stackedBar');

    spec.usermeta = { tooltipHandler: true };

    const element = render(spec);

    assert.notOk(element.querySelector(testSelector('mark-title')));
  });

  test.skip('disables tooltips from the encoding hash', (assert) => {
    const spec = specificationFixture('stackedBar');

    spec.encoding.tooltip = null;
    const element = render(spec); // eslint-disable-line

    assert.dom(testSelector('mark-title')).doesNotExist();
  });

  test('renders a chart with encoding values in the SVG title tooltip', (assert) => {
    const spec = specificationFixture('stackedBar');

    spec.usermeta = { tooltipHandler: false };

    const element = render(spec);

    Object.entries(spec.encoding).forEach(([channel, definition]) => {
      const field = definition.field || definition.aggregate;
      const title = element.querySelector(testSelector('mark-title'));
      const prefix = `${field}:`;
      const undefinedText = `${field}: undefined`;
      assert.ok(title.textContent.includes(prefix), `${field} field for ${channel} encoding is included in tooltip content`)
      assert.ok(!title.textContent.includes(undefinedText), `value of ${field} field for ${channel} encoding is undefined`)
    });
  });

  test('renders a stacked bar chart with SVG title tooltips', (assert) => {
    const spec = specificationFixture('stackedBar');

    spec.usermeta = { tooltipHandler: false };

    const element = render(spec);

    assert.ok(element.querySelector(testSelector('mark-title')));
    assert.ok(element.querySelector(testSelector('mark-title')).textContent.length);
    assert.ok(!element.querySelector(testSelector('mark-title')).textContent.includes('undefined'));

  });

  test('renders a circular chart with SVG title tooltips', (assert) => {
    const spec = specificationFixture('circular');

    spec.usermeta = { tooltipHandler: false };

    const element = render(spec);

    assert.ok(element.querySelector(testSelector('mark-title')));
    assert.ok(element.querySelector(testSelector('mark-title')).textContent.length);
    assert.ok(!element.querySelector(testSelector('mark-title')).textContent.includes('undefined'));
  });

  test('renders a line chart with SVG title tooltips', (assert) => {
    const spec = specificationFixture('line');

    spec.usermeta = { tooltipHandler: false };

    const element = render(spec);

    assert.ok(element.querySelector(testSelector('point-title')));
    assert.ok(element.querySelector(testSelector('point-title')).textContent.length);
    assert.ok(!element.querySelector(testSelector('point-title')).textContent.includes('undefined'));
  });

  test('follows tooltip rendering instructions in charts with nested layers', (assert) => {
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

    const element = render(spec);

    assert.ok(element.querySelector(testSelector('mark')));
    assert.notOk(element.querySelector(testSelector('mark-title')));
  });

  test('emits a CustomEvent with tooltip details in response to mouseover', (assert) => {
    const element = render(specificationFixture('circular'));

    const event = new MouseEvent('mouseover', { bubbles: true });
    let tooltipEvent = null;

    element.querySelector('.chart').addEventListener('tooltip', (event) => {
      tooltipEvent = event;
    });

    element.querySelectorAll(testSelector('mark'))[0].dispatchEvent(event);

    assert.equal(typeof tooltipEvent.detail.datum, 'object', 'custom event detail has datum');
    assert.equal(
      typeof tooltipEvent.detail.interaction.bubbles,
      'boolean',
      'custom event detail has original interaction event',
    );
    assert.equal(
      typeof tooltipEvent.detail.node.querySelector,
      'function',
      'custom event detail has node',
    );
  });

  test.skip('displays a custom tooltip', async function (assert) {
    const spec = specificationFixture('circular'); // eslint-disable-line

    await render(`
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
