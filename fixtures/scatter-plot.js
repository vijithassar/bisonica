const scatterPlotSpec = {
	$schema: 'https://vega.github.io/schema/vega-lite/v4.json',
	title: {
		text: 'scatter plot example'
	},
	data: {
		values: [
			{ price: 16, count: 21, section: 'a' },
			{ price: 19, count: 13, section: 'b' },
			{ price: 14, count: 8, section: 'c' },
			{ price: 3, count: 5, section: 'd' },
			{ price: 11, count: 3, section: 'e' },
			{ price: 20, count: 2, section: 'a' },
			{ price: 4, count: 1, section: 'b' },
			{ price: 6, count: 1, section: 'c' },
			{ price: 2, count: 14, section: 'd' },
			{ price: 12, count: 6, section: 'e' },
			{ price: 12, count: 8, section: 'a' },
			{ price: 9, count: 9, section: 'b' },
			{ price: 8, count: 1, section: 'c' },
			{ price: 11, count: 7, section: 'd' },
			{ price: 7, count: 5, section: 'e' },
			{ price: 6, count: 5, section: 'a' },
			{ price: 8, count: 15, section: 'b' },
			{ price: 4, count: 5, section: 'c' },
			{ price: 7, count: 4, section: 'd' },
			{ price: 2, count: 8, section: 'e' },
			{ price: 9, count: 1, section: 'a' },
			{ price: 12, count: 2, section: 'b' },
			{ price: 12, count: 3, section: 'c' },
			{ price: 16, count: 6, section: 'd' },
			{ price: 2, count: 6, section: 'e' },
			{ price: 6, count: 25, section: 'a' },
			{ price: 9, count: 5, section: 'b' },
			{ price: 7, count: 5, section: 'c' },
			{ price: 10, count: 6, section: 'd' },
			{ price: 15, count: 5, section: 'e' }
		]
	},
	encoding: {
		y: { field: 'price', type: 'quantitative' },
		x: { field: 'count', type: 'quantitative' }
	},
	mark: { type: 'point', tooltip: true, filled: true }
}

export { scatterPlotSpec }
