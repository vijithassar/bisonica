import { feature } from '../../source/feature.js'
import qunit from 'qunit'

const { module, test } = qunit

module('unit > feature', () => {
	test('identifies chart features', assert => {
		assert.ok(feature({ mark: { type: 'bar' } }).isBar(), 'identifies bar charts')
		assert.ok(feature({ mark: { type: 'arc' } }).isCircular(), 'identifies circular charts')
	})

	test('always creates feature test methods', assert => {
		const s = {}
		const tests = feature(s)
		assert.equal(typeof tests.hasData, 'function', 'successfully creates feature tests for an empty input object')
		Object.keys(tests).forEach(key => {
			assert.equal(typeof tests[key](), 'boolean', `feature test ${key} returns a boolean`)
		})
	})
})
