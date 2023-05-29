import qunit from 'qunit'
import { chart } from '../../source/chart.js'
import { testSelector, specificationFixture } from '../test-helpers.js'
import * as d3 from 'd3'

const { module, test } = qunit

module('unit > chart', () => {
	const dimensions = { x: 500, y: 500 }
	test('creates a chart function with separate dimensions object', assert => {
		const s = specificationFixture('circular')
		const selection = d3.create('svg:svg').append('svg:g')
		const renderer = chart(s, dimensions)
		selection.call(renderer)
		const marks = selection.selectAll(testSelector('mark'))
		assert.equal(marks.size(), s.data.values.length)
	})
	test('creates a chart function with dimensions in specification', assert => {
		const s = specificationFixture('circular')
		s.width = dimensions.x
		s.height = dimensions.y
		const selection = d3.create('svg:svg').append('svg:g')
		const renderer = chart(s)
		selection.call(renderer)
		const marks = selection.selectAll(testSelector('mark'))
		assert.equal(marks.size(), s.data.values.length)
	})
	test('creates a chart function with step dimension in specification', assert => {
		const s = specificationFixture('categoricalBar')
		s.width = { step: 50 }
		s.height = dimensions.y
		const selection = d3.create('svg:svg').append('svg:g')
		const renderer = chart(s)
		selection.call(renderer)
		const marks = selection.selectAll(testSelector('mark'))
		assert.equal(marks.size(), s.data.values.length)
	})
})
