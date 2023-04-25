import { createAccessors } from '../../source/accessors.js'
import { createEncoders } from '../../source/encodings.js'
import qunit from 'qunit'

const { module, test } = qunit

module('unit > condition', () => {
	test('conditional encoding', assert => {
		const s = {
			data: {
				values: [
					{ a: '_', b: true },
					{ a: '•', b: true },
					{ a: '_', b: false },
					{ a: '_', b: true }
				]
			},
			mark: {
				type: 'arc'
			},
			encoding: {
				color: {
					field: 'a',
					type: 'nominal',
					condition: {
						test: { field: 'b', equal: true },
						value: 'black'
					}
				}
			}
		}
		const dimensions = { x: 500, y: 500 }
		const { color } = createEncoders(s, dimensions, createAccessors(s))
		const encode = i => color(s.data.values[i])
		assert.notEqual(encode(0), encode(1))
		assert.notEqual(encode(1), encode(2))
		assert.notEqual(encode(0), encode(2))
		assert.equal(encode(2), 'black')
		assert.equal(encode(0), encode(3))
	})
})
