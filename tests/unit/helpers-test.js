import * as d3 from 'd3'
import * as helpers from '../../source/helpers.js'
import qunit from 'qunit'

const { module, test } = qunit

module('unit > helpers', () => {
	test('converts polar coordinates to cartesian coordinates', assert => {
		const radius = 10
		const right = helpers.polarToCartesian(radius, 0)
		const up = helpers.polarToCartesian(radius, Math.PI * 0.5)
		const left = helpers.polarToCartesian(radius, Math.PI)
		const down = helpers.polarToCartesian(radius, Math.PI * 1.5)
		const loop = helpers.polarToCartesian(radius, Math.PI * 2)

		assert.equal(right.x, radius)
		assert.equal(up.y, radius)
		assert.equal(left.x, radius * -1)
		assert.equal(down.y, radius * -1)
		assert.equal(loop.x, right.x)
	})
	test('renders to a detached node', assert => {
		const renderer = selection => {
			selection.append('g').classed('test', true).append('circle').attr('r', 10)
		}
		const selection = d3.create('svg')
		selection.call(helpers.detach(renderer))
		assert.ok(selection.select('g.test').size(), 1)
		assert.ok(selection.select('circle').size(), 1)
	})
	test('deduplicates channels by field', assert => {
		const s = {
			encoding: {
				'x': { field: 'a' },
				'y': { field: 'a' }
			}
		}
		assert.equal(helpers.deduplicateByField(s)(Object.keys(s.encoding)).length, 1)
	})
})
