const singleBarChartSpec = {
	'title': {
		'text': 'single bar'
	},
	'mark': { 'type': 'bar', 'tooltip': true },
	'data': {
		'values': [
			{ 'group': 'a', 'label': 'x', 'value': 100 },
			{ 'group': 'b', 'label': 'y', 'value': 200 },
			{ 'group': 'c', 'label': 'x', 'value': 300 },
			{ 'group': 'd', 'label': 'w', 'value': 400 }
		]
	},
	'encoding': {
		'y': {
			'type': 'quantitative',
			'field': 'value',
			'axis': { 'title': null }
		},
		'color': { 'field': 'group', 'type': 'nominal', 'legend': { 'title': null } }
	}
}

export { singleBarChartSpec }
