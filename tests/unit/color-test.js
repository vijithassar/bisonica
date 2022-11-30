import { parseScales } from '../../source/scales.js'
import qunit from 'qunit'
import { specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('unit > color', () => {
	const defaultColor = 'steelblue'
	const newColor = 'green'
	test('color scales use default single color', assert => {
		const s = specificationFixture('categoricalBar')
		const { color } = parseScales(s)
		assert.equal(color(), defaultColor)
	})
	test('color scales use custom single color based on value encoding', assert => {
		const s = specificationFixture('categoricalBar')
		s.encoding.color = { value: newColor }
		const { color } = parseScales(s)
		assert.equal(color(), newColor)
	})
})
