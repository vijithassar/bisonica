import { data, values } from '../../source/data.js'
import { encodingField } from '../../source/encodings.js'
import { getTimeParser } from '../../source/time.js'
import qunit from 'qunit'
import { specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('unit > data', () => {
	module('utilities', () => {
		test('extracts values from specification', assert => {
			const value = {}
			const s = { data: { values: [value] } }

			assert.equal(values(s).pop(), value)
		})
		test('looks up nested data', assert => {
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
	})
	module('sources', () => {
		test('retrieves values from top level datasets property', assert => {
			const s = specificationFixture('circular')
			const name = '_'
			s.datasets = { [name]: s.data.values }
			delete s.data.values
			s.data.name = name
			const valid = item => typeof item === 'object' && typeof item.key === 'string' && typeof item.value === 'number'
			assert.ok(data(s).every(valid))
		})
		test('wraps primitives in objects', assert => {
			const s = {
				data: { values: [1, 2, 3] },
				mark: { type: 'point' },
				encoding: { x: { field: 'data', type: 'quantitative' } }
			}
			assert.ok(data(s).every(item => typeof item.data === 'number'))
		})
		test('generates data sequences', assert => {
			const s = {
				data: { sequence: {
					start: 0,
					stop: 100,
					step: 10,
					as: '_'
				} },
				mark: { type: 'point' },
				encoding: { x: { field: 'data', type: 'quantitative' } }
			}
			assert.ok(data(s).length, 10)
			assert.ok(data(s).every(item => typeof item._ === 'number'))
		})
	})
	module('chart forms', () => {
		test('compiles stacked bar data', assert => {
			const stacked = data(specificationFixture('stackedBar'))

			assert.ok(
				stacked.every(item => Array.isArray(item)),
				'stacked bar data returns arrays'
			)
			assert.ok(
				stacked.every(item => {
					return item.every(point => point.length === 2)
				}),
				'every item in the stack is an array of two points'
			)
			assert.ok(
				stacked.every(item => typeof item.key === 'string'),
				'each series has a string key'
			)
			assert.ok(
				stacked.every(item => typeof item.index === 'number'),
				'each series has a numerical index'
			)
		})

		test('compiles single-series data using a placeholder encoding key when a series encoding is not present', assert => {
			const barData = data(specificationFixture('categoricalBar'))

			assert.ok(Array.isArray(barData), 'data function returns an array')
			assert.equal(barData.length, 1, 'single series')
			assert.equal(barData[0].key, '_', 'series key is an underscore')
		})

		test('compiles single-series data using the original encoding key when a series encoding is present', assert => {
			const specification = specificationFixture('categoricalBar')
			const field = 'a'
			const value = 'b'
			specification.data.values = specification.data.values.map(item => {
				item[field] = value
				return item
			})
			specification.encoding.color = {
				field,
				type: 'nominal'
			}
			const barData = data(specification)
			assert.ok(Array.isArray(barData), 'data function returns an array')
			assert.equal(barData.length, 1, 'single series')
			assert.equal(barData[0].key, value, 'series key is the encoding field')
		})

		test('computes circular chart data', assert => {
			const segments = data(specificationFixture('circular'))
			const keys = segments.every(item => typeof item.key === 'string')

			assert.ok(keys, 'every segment has a key')

			const values = segments.every(item => typeof item.value === 'number')

			assert.ok(values, 'every segment has a value')
		})

		test('compiles line chart data', assert => {
			const spec = specificationFixture('multiline')
			const dailyTotals = data(spec, encodingField(spec, 'x'))
			const groupNames = dailyTotals.every(
				item => typeof item[encodingField(spec, 'color')] === 'string'
			)

			assert.ok(groupNames, 'every series specifies a group')

			const valueArrays = dailyTotals.every(item => Array.isArray(item.values))

			assert.ok(valueArrays, 'every series includes an array of values')

			const parser = getTimeParser(dailyTotals[0].values[0].period)
			const periods = dailyTotals.every(series => {
				return series.values.every(item => typeof parser(item.period).getFullYear === 'function')
			})

			assert.ok(periods, 'every item specifies a valid time period')

			const values = dailyTotals.every(series => {
				return series.values.every(item => typeof item[encodingField(spec, 'y')] === 'number')
			})

			assert.ok(values, 'every item includes a value')
		})
	})
})
