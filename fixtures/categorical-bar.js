const categoricalBarChartSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
  title: { text: 'Categorical Bar Chart' },
  data: {
    values: [
      { label: 'team-bear', value: 31 },
      { label: 'rebel-jackal', value: 25 },
      { label: 'berserk-bear', value: 25 },
      { label: 'viking-jackal', value: 25 },
      { label: 'stalker-panda', value: 24 },
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
