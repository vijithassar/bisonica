const lineChartSpec = {
	'$schema': 'https://vega.github.io/schema/vega-lite/v4.json',
	'title': {
		'text': 'Line Chart Example'
	},
	'mark': {
		'type': 'line',
		'point': true,
		'tooltip': true
	},
	'encoding': {
		'x': {
			'field': 'label',
			'type': 'temporal',
			'axis': {
				'title': 'date',
				'format': '%d'
			}
		},
		'y': {
			'title': 'count',
			'field': 'value',
			'type': 'quantitative'
		}
	},
	'data': {
		'values': [
			{
				'label': '2020-05-20',
				'value': 8
			},
			{
				'label': '2020-05-21',
				'value': 4
			},
			{
				'label': '2020-05-23',
				'value': 2
			},
			{
				'label': '2020-05-24',
				'value': 8
			},
			{
				'label': '2020-05-25',
				'value': 4
			},
			{
				'label': '2020-05-26',
				'value': 2
			},
			{
				'label': '2020-05-28',
				'value': 5
			},
			{
				'label': '2020-05-29',
				'value': 3
			},
			{
				'label': '2020-05-31',
				'value': 9
			},
			{
				'label': '2020-06-02',
				'value': 1
			},
			{
				'label': '2020-06-03',
				'value': 7
			},
			{
				'label': '2020-06-04',
				'value': 7
			},
			{
				'label': '2020-06-05',
				'value': 14
			},
			{
				'label': '2020-06-06',
				'value': 5
			},
			{
				'label': '2020-06-07',
				'value': 4
			},
			{
				'label': '2020-06-08',
				'value': 7
			},
			{
				'label': '2020-06-09',
				'value': 7
			},
			{
				'label': '2020-06-10',
				'value': 1
			},
			{
				'label': '2020-06-11',
				'value': 3
			},
			{
				'label': '2020-06-12',
				'value': 1
			},
			{
				'label': '2020-06-13',
				'value': 17
			},
			{
				'label': '2020-06-14',
				'value': 26
			},
			{
				'label': '2020-06-15',
				'value': 19
			},
			{
				'label': '2020-06-16',
				'value': 3
			}
		]
	}
}

export { lineChartSpec }
