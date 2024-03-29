const temporalBarChartSpec = {
	$schema: 'https://vega.github.io/schema/vega-lite/v4.json',
	title: { text: 'temporal bar chart' },
	data: {
		values: [
			{ value: 10, date: '2010' },
			{ value: 20, date: '2011' },
			{ value: 10, date: '2012' },
			{ value: 30, date: '2013' },
			{ value: 50, date: '2014' },
			{ value: 10, date: '2015' }
		]
	},

	mark: { type: 'bar', tooltip: true },
	encoding: {
		y: { field: 'value', type: 'quantitative' },
		x: { field: 'date', type: 'temporal', timeUnit: 'utcyear', axis: { format: '%Y' } }
	}
}

export { temporalBarChartSpec }
