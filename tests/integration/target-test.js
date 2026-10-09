
import qunit from 'qunit'
import { select } from 'd3'
import { chart } from '../../source/chart.js'
import { circularChartSpec as specification } from '../../fixtures/circular.js'

const { module, test } = qunit

module('integration > target', function() {
	const dimensions = { x: 500, y: 500 }
	const renderer = chart(specification, dimensions)
	const success = selection => selection.select('div.chart').size() === 1
	test('renders a chart into d3 selection target', assert => {
		const node = document.createElement('div')
		const rendered = select(node).call(renderer)
		assert.ok(success(rendered))
	})
	test('renders a chart using HTML Element target', assert => {
		const node = document.createElement('div')
		renderer(node)
		const rendered = select(node)
		assert.ok(success(rendered))
	})
})
