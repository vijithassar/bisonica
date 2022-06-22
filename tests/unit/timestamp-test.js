import * as d3 from 'd3';
import {
  getTimeParser,
  parseTime,
  timeMethod,
} from '../../source/time';
import { module, test } from 'qunit';

module('Unit | Component | falcon-charts | timestamps', () => {
  const timestamps = [
    '2020-01-01',
    '2020-07-04T20:00:33.245Z',
    '2020-07-03T20:03:33.245Z-2020-07-04T20:03:33.245Z',
    1596057847949,
  ];

  test('converts time period specifiers to d3 time interval method names', (assert) => {
    ['utcday', 'utcweek', 'day', 'week'].forEach((timeSpecifier) => {
      assert.equal(
        typeof d3[timeMethod(timeSpecifier)],
        'function',
        `time specifier ${timeSpecifier} converted to d3 method name`,
      );
    });
  });

  test('retrieves a timestamp parsing function', (assert) => {
    timestamps.forEach((timestamp) => {
      const parser = getTimeParser(timestamp);

      assert.equal(typeof parser, 'function');
    });
  });
  test('retrieved function accurately parses timestamp strings', (assert) => {
    timestamps.forEach((timestamp) => {
      const parser = getTimeParser(timestamp);
      const parsed = parser(timestamp);

      assert.equal(typeof parsed.getFullYear, 'function');
      assert.equal(typeof parsed.getFullYear(), 'number');
    });
  });
  test('determines correct timestamp parser', (assert) => {
    const dates = timestamps.map(parseTime);

    dates.forEach((date) => {
      assert.equal(typeof date.getFullYear, 'function');
      assert.equal(typeof date.getFullYear(), 'number');
    });
  });
  test('refuses to parse invalid dates', (assert) => {
    const invalidDate = new Date('this is not a valid date format');
    const parser = getTimeParser(invalidDate);

    assert.equal(parser, null);
  });
});
