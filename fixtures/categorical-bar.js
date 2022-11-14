const categoricalBarChartSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
  title: { text: 'Categorical Bar Chart' },
  data: {
    values: [
      { label: 'rabbit', value: 31 },
      { label: 'cow', value: 25 },
      { label: 'snake', value: 25 },
      { label: 'elephant', value: 25 },
      { label: 'mouse', value: 24 },
    ],
  },
  mark: { type: 'bar', tooltip: true },
  encoding: {
    x: { field: 'label', type: 'nominal' },
    y: { title: 'count', field: 'value', type: 'quantitative' },
    color: { field: null, type: 'nominal' },
  },
};

export { categoricalBarChartSpec };
