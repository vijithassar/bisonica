const dotPlotSpec = {
  $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
  title: {
    text: 'dot plot example',
  },
  data: {
    values: [
      { label: 'a', value: 21 },
      { label: 'b', value: 13 },
      { label: 'c', value: 8 },
      { label: 'd', value: 5 },
      { label: 'e', value: 3 },
      { label: 'f', value: 2 },
      { label: 'g', value: 1 },
      { label: 'h', value: 1 },
    ],
  },
  encoding: {
    y: { field: 'label', type: 'nominal', title: null },
    x: { field: 'value', type: 'quantitative', title: null },
  },
  mark: { type: 'point', tooltip: true, filled: true },
};

export { dotPlotSpec };
