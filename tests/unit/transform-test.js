import {
	calculate,
	transformDatum,
	transformValues
} from '../../source/transform.js'
import { parseScales } from '../../source/scales.js'
import { data } from '../../source/data.js'
import { encodingValue } from '../../source/encodings.js'
import qunit from 'qunit'
import { specificationFixture } from '../test-helpers.js'
import * as d3 from 'd3'

const { module, test } = qunit

const expressions = {
	naive: "'https://www.example.com' + '/' + 'test'",
	interpolate: "'https://www.example.com' + '/' + datum.a",
	multiple: "'https://www.example.com' + '/' + datum.a + datum.b"
}

module('unit > transform', () => {
	module('calculate', () => {
		test('adds derived fields to a data point', assert => {
			const s = { transform: [{ calculate: expressions.naive, as: 'a' }] }

			assert.equal(transformDatum(s)({}).a, 'https://www.example.com/test')
		})
		test('runs multiple calculate transforms', assert => {
			const datum = {
				a: 1,
				b: 2
			}
			const s = {
				transform: [
					{ calculate: expressions.naive, as: 'c' },
					{ calculate: expressions.interpolate, as: 'd' },
					{ calculate: expressions.multiple, as: 'e' }
				]
			}

			assert.equal(transformDatum(s)(datum).c, 'https://www.example.com/test')
			assert.equal(transformDatum(s)(datum).d, 'https://www.example.com/1')
			assert.equal(transformDatum(s)(datum).e, 'https://www.example.com/12')
		})
		test('falls back to transform lookups', assert => {
			const s = {
				data: { values: [{ a: 1 }] },
				transform: [{ calculate: "'value: ' + datum.a", as: 'b' }],
				encoding: { x: { type: 'nominal', field: 'b' } }
			}

			assert.equal(encodingValue(s, 'x')(s.data.values[0]), 'value: 1')
		})
		test('is a function factory', assert => {
			assert.equal(typeof calculate, 'function')
			assert.equal(typeof calculate(expressions.naive), 'function')
		})
		test('requires a string input', assert => {
			assert.throws(() => calculate(0))
			assert.throws(() => calculate(null))
			assert.throws(() => calculate(undefined))
			assert.throws(() => calculate([]))
			assert.throws(() => calculate({}))
		})
		test('returns a string', assert => {
			assert.equal(calculate(expressions.naive)({}), 'https://www.example.com/test')
		})
	})
	module('fold', () => {
		const specification = () => {
			return {
				data: { values: [
					{ a: 1, b: 2 },
					{ a: 3, b: 4 },
					{ a: 5, b: 6 },
					{ a: 7, b: 8 },
					{ a: 9, b: 10 }
				] }
			}
		}
		test('folds fields with default keys', assert => {
			const s = specification()
			s.transform = [
				{ fold: ['a', 'b'] }
			]
			const transformed = transformValues(s)(s.data.values)
			const keys = ['key', 'value']
			assert.equal(transformed.length, s.data.values.length * s.transform[0].fold.length)
			keys.forEach(property => {
				assert.ok(transformed.every(item => item[property]))
			})
		})
		test('folds fields with custom keys', assert => {
			const s = specification()
			s.transform = [
				{ fold: ['a', 'b'], as: ['_', '$'] }
			]
			const transformed = transformValues(s)(s.data.values)
			const keys = s.transform[0].as
			assert.equal(transformed.length, s.data.values.length * s.transform[0].fold.length)
			keys.forEach(property => {
				assert.ok(transformed.every(item => item[property]))
			})
		})
	})
	module('sample', () => {
		test('randomly samples from data set', assert => {
			const n = 50
			const s = {
				data: {
					values: d3.range(n * 2).map(item => {
						return { value: item }
					})
				},
				encoding: {},
				transform: [
					{ sample: n }
				]
			}
			assert.equal(data(s).length, n)
		})
	})
	module('filter', () => {
		const specification = () => {
			return { data: { values: [
				{ x: 1 },
				{ x: 2 },
				{ x: 3 },
				{ x: 4 },
				{ x: 5 },
				{ x: 6 },
				{ x: 7 }
			] } }
		}
		const run = s => {
			return transformValues(s)(s.data.values)
				.map(item => item.x)
				.join(',')
		}
		const setup = (s, key, value) => {
			s.transform = [{ filter: { [key]: value, field: 'x' } }]
			return s
		}
		module('predicates', () => {
			test('lt', assert => {
				const s = setup(specification(), 'lt', 5)
				assert.equal(run(s), '1,2,3,4')
			})
			test('lte', assert => {
				const s = setup(specification(), 'lte', 5)
				assert.equal(run(s), '1,2,3,4,5')
			})
			test('gt', assert => {
				const s = setup(specification(), 'gt', 5)
				assert.equal(run(s), '6,7')
			})
			test('gte', assert => {
				const s = setup(specification(), 'gte', 5)
				assert.equal(run(s), '5,6,7')
			})
			test('equal', assert => {
				const s = setup(specification(), 'equal', 5)
				assert.equal(run(s), '5')
			})
			test('oneOf', assert => {
				const s = setup(specification(), 'oneOf', [5, 7])
				assert.equal(run(s), '5,7')
			})
			test('range', assert => {
				const s = setup(specification(), 'range', [3, 5])
				assert.equal(run(s), '3,4,5')
			})
			test('valid', assert => {
				const s = setup(specification(), 'valid', [3, 5])
				s.data.values.push({ x: null })
				assert.equal(run(s), '1,2,3,4,5,6,7')
			})
		})
		module('mechanics', () => {
			test('data functions apply filters', assert => {
				const s = specificationFixture('circular')
				s.transform = [{ filter: { field: 'group', oneOf: ['A', 'B', 'C'] } }]
				assert.equal(data(s).length, 3)
			})
			test('filters change scale domains', assert => {
				const s = specificationFixture('line')
				const max = 8
				s.transform = [{ filter: { lte: max, field: 'value' } }]
				const { y } = parseScales(s)
				assert.equal(y.domain()[1], max)
			})
		})
		module('composition', () => {
			test('applies multiple filters in sequence', assert => {
				const s = specification()
				s.transform = [
					{ filter: { lte: 4, field: 'x' } },
					{ filter: { oneOf: [1, 2, 3], field: 'x' } },
					{ filter: { oneOf: [2, 3], field: 'x' } }
				]
				assert.equal(run(s), '2,3')
			})
			test('filters on multiple fields', assert => {
				const s = {
					data: {
						values: [
							{ x: 1, _: '$' },
							{ x: 2, _: '•' },
							{ x: 3, _: '*' },
							{ x: 4, _: '•' },
							{ x: 5, _: '*' },
							{ x: 6, _: '•' },
							{ x: 7, _: '$' }
						]
					},
					transform: [
						{ filter: { lte: 4, field: 'x' } },
						{ filter: { oneOf: ['•', '*'], field: '_' } }
					]
				}
				assert.equal(run(s), '2,3,4')
			})
			test('filters on derived fields created with the calculate transform', assert => {
				const s = {
					data: {
						values: [
							{ x: 1, _: '$' },
							{ x: 2, _: '•' },
							{ x: 3, _: '*' },
							{ x: 4, _: '•' },
							{ x: 5, _: '*' },
							{ x: 6, _: '•' },
							{ x: 7, _: '$' }
						]
					},
					transform: [
						{ calculate: "'>' + datum._", as: '__' },
						{ filter: { oneOf: ['>•', '>*'], field: '__' } }
					]
				}
				assert.equal(run(s), '2,3,4,5,6')
			})
			test('applies multiple transforms in sequence', assert => {
				const s = {
					data: {
						values: [
							{ x: 1, _: '$' },
							{ x: 1, _: '$' },
							{ x: 2, _: '*' },
							{ x: 2, _: '*' },
							{ x: 3, _: '•' },
							{ x: 3, _: '•' },
							{ x: 3, _: '•' }
						]
					},
					transform: [
						{ filter: { equal: 3, field: 'x' } },
						{ sample: 2 }
					]
				}
				assert.equal(run(s), '3,3')
			})
		})
	})
})
