import qunit from 'qunit'
import { expression } from '../../source/expression.js'

const { module, test } = qunit

module('expression', () => {
	test('interpolates properties', assert => {
		const exp = "'>-' + datum.a"
		const datum = { a: '•' }
		assert.equal(expression(exp)(datum), '>-•')
	})
	test('interpolates multiple properties', assert => {
		const exp = "'>-' + datum.a + '-' + datum.b"
		const datum = { a: '•', b: '*' }
		assert.equal(expression(exp)(datum), '>-•-*')
	})
	test('omits malformed string interpolations', assert => {
		const exp = "'>' + '-' + datum.a + '-*"
		const datum = { a: '•' }
		assert.equal(expression(exp)(datum), '>-•')
	})
	test('random()', assert => {
		const exp = 'random()'
		assert.equal(typeof expression(exp)(), 'number')
	})
	test('now()', assert => {
		const exp = 'now()'
		assert.equal(typeof expression(exp)(), 'number')
		assert.equal(expression(exp)(), Date.now())
	})
})
