import qunit from 'qunit'
import { expression, expressionStringParse } from '../../source/expression.js'

const { module, test } = qunit

module('expression', () => {
	module('concatenation', () => {
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
	})
	module('functions', () => {
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
	module('string expressions', () => {
		test('converts string expressions to object form', assert => {
			const string = 'datum.x === 1'
			assert.equal(expressionStringParse(string).field, 'x')
			assert.equal(expressionStringParse(string).equal, 1)
		})
	})
})
