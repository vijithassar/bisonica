import qunit from 'qunit'
import { render, testSelector } from '../test-helpers.js'
import { specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('integration > stacked-bar', function () {
	test('renders a vertical stacked bar chart', (assert) => {
		const spec = specificationFixture('stackedBar')
		const element = render(spec)

		const mark = testSelector('mark')

		assert.ok(element.querySelector(mark))
		assert.ok(element.querySelector(mark).tagName, 'rect')

		const nodes = [...element.querySelectorAll(mark)]
		const nodeHasPositiveHeight = (node) => Number(node.getAttribute('height')) >= 0
		const nodeHasZeroHeight = (node) => Number(node.getAttribute('height')) === 0
		const nodesHavePositiveHeights = nodes.every(nodeHasPositiveHeight)
		const nodesHaveZeroHeights = nodes.every(nodeHasZeroHeight)

		assert.ok(
			nodesHavePositiveHeights,
			'all mark rects have positive numbers as height attributes'
		)
		assert.ok(!nodesHaveZeroHeights, 'some mark rects have nonzero height attributes')
	})

	test('renders a horizontal stacked bar chart', (assert) => {
		const spec = specificationFixture('stackedBar')

		const { x, y } = spec.encoding

		// invert the encodings
		spec.encoding.x = y
		spec.encoding.y = x

		const element = render(spec)

		const mark = testSelector('mark')

		assert.ok(element.querySelector(mark))
		assert.equal(element.querySelector(mark).tagName, 'rect')

		const nodes = [...element.querySelectorAll(mark)]
		const nodeHasPositiveWidth = (node) => Number(node.getAttribute('width')) >= 0
		const nodeHasZeroWidth = (node) => Number(node.getAttribute('width')) === 0
		const nodesHavePositiveWidths = nodes.every(nodeHasPositiveWidth)
		const nodesHaveZeroWidths = nodes.every(nodeHasZeroWidth)

		assert.ok(nodesHavePositiveWidths, 'all mark rects have positive numbers as width attributes')
		assert.ok(!nodesHaveZeroWidths, 'some mark rects have nonzero width attributes')
	})
})
