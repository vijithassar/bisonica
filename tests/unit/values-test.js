import { values } from '../../source/values.js'
import qunit from 'qunit'

const { module, test } = qunit

module('unit > values', () => {
	test('extracts values from specification', assert => {
		const value = {}
		const s = { data: { values: [value] } }

		assert.equal(values(s).pop(), value)
	})
	test('looks up nested values', assert => {
		const nestedData = { first: { second: [{ a: 1, b: 2 }] } }
		const s = {
			data: nestedData
		}
		s.data.format = { property: 'first.second', type: 'json' }
		const data = values(s)
		assert.ok(Array.isArray(data))
		assert.equal(data.length, 1)
		assert.equal(data[0].a, 1)
		assert.equal(data[0].b, 2)
	})
	test('parses field types', assert => {
		const s = {
			data: {
				values: [{ a: null, b: 0, c: 2020 }],
				format: {
					parse: {
						a: 'number',
						b: 'boolean',
						c: 'date'
					}
				}
			}
		}
		const parsed = values(s)[0]
		assert.strictEqual(parsed.a, 0)
		assert.strictEqual(parsed.b, false)
		assert.equal(typeof parsed.c.getFullYear, 'function')
	})
})
