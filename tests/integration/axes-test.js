import qunit from 'qunit';
import { render, testSelector, specificationFixture } from '../test-helpers.js';

const { module, test } = qunit;

module('integration > axes', function () {
  test('renders a chart with axes', async function (assert) {
    const spec = specificationFixture('stackedBar');
    const element = render(spec);

    const single = [testSelector('axes'), testSelector('axes-x'), testSelector('axes-y')];

    single.forEach((selector) => assert.equal(element.querySelectorAll(selector).length, 1));

    assert.ok(element.querySelector(testSelector('tick')));
  });

  test('renders a chart with custom axis titles', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.encoding.x.axis = { title: 'a' };
    spec.encoding.y.axis = { title: 'b' };
    const element = render(spec);
    assert.equal(element.querySelector(testSelector('axes-x-title')).textContent, spec.encoding.x.axis.title);
    assert.equal(element.querySelector(testSelector('axes-y-title')).textContent, spec.encoding.y.axis.title);
  });

  test('renders a chart without y-axis tick labels', async function (assert) {
    let spec, element;

    spec = specificationFixture('stackedBar');

    element = render(spec);

    let tickLabelTexts;

    tickLabelTexts = [...element.querySelectorAll(`${testSelector('axes-y')} .tick text`)];

    assert.ok(tickLabelTexts.every((el) => el.textContent.length));

    spec = specificationFixture('stackedBar');

    spec.encoding.y.axis.labels = false;

    element = render(spec);
    tickLabelTexts = [...element.querySelectorAll(`${testSelector('axes-y')} .tick text`)];

    assert.ok(!tickLabelTexts.some((el) => el.textContent.length));
  });

  test('renders a chart with custom axis tick intervals', async function (assert) {
    const spec = specificationFixture('stackedBar');

    const dates = spec.data.values.map((item) => new Date(item.label));
    const differenceMilliseconds = Math.abs(Math.min(...dates) - Math.max(...dates));
    const differenceDays = Math.floor(differenceMilliseconds / (24 * 60 * 60 * 1000));

    spec.encoding.x.axis = { tickCount: { interval: 'utchour' } };

    let element;

    element = render(spec);

    const hourly = element.querySelectorAll(`${testSelector('axes-x')} .tick`);

    assert.ok(hourly.length > differenceDays);

    spec.encoding.x.axis = { tickCount: { interval: 'utcweek' } };
    element = render(spec);

    const weekly = element.querySelectorAll(`${testSelector('axes-x')} .tick`);

    assert.ok(weekly.length < differenceDays);
  });

  test('renders a chart with custom axis tick steps', async function (assert) {
    const spec = specificationFixture('stackedBar');

    const dates = spec.data.values.map((item) => new Date(item.label));
    const differenceMilliseconds = Math.abs(Math.min(...dates) - Math.max(...dates));
    const differenceDays = Math.floor(differenceMilliseconds / (24 * 60 * 60 * 1000));

    spec.encoding.x.axis = { tickCount: { interval: 'utcday', step: 2 } };

    const element = render(spec);

    const ticks = element.querySelectorAll(`${testSelector('axes-x')} .tick`);

    assert.ok(ticks.length < differenceDays);
  });

  test('renders a chart without axes', async function (assert) {
    const spec = specificationFixture('stackedBar');

    spec.encoding.x.axis = { title: null };
    spec.encoding.y.axis = { title: null };
    const element = render(spec);

    const selectors = [testSelector('axes-x-title'), testSelector('axes-y-title')];

    selectors.forEach((selector) => assert.notOk(element.querySelector(selector)));
  });

  test('renders a chart with truncated axis labels', async function (assert) {
    const max = 20;
    const spec = specificationFixture('categoricalBar');

    spec.encoding.x.axis = { labelLimit: max };

    const element = render(spec);

    [...element.querySelectorAll(`${testSelector('axes-x')} .tick text`)].forEach((node) => {
      assert.ok(node.getBoundingClientRect().width <= max);
    });
  });
});
