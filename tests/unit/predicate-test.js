import qunit from 'qunit'
import { predicate } from '../../source/predicate.js'

const { module, test } = qunit

module('unit > predicate', () => {
	module('simple predicates', () => {
		test('lt', assert => {
			const config = { lt: 5, field: 'x' }
			const data = [
				{ x: 1 },
				{ x: 2 },
				{ x: 3 },
				{ x: 4 },
				{ x: 5 },
				{ x: 6 }
			]
			assert.equal(typeof predicate(config), 'function', 'generates a simple predicate function')
			assert.equal(data.filter(predicate(config)).length, 4, 'predicate function works for filtering')
		})
	})
})
