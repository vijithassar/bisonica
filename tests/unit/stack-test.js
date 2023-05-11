import { markData } from '../../source/marks.js'
import qunit from 'qunit'
import { render, testSelector, specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('unit > stack', () => {
	const precision = 15
	const zero = ([start, _]) => start === 0
	const one = ([_, end]) => +end.toFixed(precision) === 1
	test('stacks', assert => {
		const s = specificationFixture('stackedBar')
		const layout = markData(s)
		assert.ok(layout[0].every(segment => segment[0] === 0), 'first series uses a zero baseline for all segments')
	})
	test('normalizes stacking', assert => {
		const s = specificationFixture('stackedBar')
		s.encoding.y.stack = 'normalize'
		const layout = markData(s)
		const first = layout[0]
		const last = layout[layout.length - 1]
		assert.ok(first.every(zero), 'first series uses a zero baseline for all segments')
		assert.ok(last.every(one), 'final series extends all segments to maximum value')
	})
	test('disables stacking', assert => {
		const s = specificationFixture('stackedBar')
		s.encoding.y.stack = null
		// testing disabled stacking requires rendered DOM because it's
		// handled with control flow and is not visible in the layout
		// returned from d3.stack() and markData()
		const element = render(s)
		const baseline = mark => +mark.getAttribute('y') + +mark.getAttribute('height')
		const baselines = new Set([...element.querySelectorAll(testSelector('mark'))].map(baseline))
		assert.equal(baselines.size, 1, 'all marks have the same baseline')
	})
})
