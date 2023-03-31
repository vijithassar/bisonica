import { chart } from '../../source/chart.js'
import qunit from 'qunit'
import { select } from 'd3'
import { specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

/**
 * recursively freeze a nested object
 * @param {object} object object to be frozen
 * @returns {object} frozen object
 */
const freeze = object => {
	const propNames = Object.getOwnPropertyNames(object)

	for (const name of propNames) {
		const value = object[name]

		if (value && typeof value === 'object') {
			freeze(value)
		}
	}

	return Object.freeze(object)
}

module('unit > mutation', () => {
	test('does not mutate specifications', assert => {
		const s = freeze(JSON.parse(JSON.stringify(specificationFixture('line'))))
		const dimensions = { x: 500, y: 500 }

		assert.equal(
			typeof chart(s, dimensions),
			'function',
			'factory successfully generates a chart function for a frozen specification'
		)

		const render = () => {
			const node = document.createElement('div')

			select(node).call(chart(s, dimensions))
		}

		render()

		assert.ok(true, 'chart function generated with a frozen specification does not throw error')
	})
})
