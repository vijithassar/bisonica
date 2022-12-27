import { chart } from '../../source/chart.js'
import * as d3 from 'd3'
import qunit from 'qunit'

const { module, test } = qunit

const specification = {
	title: {
		text: 'this specification will cause an error'
	},
	encoding: {},
	mark: {}
}

module('unit > error handling', () => {
	test('catches errors by default', assert => {
		const renderer = chart(specification)
		assert.equal(renderer.error(), console.error)
	})
	test('uses custom error handlers', assert => {
		const dimensions = { x: 500, y: 500 }
		let x = null
		const handler = error => x = error
		const renderer = chart(specification, dimensions).error(handler)
		d3.create('div').call(renderer)
		assert.ok(x instanceof Error)
	})
	test('disables error handling', assert => {
		const renderer = chart(specification).error(null)
		assert.throws(() => renderer())
	})
})
