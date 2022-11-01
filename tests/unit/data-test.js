import { data } from '../../source/data.js';
import { encodingField } from '../../source/encodings.js';
import { getTimeParser } from '../../source/time.js';
import qunit from 'qunit';
import { specificationFixture } from '../test-helpers.js';

const { module, test } = qunit;

module('unit > data', () => {
  test('compiles stacked bar data', (assert) => {
    const stacked = data(specificationFixture('stackedBar'));

    assert.ok(
      stacked.every((item) => Array.isArray(item)),
      `stacked bar data returns arrays`,
    );
    assert.ok(
      stacked.every((item) => {
        return item.every((point) => point.length === 2);
      }),
      'every item in the stack is an array of two points',
    );
    assert.ok(
      stacked.every((item) => typeof item.key === 'string'),
      'each series has a string key',
    );
    assert.ok(
      stacked.every((item) => typeof item.index === 'number'),
      'each series has a numerical index',
    );
  });

  test('compiles single-series data using a placeholder encoding key when a series encoding is not present', (assert) => {
    const barData = data(specificationFixture('categoricalBar'));

    assert.ok(Array.isArray(barData), 'data function returns an array');
    assert.equal(barData.length, 1, 'single series');
    assert.equal(barData[0].key, '_', 'series key is an underscore');
  });

  test('compiles single-series data using the original encoding key when a series encoding is present', (assert) => {
    const specification = specificationFixture('categoricalBar');
    const field = 'a';
    const value = 'b';
    specification.data.values = specification.data.values.map((item) => {
      item[field] = value;
      return item;
    })
    specification.encoding.color = {
      field,
      type: 'nominal'
    };
    const barData = data(specification);
    assert.ok(Array.isArray(barData), 'data function returns an array');
    assert.equal(barData.length, 1, 'single series');
    assert.equal(barData[0].key, value, 'series key is the encoding field');
  });

  test('computes circular chart data', (assert) => {
    const segments = data(specificationFixture('circular'));
    const keys = segments.every((item) => typeof item.key === 'string');

    assert.ok(keys, 'every segment has a key');

    const values = segments.every((item) => typeof item.value === 'number');

    assert.ok(values, 'every segment has a value');
  });

  test('compiles line chart data', (assert) => {
    const spec = specificationFixture('line');
    const dailyTotals = data(spec, encodingField(spec, 'x'));
    const groupNames = dailyTotals.every(
      (item) => typeof item[encodingField(spec, 'color')] === 'string',
    );

    assert.ok(groupNames, 'every series specifies a group');

    const valueArrays = dailyTotals.every((item) => Array.isArray(item.values));

    assert.ok(valueArrays, 'every series includes an array of values');

    const parser = getTimeParser(dailyTotals[0].values[0].period);
    const periods = dailyTotals.every((series) => {
      return series.values.every((item) => typeof parser(item.period).getFullYear === 'function');
    });

    assert.ok(periods, 'every item specifies a valid time period');

    const values = dailyTotals.every((series) => {
      return series.values.every((item) => typeof item[encodingField(spec, 'y')] === 'number');
    });

    assert.ok(values, 'every item includes a value');
  });
});
