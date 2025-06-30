import { dimensions, charts, internals } from './support.js'
import qunit from 'qunit'
import { specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

const { feature, data, createAccessors, parseScales, createEncoders, marks } = internals

module('unit > internals', () => {
	test('feature()', assert => {
		charts.forEach(chart => assert.equal(typeof feature(specificationFixture(chart)), 'object', chart))
	})
	test('data()', assert => {
		charts.forEach(chart => assert.ok(Array.isArray(data(specificationFixture(chart))), chart))
	})
	test('createAccessors()', assert => {
		charts.forEach(chart => assert.equal(typeof createAccessors(specificationFixture(chart)), 'object', chart))
	})
	test('parseScales()', assert => {
		charts.forEach(chart => assert.equal(typeof parseScales(specificationFixture(chart)), 'object', chart))
	})
	test('createEncoders()', assert => {
		charts.forEach(chart => {
			assert.equal(typeof createEncoders(specificationFixture(chart), dimensions, createAccessors(specificationFixture(chart))), 'object', chart)
		})
	})
	test('marks()', assert => {
		charts.forEach(chart => assert.equal(typeof marks(specificationFixture(chart), dimensions), 'function', chart))
	})
})
