import { barWidth } from '../../source/marks.js';
import qunit from 'qunit';
// import { set } from '@ember/object';
import { specificationFixture } from '../test-helpers.js';

const { module, test } = qunit;

const set = () => null

module('unit > marks', () => {
  module('bar width', () => {

    const stackedBarChartSpec = specificationFixture('stackedBar');
    const categoricalBarChartSpec = specificationFixture('categoricalBar');

    const dimensions = { x: 100, y: 100 };

    const dates = new Set(stackedBarChartSpec.data.values.map((item) => item.label)).size;

    const categories = categoricalBarChartSpec.data.values.map((item) => item.label).length;

    test('return value', (assert) => {
      assert.equal(
        typeof barWidth(stackedBarChartSpec, dimensions),
        'number',
        'bar width is a number',
      );
    });

    test('temporal encoding', (assert) => {
      assert.ok(
        barWidth(stackedBarChartSpec, dimensions) <= dimensions.x / dates,
        'time series bar width sized according to number of timestamps',
      );
    });

    test('nominal encoding', (assert) => {
      assert.ok(
        barWidth(categoricalBarChartSpec, dimensions) <= dimensions.x / categories,
        'time series bar width sized according to number of categories',
      );
    });

    test('mutation', (assert) => {
      const twoBarsTimeSeries = [
        { label: '2020-01-01', value: 10, group: 'a' },
        { label: '2020-01-01', value: 20, group: 'b' },
        { label: '2020-01-02', value: 30, group: 'a' },
        { label: '2020-01-02', value: 40, group: 'b' },
      ];

      const twoBarsCategorical = [
        { group: 'a', value: 10 },
        { group: 'b', value: 20 },
      ];

      set(stackedBarChartSpec.data, 'values', twoBarsTimeSeries);

      set(categoricalBarChartSpec.data, 'values', twoBarsCategorical);

      assert.ok(
        barWidth(stackedBarChartSpec, dimensions) <= dimensions.x / 3,
        'gap left between two time series bars',
      );

      assert.ok(
        barWidth(categoricalBarChartSpec, dimensions) <= dimensions.x / 3,
        'gap left between two categorical bars',
      );
    });

  });
});
