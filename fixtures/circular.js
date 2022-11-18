const circularChartSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
  title: {
    text: 'circular chart example',
  },
  description: 'A simple circular pie chart.',
  mark: { type: 'arc', tooltip: true },
  encoding: {
    theta: { field: 'value', type: 'quantitative' },
    color: {
      field: 'group',
      type: 'nominal',
    },
  },
  view: { stroke: null },
  data: {
    values: [
      {
        group: 'A',
        value: 8,
      },
      {
        group: 'B',
        value: 4,
      },
      {
        group: 'C',
        value: 2,
      },
      {
        group: 'D',
        value: 2,
      },
      {
        group: 'E',
        value: 1,
      },
      {
        group: 'F',
        value: 4,
      },
      {
        group: 'G',
        value: 14,
      },
      {
        group: 'H',
        value: 2,
      },
    ],
  },
};

export { circularChartSpec };
