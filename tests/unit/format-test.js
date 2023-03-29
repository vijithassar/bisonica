import { format } from '../../source/format.js'
import qunit from 'qunit'

const { module, test } = qunit

const date = new Date(2000, 1, 1)
const number = 1000

module('format', () => {
	module('types', () => {
		test('number', assert => {
			const config = {
				format: '~s',
				formatType: 'number'
			}
			assert.equal(format(config)(number), '1k')
		})
		test('time', assert => {
			const config = {
				format: '%Y',
				formatType: 'time'
			}
			assert.equal(format(config)(date), '2000')
		})
	})
	module('contexts', () => {
		test('channel definition', assert => {
			const channel = { field: 'x', type: 'temporal', format: '%Y' }
			assert.equal(format(channel)(date), '2000')
		})
		test('axis definition', assert => {
			const channel = { field: 'x', type: 'temporal', axis: { format: '%Y' } }
			assert.equal(format(channel)(date), '2000')
		})
	})
})
