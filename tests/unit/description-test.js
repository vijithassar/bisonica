import qunit from 'qunit'
import { specificationFixture } from '../test-helpers.js'
import { axisDescription } from '../../source/descriptions.js'

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
})
