import qunit from 'qunit'
import { specificationFixture } from '../test-helpers.js'
import { axisDescription, chartDescription } from '../../source/descriptions.js'

const { module, test } = qunit

module('unit > description', () => {
	module('axis', () => {
		const charts = ['line', 'multiline', 'categoricalBar', 'scatterPlot', 'stackedArea', 'stackedBar', 'temporalBar']
		const prohibited = ['undefined', 'NaN', 'null']
		const channels = ['x', 'y']
		charts.forEach(chart => {
			test(chart, assert => {
				const s = specificationFixture(chart)
				channels.forEach(channel => {
					const text = axisDescription(s, channel)
					const valid = text.length && prohibited.every(substring => text.includes(substring) === false)
					assert.ok(valid, `generates ${channel} axis description`)
				})
			})
		})
	})

	module('chart', () => {
		const specification = () => {
			return {
				mark: {
					type: 'arc'
				},
				encoding: {
					theta: {
						field: 'size',
						type: 'quantitative'
					},
					color: {
						field: 'type',
						type: 'nominal'
					}
				}
			}
		}
		test('generates chart description based on encodings', assert => {
			const s = specification()
			const description = chartDescription(s)
			assert.equal(description, 'Pie chart of size split by type. Use the arrow keys to navigate.')
		})
		test('describes how to open links with keyboard navigation', assert => {
			const s = specification()
			s.encoding.href = { field: 'url' }
			const description = chartDescription(s)
			assert.ok(description.includes('Enter key'))
			assert.ok(description.includes('open links'))
		})
		test('prepends custom chart description', assert => {
			const s = specification()
			s.description = 'this is a chart with a custom description!'
			const description = chartDescription(s)
			assert.equal(description, 'this is a chart with a custom description! Pie chart of size split by type. Use the arrow keys to navigate.')
		})
	})
})
