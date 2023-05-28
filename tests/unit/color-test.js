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
	test('generates accessible color palettes', assert => {
		const range = s => parseScales(s).color.range().join(' ')
		const standard = range(specificationFixture('circular'));
		['tritanopia', 'deuteranopia', 'protanopia'].forEach(variant => {
			const s = specificationFixture('circular')
			s.usermeta = { color: { variant } }
			assert.notEqual(range(s), standard, variant)
		})
	})
	test('supports named color schemes', assert => {
		const normal = specificationFixture('circular')
		const normalRange = parseScales(normal).color.range()
		const accent = specificationFixture('circular')
		accent.encoding.color.scheme = 'accent'
		const accentRange = parseScales(accent).color.range()
		assert.notEqual(normalRange.join(' '), accentRange.join(' '))
	})
})
