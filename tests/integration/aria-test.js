import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { specificationFixture, testSelector } from '../test-helpers.js';

module('Integration | Component | falcon-charts | aria', function () {

  test('aria-label matches tooltip by default', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.usermeta = { tooltipHandler: false };

    this.set('spec', spec);
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    const marks = [...this.element.querySelectorAll(testSelector('mark'))];
    const labels = marks.map((mark) => mark.getAttribute('aria-label'));
    const titles = marks.map((mark) => mark.querySelector(testSelector('mark-title')));
    const match = labels.every((label, index) => label === titles[index].textContent);

    assert.ok(match);
  });

  test('aria-label matches tooltip when tooltip channel is specified', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.usermeta = { tooltipHandler: false };

    spec.mark.tooltip = true;
    spec.encoding.tooltip = 'value';
    this.set('spec', spec);
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    const marks = [...this.element.querySelectorAll(testSelector('mark'))];
    const labels = marks.map((mark) => mark.getAttribute('aria-label'));
    const titles = marks.map((mark) => mark.querySelector(testSelector('mark-title')).textContent);
    const match = labels.every((label, index) => label === titles[index]);

    assert.ok(match);
  });

  test('aria-label can be set with description field', async function (assert) {
    this.set('spec', specificationFixture('stackedBar'));
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('mark')).hasAttribute('aria-label');
  });

  test('aria-label can be set to a calculate transform field', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.transform = [{ calculate: "'START:' + datum.value + ':END'", as: 'test' }];
    spec.encoding.description = { field: 'test' };

    this.set('spec', spec);
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('mark')).hasAttribute('aria-label', /^START.*END$/);
  });

  test('aria-label can diverge from tooltip', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.usermeta = { tooltipHandler: false };

    spec.transform = [
      { calculate: "'a'", as: 'a' },
      { calculate: "'b'", as: 'b' },
    ];
    spec.encoding.description = { field: 'a' };
    spec.encoding.tooltip = { field: 'b' };

    this.set('spec', spec);
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    const marks = [...this.element.querySelectorAll(testSelector('mark'))];
    const labels = marks.map((mark) => mark.getAttribute('aria-label'));
    const titles = marks.map((mark) => mark.querySelector(testSelector('mark-title')).textContent);
    const match = labels.every((label, index) => label === titles[index]);

    assert.notOk(match);
  });

  test('every bar chart mark has an aria-label attribute by default', async function (assert) {
    this.set('spec', specificationFixture('stackedBar'));
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('mark')).hasAttribute('aria-label');
  });

  test('every circular chart mark has an aria-label attribute by default', async function (assert) {
    this.set('spec', specificationFixture('circular'));
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('mark')).hasAttribute('aria-label');
  });

  test('every line chart point mark has an aria-label attribute by default', async function (assert) {
    this.set('spec', specificationFixture('line'));
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
    `);

    assert.dom(testSelector('marks-mark-point')).hasAttribute('aria-label');
  });
});
