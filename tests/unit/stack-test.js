import { markData } from '../../source/marks.js'
import qunit from 'qunit'
import { specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('unit > stack', () => {
	test('stacks', assert => {
		const s = specificationFixture('stackedBar')
		const layout = markData(s)
		assert.ok(layout[0].every(segment => segment[0] === 0), 'first series uses a zero baseline for all segments')
	})
})
