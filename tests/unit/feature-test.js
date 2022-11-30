import { feature } from '../../source/feature.js'
import qunit from 'qunit'

const { module, test } = qunit

module('unit > feature', () => {
	test('identifies chart features', (assert) => {
		assert.ok(feature({ mark: { type: 'bar' } }).isBar(), 'identifies bar charts')
		assert.ok(feature({ mark: { type: 'arc' } }).isCircular(), 'identifies circular charts')
	})

	test('detects aggregate encodings', (assert) => {
		const x = { encoding: { x: { aggregate: 'a' }, y: { field: 'b' } } }
		const y = { encoding: { x: { field: 'a' }, y: { aggregate: 'b' } } }
		const neither = { encoding: { x: { field: 'a' }, y: { field: 'b' } } }

		assert.ok(feature(x).isAggregate(), 'detects x axis aggregates')
		assert.ok(feature(y).isAggregate(), 'detects y axis aggregates')
		assert.notOk(feature(neither).isAggregate(), 'identifies the absence of aggregates')
	})

	test('always creates feature test methods', (assert) => {
		const s = {}
		const tests = feature(s)
		assert.equal(typeof tests.hasData, 'function', 'successfully creates feature tests for an empty input object')
		Object.keys(tests).forEach(key => {
			assert.equal(typeof tests[key](), 'boolean', `feature test ${key} returns a boolean`)
		})
	})
})
