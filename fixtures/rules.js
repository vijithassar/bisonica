const rulesSpec = {
  data: {
    values: [
      { group: 'a', value: 2 },
      { group: 'b', value: 4 },
      { group: 'c', value: 7 },
    ],
  },
  title: { text: 'Rules' },
  mark: 'rule',
  encoding: {
    y: {
      field: 'value',
      type: 'quantitative',
    },
    size: { value: 2 },
    color: { field: 'group', type: 'nominal' },
  },
};

const count = new Set(rulesSpec.data.values.map((item) => item.group)).size;

rulesSpec.encoding.color.scale = {
  range: getGraphColors(count).map((item) => `var(--${item.swatchName})`),
};

export { rulesSpec };
