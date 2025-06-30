import { dimensions, charts, internals } from './support.js'
import qunit from 'qunit'

const { module, test } = qunit

const { feature, data, createAccessors, parseScales, createEncoders, marks } = internals

module('unit > internals', () => {
	test('feature()', assert => {
		Object.entries(charts).forEach(([chart, s]) => assert.equal(typeof feature(s), 'object', chart))
	})
	test('data()', assert => {
		Object.entries(charts).forEach(([chart, s]) => assert.ok(Array.isArray(data(s)), chart))
	})
	test('createAccessors()', assert => {
		Object.entries(charts).forEach(([chart, s]) => assert.equal(typeof createAccessors(s), 'object', chart))
	})
	test('parseScales()', assert => {
		Object.entries(charts).forEach(([chart, s]) => assert.equal(typeof parseScales(s), 'object', chart))
	})
	test('createEncoders()', assert => {
		Object.entries(charts).forEach(([chart, s]) => {
			assert.equal(typeof createEncoders(s, dimensions, createAccessors(s)), 'object', chart)
		})
	})
	test('marks()', assert => {
		Object.entries(charts).forEach(([chart, s]) => assert.equal(typeof marks(s, dimensions), 'function', chart))
	})
})
