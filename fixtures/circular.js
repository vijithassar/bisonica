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
        label: '2020-05-20',
        group: 'Custom Intelligence',
        value: 8,
      },
      {
        label: '2020-05-20',
        group: 'falcon-intel',
        value: 4,
      },
      {
        label: '2020-05-20',
        group: 'defense-evasion',
        value: 2,
      },
      {
        label: '2020-05-20',
        group: 'credential-access',
        value: 2,
      },
      {
        label: '2020-05-20',
        group: 'falcon-overwatch',
        value: 2,
      },
      {
        label: '2020-05-20',
        group: 'discovery',
        value: 1,
      },
      {
        label: '2020-05-21',
        group: 'Custom Intelligence',
        value: 4,
      },
      {
        label: '2020-05-21',
        group: 'lateral-movement',
        value: 4,
      },
      {
        label: '2020-05-21',
        group: 'command-and-control',
        value: 2,
      },
      {
        label: '2020-05-21',
        group: 'credential-access',
        value: 2,
      },
      {
        label: '2020-05-21',
        group: 'privilege-escalation',
        value: 1,
      },
      {
        label: '2020-05-21',
        group: 'discovery',
        value: 1,
      },
      {
        label: '2020-05-22',
        group: 'falcon-intel',
        value: 6,
      },
      {
        label: '2020-05-23',
        group: 'command-and-control',
        value: 3,
      },
      {
        label: '2020-05-23',
        group: 'Custom Intelligence',
        value: 2,
      },
      {
        label: '2020-05-23',
        group: 'privilege-escalation',
        value: 1,
      },
      {
        label: '2020-05-23',
        group: 'defense-evasion',
        value: 1,
      },
      {
        label: '2020-05-23',
        group: 'discovery',
        value: 1,
      },
      {
        label: '2020-05-23',
        group: 'persistence',
        value: 1,
      },
      {
        label: '2020-05-24',
        group: 'Custom Intelligence',
        value: 8,
      },
      {
        label: '2020-05-24',
        group: 'command-and-control',
        value: 3,
      },
      {
        label: '2020-05-24',
        group: 'privilege-escalation',
        value: 1,
      },
      {
        label: '2020-05-24',
        group: 'defense-evasion',
        value: 1,
      },
      {
        label: '2020-05-25',
        group: 'Custom Intelligence',
        value: 4,
      },
      {
        label: '2020-05-25',
        group: 'persistence',
        value: 3,
      },
      {
        label: '2020-05-25',
        group: 'falcon-intel',
        value: 1,
      },
      {
        label: '2020-05-25',
        group: 'command-and-control',
        value: 1,
      },
      {
        label: '2020-05-26',
        group: 'Custom Intelligence',
        value: 2,
      },
      {
        label: '2020-05-26',
        group: 'credential-access',
        value: 1,
      },
      {
        label: '2020-05-28',
        group: 'Custom Intelligence',
        value: 5,
      },
      {
        label: '2020-05-28',
        group: 'command-and-control',
        value: 2,
      },
      {
        label: '2020-05-28',
        group: 'credential-access',
        value: 1,
      },
      {
        label: '2020-05-28',
        group: 'discovery',
        value: 1,
      },
      {
        label: '2020-05-28',
        group: 'privilege-escalation',
        value: 1,
      },
      {
        label: '2020-05-28',
        group: 'lateral-movement',
        value: 1,
      },
      {
        label: '2020-05-29',
        group: 'Custom Intelligence',
        value: 3,
      },
      {
        label: '2020-05-29',
        group: 'falcon-intel',
        value: 1,
      },
      {
        label: '2020-05-29',
        group: 'lateral-movement',
        value: 1,
      },
      {
        label: '2020-05-31',
        group: 'Custom Intelligence',
        value: 9,
      },
      {
        label: '2020-05-31',
        group: 'falcon-intel',
        value: 2,
      },
      {
        label: '2020-05-31',
        group: 'defense-evasion',
        value: 2,
      },
      {
        label: '2020-05-31',
        group: 'command-and-control',
        value: 2,
      },
      {
        label: '2020-05-31',
        group: 'discovery',
        value: 2,
      },
      {
        label: '2020-05-31',
        group: 'credential-access',
        value: 1,
      },
      {
        label: '2020-06-02',
        group: 'Custom Intelligence',
        value: 1,
      },
      {
        label: '2020-06-02',
        group: 'lateral-movement',
        value: 1,
      },
      {
        label: '2020-06-02',
        group: 'command-and-control',
        value: 1,
      },
      {
        label: '2020-06-03',
        group: 'Custom Intelligence',
        value: 7,
      },
      {
        label: '2020-06-03',
        group: 'command-and-control',
        value: 5,
      },
      {
        label: '2020-06-03',
        group: 'falcon-overwatch',
        value: 3,
      },
      {
        label: '2020-06-03',
        group: 'discovery',
        value: 3,
      },
      {
        label: '2020-06-03',
        group: 'defense-evasion',
        value: 3,
      },
      {
        label: '2020-06-03',
        group: 'lateral-movement',
        value: 2,
      },
      {
        label: '2020-06-03',
        group: 'credential-access',
        value: 1,
      },
      {
        label: '2020-06-04',
        group: 'Custom Intelligence',
        value: 7,
      },
      {
        label: '2020-06-04',
        group: 'credential-access',
        value: 2,
      },
      {
        label: '2020-06-04',
        group: 'falcon-overwatch',
        value: 2,
      },
      {
        label: '2020-06-04',
        group: 'privilege-escalation',
        value: 1,
      },
      {
        label: '2020-06-04',
        group: 'discovery',
        value: 1,
      },
      {
        label: '2020-06-04',
        group: 'persistence',
        value: 1,
      },
      {
        label: '2020-06-05',
        group: 'Custom Intelligence',
        value: 14,
      },
      {
        label: '2020-06-05',
        group: 'command-and-control',
        value: 4,
      },
      {
        label: '2020-06-05',
        group: 'privilege-escalation',
        value: 4,
      },
      {
        label: '2020-06-05',
        group: 'lateral-movement',
        value: 3,
      },
      {
        label: '2020-06-05',
        group: 'falcon-intel',
        value: 2,
      },
      {
        label: '2020-06-05',
        group: 'persistence',
        value: 2,
      },
      {
        label: '2020-06-05',
        group: 'falcon-overwatch',
        value: 1,
      },
      {
        label: '2020-06-05',
        group: 'credential-access',
        value: 1,
      },
      {
        label: '2020-06-06',
        group: 'Custom Intelligence',
        value: 5,
      },
      {
        label: '2020-06-06',
        group: 'falcon-overwatch',
        value: 3,
      },
      {
        label: '2020-06-06',
        group: 'defense-evasion',
        value: 2,
      },
      {
        label: '2020-06-06',
        group: 'privilege-escalation',
        value: 2,
      },
      {
        label: '2020-06-06',
        group: 'command-and-control',
        value: 2,
      },
      {
        label: '2020-06-06',
        group: 'lateral-movement',
        value: 1,
      },
      {
        label: '2020-06-06',
        group: 'persistence',
        value: 1,
      },
      {
        label: '2020-06-07',
        group: 'Custom Intelligence',
        value: 4,
      },
      {
        label: '2020-06-07',
        group: 'discovery',
        value: 2,
      },
      {
        label: '2020-06-08',
        group: 'Custom Intelligence',
        value: 7,
      },
      {
        label: '2020-06-08',
        group: 'lateral-movement',
        value: 3,
      },
      {
        label: '2020-06-08',
        group: 'falcon-overwatch',
        value: 2,
      },
      {
        label: '2020-06-08',
        group: 'command-and-control',
        value: 2,
      },
      {
        label: '2020-06-08',
        group: 'credential-access',
        value: 2,
      },
      {
        label: '2020-06-08',
        group: 'discovery',
        value: 2,
      },
      {
        label: '2020-06-08',
        group: 'privilege-escalation',
        value: 1,
      },
      {
        label: '2020-06-08',
        group: 'defense-evasion',
        value: 1,
      },
      {
        label: '2020-06-09',
        group: 'Custom Intelligence',
        value: 7,
      },
      {
        label: '2020-06-09',
        group: 'defense-evasion',
        value: 1,
      },
      {
        label: '2020-06-09',
        group: 'credential-access',
        value: 1,
      },
      {
        label: '2020-06-09',
        group: 'lateral-movement',
        value: 1,
      },
      {
        label: '2020-06-09',
        group: 'falcon-overwatch',
        value: 1,
      },
      {
        label: '2020-06-09',
        group: 'falcon-intel',
        value: 1,
      },
      {
        label: '2020-06-09',
        group: 'persistence',
        value: 1,
      },
      {
        label: '2020-06-09',
        group: 'command-and-control',
        value: 1,
      },
      {
        label: '2020-06-10',
        group: 'command-and-control',
        value: 2,
      },
      {
        label: '2020-06-10',
        group: 'Custom Intelligence',
        value: 1,
      },
      {
        label: '2020-06-10',
        group: 'defense-evasion',
        value: 1,
      },
      {
        label: '2020-06-10',
        group: 'credential-access',
        value: 1,
      },
      {
        label: '2020-06-11',
        group: 'Custom Intelligence',
        value: 3,
      },
      {
        label: '2020-06-11',
        group: 'falcon-intel',
        value: 1,
      },
      {
        label: '2020-06-11',
        group: 'command-and-control',
        value: 1,
      },
      {
        label: '2020-06-11',
        group: 'credential-access',
        value: 1,
      },
      {
        label: '2020-06-12',
        group: 'Custom Intelligence',
        value: 1,
      },
      {
        label: '2020-06-12',
        group: 'falcon-intel',
        value: 1,
      },
      {
        label: '2020-06-12',
        group: 'command-and-control',
        value: 1,
      },
      {
        label: '2020-06-12',
        group: 'privilege-escalation',
        value: 1,
      },
      {
        label: '2020-06-12',
        group: 'credential-access',
        value: 1,
      },
      {
        label: '2020-06-13',
        group: 'Custom Intelligence',
        value: 17,
      },
      {
        label: '2020-06-13',
        group: 'command-and-control',
        value: 3,
      },
      {
        label: '2020-06-13',
        group: 'falcon-overwatch',
        value: 3,
      },
      {
        label: '2020-06-13',
        group: 'falcon-intel',
        value: 2,
      },
      {
        label: '2020-06-13',
        group: 'defense-evasion',
        value: 2,
      },
      {
        label: '2020-06-13',
        group: 'discovery',
        value: 1,
      },
      {
        label: '2020-06-13',
        group: 'privilege-escalation',
        value: 1,
      },
      {
        label: '2020-06-14',
        group: 'Custom Intelligence',
        value: 26,
      },
      {
        label: '2020-06-14',
        group: 'falcon-intel',
        value: 3,
      },
      {
        label: '2020-06-14',
        group: 'defense-evasion',
        value: 3,
      },
      {
        label: '2020-06-14',
        group: 'discovery',
        value: 2,
      },
      {
        label: '2020-06-14',
        group: 'privilege-escalation',
        value: 2,
      },
      {
        label: '2020-06-14',
        group: 'lateral-movement',
        value: 1,
      },
      {
        label: '2020-06-14',
        group: 'command-and-control',
        value: 1,
      },
      {
        label: '2020-06-14',
        group: 'falcon-overwatch',
        value: 1,
      },
      {
        label: '2020-06-14',
        group: 'persistence',
        value: 1,
      },
      {
        label: '2020-06-15',
        group: 'Custom Intelligence',
        value: 19,
      },
      {
        label: '2020-06-15',
        group: 'discovery',
        value: 5,
      },
      {
        label: '2020-06-15',
        group: 'privilege-escalation',
        value: 4,
      },
      {
        label: '2020-06-15',
        group: 'lateral-movement',
        value: 3,
      },
      {
        label: '2020-06-15',
        group: 'persistence',
        value: 2,
      },
      {
        label: '2020-06-15',
        group: 'falcon-intel',
        value: 2,
      },
      {
        label: '2020-06-15',
        group: 'command-and-control',
        value: 2,
      },
      {
        label: '2020-06-15',
        group: 'credential-access',
        value: 1,
      },
      {
        label: '2020-06-16',
        group: 'Custom Intelligence',
        value: 3,
      },
      {
        label: '2020-06-16',
        group: 'falcon-intel',
        value: 3,
      },
      {
        label: '2020-06-16',
        group: 'defense-evasion',
        value: 1,
      },
      {
        label: '2020-06-16',
        group: 'credential-access',
        value: 1,
      },
      {
        label: '2020-06-16',
        group: 'discovery',
        value: 1,
      },
      {
        label: '2020-06-16',
        group: 'privilege-escalation',
        value: 1,
      },
      {
        label: '2020-06-16',
        group: 'falcon-overwatch',
        value: 1,
      },
    ],
  },
};

const count = new Set(circularChartSpec.data.values.map((item) => item.group)).size;

circularChartSpec.encoding.color.scale = {
  range: getGraphColors(count).map((item) => `var(--${item.swatchName})`),
};

export { circularChartSpec };
