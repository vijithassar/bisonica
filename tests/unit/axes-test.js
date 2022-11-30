import {
	abbreviate,
	format,
	rotation,
	truncate
} from '../../source/text.js'
import qunit from 'qunit'
import { specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('unit > axes', () => {
	test('retrieves x axis text rotation', assert => {
		const s = specificationFixture('stackedBar')

		s.encoding.x.axis = { labelAngle: 90 }
		assert.equal(rotation(s, 'x'), Math.PI / 2)
	})
	test('abbreviates axis tick label text', assert => {
		const s = {
			data: { values: [{ value: 0 }, { value: 10000 }, { value: 100000 }] },
			encoding: {
				x: {
					field: 'value',
					type: 'quantitative'
				}
			}
		}
		const text = abbreviate(s, { x: 100, y: 100 }, 'x')(100000)

		assert.ok(text.endsWith('K'))
	})
	test('formats axis tick label text', assert => {
		const s = {
			encoding: {
				x: {
					type: 'temporal',
					axis: { format: '%Y-%m-%d' }
				},
				y: {
					type: 'nominal'
				}
			}
		}

		const date = new Date(2020, 1, 15)

		assert.equal(format(s, 'x')(date), '2020-02-15', 'parses timestamps')

		const value = 1

		assert.equal(format(s, 'y')(value), '1', 'casts numbers to strings')
	})
	test('truncates axis tick label text', assert => {
		const s = {
			encoding: {
				x: {
					field: 'label',
					type: 'nominal',
					axis: {
						labelLimit: 15
					}
				}
			}
		}
		const text = 'aaaaaaaaaaaaaaaaaaaaaaaaaa'
		const truncated = truncate(s, 'x', text, [])

		assert.ok(truncated.length < text.length, 'truncated text is shorter than original text')
		assert.ok(truncated.endsWith('…'), 'truncated text ends with ellipsis')
	})
})
