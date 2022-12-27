import qunit from 'qunit'
import { render, testSelector, specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('integration > stacked area', function() {
	test('renders a stacked area chart', assert => {
		const spec = specificationFixture('stackedArea')
		const element = render(spec)

		const mark = testSelector('mark')
		const marks = [...element.querySelectorAll(mark)]
		const { field } = spec.encoding.color
		const categories = [...new Set(spec.data.values.map(item => item[field]))]

		assert.ok(marks.every(mark => mark.tagName === 'path'), 'every mark is a path node')
		assert.equal(marks.length, categories.length, 'one mark node per data category')
	})
})
