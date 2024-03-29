const stackedAreaChartSpec = {
	'$schema': 'https://vega.github.io/schema/vega-lite/v5.json',
	'title': { 'text': 'area chart fixture' },
	'data': { values: [
		{
			label: '2020-05-20',
			group: 'A',
			value: 8
		},
		{
			label: '2020-05-20',
			group: 'B',
			value: 4
		},
		{
			label: '2020-05-20',
			group: 'I',
			value: 2
		},
		{
			label: '2020-05-20',
			group: 'C',
			value: 2
		},
		{
			label: '2020-05-20',
			group: 'D',
			value: 2
		},
		{
			label: '2020-05-20',
			group: 'E',
			value: 1
		},
		{
			label: '2020-05-21',
			group: 'A',
			value: 4
		},
		{
			label: '2020-05-21',
			group: 'F',
			value: 4
		},
		{
			label: '2020-05-21',
			group: 'G',
			value: 2
		},
		{
			label: '2020-05-21',
			group: 'C',
			value: 2
		},
		{
			label: '2020-05-21',
			group: 'H',
			value: 1
		},
		{
			label: '2020-05-21',
			group: 'E',
			value: 1
		},
		{
			label: '2020-05-22',
			group: 'B',
			value: 6
		},
		{
			label: '2020-05-23',
			group: 'G',
			value: 3
		},
		{
			label: '2020-05-23',
			group: 'A',
			value: 2
		},
		{
			label: '2020-05-23',
			group: 'H',
			value: 1
		},
		{
			label: '2020-05-23',
			group: 'I',
			value: 1
		},
		{
			label: '2020-05-23',
			group: 'E',
			value: 1
		},
		{
			label: '2020-05-23',
			group: 'J',
			value: 1
		},
		{
			label: '2020-05-24',
			group: 'A',
			value: 8
		},
		{
			label: '2020-05-24',
			group: 'G',
			value: 3
		},
		{
			label: '2020-05-24',
			group: 'H',
			value: 1
		},
		{
			label: '2020-05-24',
			group: 'I',
			value: 1
		},
		{
			label: '2020-05-25',
			group: 'A',
			value: 4
		},
		{
			label: '2020-05-25',
			group: 'J',
			value: 3
		},
		{
			label: '2020-05-25',
			group: 'B',
			value: 1
		},
		{
			label: '2020-05-25',
			group: 'G',
			value: 1
		},
		{
			label: '2020-05-26',
			group: 'A',
			value: 2
		},
		{
			label: '2020-05-26',
			group: 'C',
			value: 1
		},
		{
			label: '2020-05-28',
			group: 'A',
			value: 5
		},
		{
			label: '2020-05-28',
			group: 'G',
			value: 2
		},
		{
			label: '2020-05-28',
			group: 'C',
			value: 1
		},
		{
			label: '2020-05-28',
			group: 'E',
			value: 1
		},
		{
			label: '2020-05-28',
			group: 'H',
			value: 1
		},
		{
			label: '2020-05-28',
			group: 'F',
			value: 1
		},
		{
			label: '2020-05-29',
			group: 'A',
			value: 3
		},
		{
			label: '2020-05-29',
			group: 'B',
			value: 1
		},
		{
			label: '2020-05-29',
			group: 'F',
			value: 1
		},
		{
			label: '2020-05-31',
			group: 'A',
			value: 9
		},
		{
			label: '2020-05-31',
			group: 'B',
			value: 2
		},
		{
			label: '2020-05-31',
			group: 'I',
			value: 2
		},
		{
			label: '2020-05-31',
			group: 'G',
			value: 2
		},
		{
			label: '2020-05-31',
			group: 'E',
			value: 2
		},
		{
			label: '2020-05-31',
			group: 'C',
			value: 1
		},
		{
			label: '2020-06-02',
			group: 'A',
			value: 1
		},
		{
			label: '2020-06-02',
			group: 'F',
			value: 1
		},
		{
			label: '2020-06-02',
			group: 'G',
			value: 1
		},
		{
			label: '2020-06-03',
			group: 'A',
			value: 7
		},
		{
			label: '2020-06-03',
			group: 'G',
			value: 5
		},
		{
			label: '2020-06-03',
			group: 'D',
			value: 3
		},
		{
			label: '2020-06-03',
			group: 'E',
			value: 3
		},
		{
			label: '2020-06-03',
			group: 'I',
			value: 3
		},
		{
			label: '2020-06-03',
			group: 'F',
			value: 2
		},
		{
			label: '2020-06-03',
			group: 'C',
			value: 1
		},
		{
			label: '2020-06-04',
			group: 'A',
			value: 7
		},
		{
			label: '2020-06-04',
			group: 'C',
			value: 2
		},
		{
			label: '2020-06-04',
			group: 'D',
			value: 2
		},
		{
			label: '2020-06-04',
			group: 'H',
			value: 1
		},
		{
			label: '2020-06-04',
			group: 'E',
			value: 1
		},
		{
			label: '2020-06-04',
			group: 'J',
			value: 1
		},
		{
			label: '2020-06-05',
			group: 'A',
			value: 14
		},
		{
			label: '2020-06-05',
			group: 'G',
			value: 4
		},
		{
			label: '2020-06-05',
			group: 'H',
			value: 4
		},
		{
			label: '2020-06-05',
			group: 'F',
			value: 3
		},
		{
			label: '2020-06-05',
			group: 'B',
			value: 2
		},
		{
			label: '2020-06-05',
			group: 'J',
			value: 2
		},
		{
			label: '2020-06-05',
			group: 'D',
			value: 1
		},
		{
			label: '2020-06-05',
			group: 'C',
			value: 1
		},
		{
			label: '2020-06-06',
			group: 'A',
			value: 5
		},
		{
			label: '2020-06-06',
			group: 'D',
			value: 3
		},
		{
			label: '2020-06-06',
			group: 'I',
			value: 2
		},
		{
			label: '2020-06-06',
			group: 'H',
			value: 2
		},
		{
			label: '2020-06-06',
			group: 'G',
			value: 2
		},
		{
			label: '2020-06-06',
			group: 'F',
			value: 1
		},
		{
			label: '2020-06-06',
			group: 'J',
			value: 1
		},
		{
			label: '2020-06-07',
			group: 'A',
			value: 4
		},
		{
			label: '2020-06-07',
			group: 'E',
			value: 2
		},
		{
			label: '2020-06-08',
			group: 'A',
			value: 7
		},
		{
			label: '2020-06-08',
			group: 'F',
			value: 3
		},
		{
			label: '2020-06-08',
			group: 'D',
			value: 2
		},
		{
			label: '2020-06-08',
			group: 'G',
			value: 2
		},
		{
			label: '2020-06-08',
			group: 'C',
			value: 2
		},
		{
			label: '2020-06-08',
			group: 'E',
			value: 2
		},
		{
			label: '2020-06-08',
			group: 'H',
			value: 1
		},
		{
			label: '2020-06-08',
			group: 'I',
			value: 1
		},
		{
			label: '2020-06-09',
			group: 'A',
			value: 7
		},
		{
			label: '2020-06-09',
			group: 'I',
			value: 1
		},
		{
			label: '2020-06-09',
			group: 'C',
			value: 1
		},
		{
			label: '2020-06-09',
			group: 'F',
			value: 1
		},
		{
			label: '2020-06-09',
			group: 'D',
			value: 1
		},
		{
			label: '2020-06-09',
			group: 'B',
			value: 1
		},
		{
			label: '2020-06-09',
			group: 'J',
			value: 1
		},
		{
			label: '2020-06-09',
			group: 'G',
			value: 1
		},
		{
			label: '2020-06-10',
			group: 'G',
			value: 2
		},
		{
			label: '2020-06-10',
			group: 'A',
			value: 1
		},
		{
			label: '2020-06-10',
			group: 'I',
			value: 1
		},
		{
			label: '2020-06-10',
			group: 'C',
			value: 1
		},
		{
			label: '2020-06-11',
			group: 'A',
			value: 3
		},
		{
			label: '2020-06-11',
			group: 'B',
			value: 1
		},
		{
			label: '2020-06-11',
			group: 'G',
			value: 1
		},
		{
			label: '2020-06-11',
			group: 'C',
			value: 1
		},
		{
			label: '2020-06-12',
			group: 'A',
			value: 1
		},
		{
			label: '2020-06-12',
			group: 'B',
			value: 1
		},
		{
			label: '2020-06-12',
			group: 'G',
			value: 1
		},
		{
			label: '2020-06-12',
			group: 'H',
			value: 1
		},
		{
			label: '2020-06-12',
			group: 'C',
			value: 1
		},
		{
			label: '2020-06-13',
			group: 'A',
			value: 17
		},
		{
			label: '2020-06-13',
			group: 'G',
			value: 3
		},
		{
			label: '2020-06-13',
			group: 'D',
			value: 3
		},
		{
			label: '2020-06-13',
			group: 'B',
			value: 2
		},
		{
			label: '2020-06-13',
			group: 'I',
			value: 2
		},
		{
			label: '2020-06-13',
			group: 'E',
			value: 1
		},
		{
			label: '2020-06-13',
			group: 'H',
			value: 1
		},
		{
			label: '2020-06-14',
			group: 'A',
			value: 26
		},
		{
			label: '2020-06-14',
			group: 'B',
			value: 3
		},
		{
			label: '2020-06-14',
			group: 'I',
			value: 3
		},
		{
			label: '2020-06-14',
			group: 'E',
			value: 2
		},
		{
			label: '2020-06-14',
			group: 'H',
			value: 2
		},
		{
			label: '2020-06-14',
			group: 'F',
			value: 1
		},
		{
			label: '2020-06-14',
			group: 'G',
			value: 1
		},
		{
			label: '2020-06-14',
			group: 'D',
			value: 1
		},
		{
			label: '2020-06-14',
			group: 'J',
			value: 1
		},
		{
			label: '2020-06-15',
			group: 'A',
			value: 19
		},
		{
			label: '2020-06-15',
			group: 'E',
			value: 5
		},
		{
			label: '2020-06-15',
			group: 'H',
			value: 4
		},
		{
			label: '2020-06-15',
			group: 'F',
			value: 3
		},
		{
			label: '2020-06-15',
			group: 'J',
			value: 2
		},
		{
			label: '2020-06-15',
			group: 'B',
			value: 2
		},
		{
			label: '2020-06-15',
			group: 'G',
			value: 2
		},
		{
			label: '2020-06-15',
			group: 'C',
			value: 1
		},
		{
			label: '2020-06-16',
			group: 'A',
			value: 3
		},
		{
			label: '2020-06-16',
			group: 'B',
			value: 3
		},
		{
			label: '2020-06-16',
			group: 'I',
			value: 1
		},
		{
			label: '2020-06-16',
			group: 'C',
			value: 1
		},
		{
			label: '2020-06-16',
			group: 'E',
			value: 1
		},
		{
			label: '2020-06-16',
			group: 'H',
			value: 1
		},
		{
			label: '2020-06-16',
			group: 'D',
			value: 1
		}
	] },
	'mark': 'area',
	'encoding': {
		'x': {
			'timeUnit': 'utcday',
			'field': 'label',
			'axis': { 'format': '%m-%d' },
			'type': 'temporal'
		},
		'y': {
			'field': 'value',
			'type': 'quantitative'
		},
		'color': {
			'field': 'group',
			'type': 'nominal'
		}
	}
}

export { stackedAreaChartSpec }
