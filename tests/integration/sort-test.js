import * as d3 from 'd3'
import qunit from 'qunit'
import { render, testSelector, specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('integration > sort', function () {
	test('renders marks in ascending order', assert => {
		const spec = specificationFixture('categoricalBar')

		spec.encoding.x.sort = 'y'
		const element = render(spec)

		const markSelector = testSelector('mark')

		const marks = [...element.querySelectorAll(markSelector)]
		const data = marks.map(mark => d3.select(mark).datum())
		const values = data.map(item => item.data._.value)
		const sorted = values.slice().sort(d3.ascending)

		assert.deepEqual(values, sorted)
	})
	test('renders marks in descending order', assert => {
		const spec = specificationFixture('categoricalBar')

		spec.encoding.x.sort = '-y'
		const element = render(spec)

		const markSelector = testSelector('mark')

		const marks = [...element.querySelectorAll(markSelector)]
		const data = marks.map(mark => d3.select(mark).datum())
		const values = data.map(item => item.data._.value)
		const sorted = values.slice().sort(d3.descending)

		assert.deepEqual(values, sorted)
	})
})
