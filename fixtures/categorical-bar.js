const categoricalBarChartSpec = {
	$schema: 'https://vega.github.io/schema/vega-lite/v4.json',
	title: { text: 'Categorical Bar Chart' },
	data: {
		values: [
			{ animal: 'rabbit', value: 31 },
			{ animal: 'cow', value: 25 },
			{ animal: 'snake', value: 25 },
			{ animal: 'elephant', value: 25 },
			{ animal: 'mouse', value: 24 }
		]
	},
	mark: { type: 'bar', tooltip: true },
	encoding: {
		x: { field: 'animal', type: 'nominal' },
		y: { title: 'count', field: 'value', type: 'quantitative' },
		color: { field: null, type: 'nominal' }
	}
}

export { categoricalBarChartSpec }
