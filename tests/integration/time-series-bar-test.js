import qunit from 'qunit'
import {
	nodesHavePositiveHeights,
	render,
	specificationFixture,
	testSelector
} from '../test-helpers.js'

const { module, test } = qunit

const approximate = (value) => Math.round(value * 100) / 100

module('integration > temporal-bar', function () {
	test('renders a time series bar chart', (assert) => {
		const spec = specificationFixture('temporalBar')

		const element = render(spec)
		const mark = testSelector('mark')

		assert.ok(element.querySelector(mark))
		assert.equal(element.querySelector(mark).tagName, 'rect')

		const nodes = [...element.querySelectorAll(mark)]

		assert.ok(
			nodesHavePositiveHeights(nodes),
			'all mark rects have positive numbers as height attributes'
		)

		let baseline = nodes[0].getBoundingClientRect().bottom

		nodes.forEach((node, i) => {
			let { bottom } = node.getBoundingClientRect()

			assert.equal(
				approximate(bottom),
				approximate(baseline),
				`Rect #${i} starts at the correct position: about: ${approximate(baseline)}`
			)
		})
	})

	test('handles input data with all zero values', (assert) => {
		const spec = specificationFixture('temporalBar')

		spec.data.values.forEach((item) => {
			item.value = 0
		})

		const element = render(spec)
		element.querySelectorAll('rect.mark').forEach((mark) => {
			assert.equal(mark.getAttribute('height'), 0)
		})
	})
})
