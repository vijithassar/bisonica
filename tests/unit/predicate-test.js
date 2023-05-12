import qunit from 'qunit'
import { predicate } from '../../source/predicate.js'

const { module, test } = qunit

const data = () => {
	return [
		{ x: 1, _: 'apple pie' },
		{ x: 2, _: 'banana split' },
		{ x: 3, _: 'cherry cobbler' },
		{ x: 4, _: 'donut' },
		{ x: 5, _: 'eclair' },
		{ x: 6, _: 'flan' }
	]
}

const run = config => {
	return data().filter(predicate(config)).map(item => item.x).join(',')
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
	module('string expression predicates', () => {
		const comparisons = {
			'==': 'equal',
			'===': 'equal',
			'>': 'gt',
			'>=': 'gte',
			'<': 'lt',
			'<=': 'lte'
		}
		Object.entries(comparisons).forEach(([symbol, key]) => {
			test(`${key} (${symbol})`, assert => {
				const string = `datum.x ${symbol} 1`
				const object = { field: 'x', [key]: 1 }
				assert.equal(run(string), run(object))
			})
		})
	})
	test('equal (===) with string comparison', assert => {
		const string = 'datum._ === "apple pie"'
		assert.equal(run(string), 1)
	})
})
