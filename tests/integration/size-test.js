import qunit from 'qunit'
import { render, testSelector, specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

const markSizes = element => {
	const marks = [...element.querySelectorAll(testSelector('marks-mark-point'))]
	const radii = marks.map(mark => mark.getAttribute('r'))
	return new Set(radii).size
}

module('integration > size', function() {
	test('renders a scatter plot with consistent mark size', assert => {
		const s = specificationFixture('scatterPlot')
		const element = render(s)
		assert.equal(markSizes(element), 1, 'marks have consistent size')
	})
	test('renders a bubble plot with variable mark size', assert => {
		const s = specificationFixture('scatterPlot')
		s.data.values = s.data.values.map(item => {
			return {
				...item,
				_: Math.random()
			}
		})
		s.encoding.size = { field: '_', type: 'quantitative' }
		const element = render(s)
		assert.ok(markSizes(element) > 1, 'marks have variable size')
	})
})
