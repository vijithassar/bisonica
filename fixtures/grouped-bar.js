const groupedBarChartSpec = {
	$schema: 'https://vega.github.io/schema/vega-lite/v4.json',
	title: {
		text: 'Grouped Bar Chart'
	},
	mark: 'bar',
	encoding: {
		column: {
			field: 'label',
			type: 'temporal',
			title: '',
			timeUnit: 'utcday'
		},
		y: {
			field: 'value',
			type: 'quantitative',
			axis: { title: 'value', grid: false }
		},
		x: {
			field: 'group',
			type: 'nominal',
			axis: { title: '' }
		},
		color: {
			field: 'group',
			type: 'nominal'
		}
	},
	data: {
		values: [
			{
				label: '2020-05-20',
				group: 'a',
				value: 8
			},
			{
				label: '2020-05-20',
				group: 'b',
				value: 4
			},
			{
				label: '2020-05-21',
				group: 'a',
				value: 4
			},
			{
				label: '2020-05-21',
				group: 'b',
				value: 34
			},
			{
				label: '2020-05-22',
				group: 'a',
				value: 6
			},
			{
				label: '2020-05-22',
				group: 'b',
				value: 6
			},
			{
				label: '2020-05-23',
				group: 'a',
				value: 22
			},
			{
				label: '2020-05-23',
				group: 'b',
				value: 46
			},
			{
				label: '2020-05-24',
				group: 'a',
				value: 13
			},
			{
				label: '2020-05-24',
				group: 'b',
				value: 14
			},
			{
				label: '2020-05-25',
				group: 'a',
				value: 13
			},
			{
				label: '2020-05-25',
				group: 'b',
				value: 14
			},
			{
				label: '2020-05-26',
				group: 'a',
				value: 18
			},
			{
				label: '2020-05-26',
				group: 'b',
				value: 21
			}
		]
	}
}

export { groupedBarChartSpec }
