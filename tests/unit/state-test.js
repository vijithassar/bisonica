import { createState } from '../../source/state.js'
import qunit from 'qunit'

const { module, test } = qunit

module('state', () => {
	test('creates a state manager', assert => {
		const state = createState()
		assert.equal(typeof state, 'object')
		assert.equal(typeof state.init, 'function')
	})
	test('stores index', assert => {
		const state = createState()
		const value = 5
		state.index(value)
		assert.equal(state.index(), value)
	})
})
