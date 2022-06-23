import {
  data,
  transplantFields,
} from '../../source/data';
import { encodingField } from '../../source/encodings';
import { getTimeParser } from '../../source/time';
import qunit from 'qunit';
import { specificationFixture } from '../test-helpers.js';

const { module, test } = qunit;

module('Unit | Component | falcon-charts | data', () => {
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

  test('computes circular chart data', (assert) => {
    const segments = data(specificationFixture('circular'));
    const keys = segments.every((item) => typeof item.key === 'string');

    assert.ok(keys, 'every segment has a key');

    const values = segments.every((item) => typeof item.value === 'number');

    assert.ok(values, 'every segment has a value');
  });

  const urlData = [
    { value: 1, group: 'a', label: '2020-01-01', url: 'https://crowdstrike.com/a' },
    { value: 1, group: 'a', label: '2020-01-02', url: 'https://crowdstrike.com/a' },
    { value: 2, group: 'b', label: '2020-01-03', url: 'https://crowdstrike.com/b' },
    { value: 2, group: 'b', label: '2020-01-04', url: 'https://crowdstrike.com/b' },
    { value: 2, group: 'b', label: '2020-01-05', url: 'https://crowdstrike.com/b' },
    { value: 3, group: 'c', label: '2020-01-06', url: 'https://crowdstrike.com/c' },
    { value: 3, group: 'c', label: '2020-01-07', url: 'https://crowdstrike.com/c' },
  ];

  test('transfers urls to aggregated circular chart segments', (assert) => {
    const s = {
      data: {
        values: urlData,
      },
      mark: {
        type: 'arc',
      },
      encoding: {
        color: { field: 'group' },
        href: { field: 'url' },
        theta: { field: 'value' },
      },
    };

    const layout = data(s);

    assert.ok(layout.every((item) => item.url.startsWith('https://crowdstrike.com/')));
  });

  test('transfers urls to aggregated stacked bar chart segments', (assert) => {
    const s = {
      data: {
        values: urlData,
      },
      mark: { type: 'bar' },
      encoding: {
        color: { field: 'group', type: 'nominal' },
        href: { field: 'url' },
        x: { field: 'label', type: 'temporal' },
        y: { aggregate: 'value', type: 'quantitative' },
      },
    };

    const layout = data(s);

    layout.forEach((series) => {
      series.forEach((item) => {
        const difference = Math.abs(item[1] - item[0]) !== 0;

        if (difference) {
          const url = item[encodingField(s, 'href')];

          assert.ok(url.startsWith('https://crowdstrike.com/'));
        }
      });
    });
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

  test('transplants urls between arbitrary data structures', (assert) => {
    const key = 'url';
    const aggregated = [{ key: 'a' }, { key: 'b' }, { key: 'c' }, { key: 'd' }];
    const raw = [
      { type: 'a', url: 'https://www.crowdstrike.com/1' },
      { type: 'a', url: 'https://www.crowdstrike.com/1' },
      { type: 'a', url: 'https://www.crowdstrike.com/1' },
      { type: 'b', url: 'https://www.crowdstrike.com/2' },
      { type: 'c', url: 'https://www.crowdstrike.com/3' },
      { type: 'd', url: 'https://www.crowdstrike.com/4' },
      { type: 'd', url: 'https://www.crowdstrike.com/5' },
    ];
    const matcher = (item, raw) => raw.filter((x) => x.type === item.key).map((item) => item.url);
    const badMatcher = (item, raw) => raw.filter((item) => typeof item === 'number');
    const hasUrl = (item) => typeof item[key] === 'string';

    assert.throws(
      () => transplantFields(null, raw, matcher, key),
      'requires valid aggregated data',
    );
    assert.throws(
      () => transplantFields(aggregated, null, matcher, key),
      'requires valid raw data',
    );
    assert.throws(() => transplantFields(aggregated, raw, null, key), 'requires matching function');

    const successful = transplantFields(aggregated, raw, matcher, key);
    const unsuccessful = transplantFields(aggregated, raw, badMatcher, key);

    assert.ok(Array.isArray(successful), 'returns an array');

    const originals = aggregated.every((item, index) => {
      return Object.keys(item).every((key) => successful[index][key] === aggregated[index][key]);
    });

    assert.ok(originals, 'retains all values from original aggregated data point');
    assert.ok(
      successful.filter((item) => item.key !== 'd').every((item) => hasUrl(item)),
      'transplants matching urls',
    );
    assert.ok(
      successful.filter((item) => item.key === 'd').every((item) => !hasUrl(item)),
      'does not transplant mismatched urls',
    );
    assert.ok(
      unsuccessful.every((item) => !hasUrl(item)),
      'does not transplant unmatched urls',
    );
  });
});
