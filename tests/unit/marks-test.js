import { barWidth } from '../../source/marks';
import { categoricalBarChartSpec } from '@crowdstrike/falcon-charts/components/falcon-charts/-meta/specification-fixtures/categorical-bar';
import { encodingField } from '../../source/encodings';
import { module, test } from 'qunit';
import { set } from '@ember/object';
import { stackedBarChartSpec } from '@crowdstrike/falcon-charts/components/falcon-charts/-meta/specification-fixtures/stacked-bar';

module('Unit | Component | falcon-charts | marks', () => {
  test('bar width', (assert) => {
    const dimensions = { x: 100, y: 100 };

    const dates = new Set(
      stackedBarChartSpec.data.values.map((item) => item[encodingField(stackedBarChartSpec, 'x')]),
    ).size;

    const categories = categoricalBarChartSpec.data.values.map(
      (item) => item[encodingField(categoricalBarChartSpec, 'x')],
    ).length;

    assert.equal(
      typeof barWidth(stackedBarChartSpec, dimensions),
      'number',
      'bar width is a number',
    );

    assert.ok(
      barWidth(stackedBarChartSpec, dimensions) <= dimensions.x / dates,
      'time series bar width sized according to number of timestamps',
    );

    assert.ok(
      barWidth(categoricalBarChartSpec, dimensions) <= dimensions.x / categories,
      'time series bar width sized according to number of categories',
    );

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
