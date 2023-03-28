import qunit from 'qunit'
import { predicate } from '../../source/predicate.js'

const { module, test } = qunit

const data = () => {
	return [
		{ x: 1 },
		{ x: 2 },
		{ x: 3 },
		{ x: 4 },
		{ x: 5 },
		{ x: 6 }
	]
}

module('unit > predicate', () => {
	module('simple predicates', () => {
		test('lt', assert => {
			const config = { lt: 5, field: 'x' }
			assert.equal(typeof predicate(config), 'function', 'generates a simple predicate function')
			assert.equal(data().filter(predicate(config)).length, 4, 'predicate function works for filtering')
		})
	})
	module('predicate composition', () => {
		const run = config => {
			return data()
				.filter(predicate(config))
				.map(item => item.x)
				.join(',')
		}
		test('and', assert => {
			const config = { and: [
				{ oneOf: [1, 2], field: 'x' },
				{ equal: 1, field: 'x' }
			] }
			assert.equal(run(config), '1')
		})
		test('or', assert => {
			const config = { or: [
				{ oneOf: [1, 2], field: 'x' },
				{ equal: 3, field: 'x' }
			] }
			assert.equal(run(config), '1,2,3')
		})
		test('not', assert => {
			const config = { not: [
				{ oneOf: [1, 2], field: 'x' },
				{ oneOf: [3, 4], field: 'x' }
			] }
			assert.equal(run(config), '5,6')
		})
	})
})
