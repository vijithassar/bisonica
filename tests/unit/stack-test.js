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
	test('normalizes stacking', assert => {
		const precision = 15
		const s = specificationFixture('stackedBar')
		s.encoding.y.stack = 'normalize'
		const layout = markData(s)
		const first = layout[0]
		const last = layout[layout.length - 1]
		const zero = ([start, _]) => start === 0
		const one = ([_, end]) => +end.toFixed(precision) === 1
		assert.ok(first.every(zero), 'first series uses a zero baseline for all segments')
		assert.ok(last.every(one), 'final series extends all segments to maximum value')
	})
})
