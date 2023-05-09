import {
	render,
	specificationFixture,
	testSelector
} from '../test-helpers.js'
import qunit from 'qunit'

const { module, test } = qunit

module('integration > keyboard', function() {
	const dispatchEvents = {
		left: new KeyboardEvent('keyup', {
			key: 'ArrowLeft',
			bubbles: true
		}),
		right: new KeyboardEvent('keyup', {
			key: 'ArrowRight',
			bubbles: true
		})
	}
	test('keyboard navigation works', function(assert) {
	    const s = specificationFixture('circular')

		const element = render(s)
		const first = element.querySelector(testSelector('mark'))
		let current
		element.addEventListener('keyup', () => {
			current = element.querySelector('[data-highlight]')
		})

		const steps = [
			{ key: 'right', content: 'value: 8; group: A' },
			{ key: 'right', content: 'value: 4; group: B' },
			{ key: 'right', content: 'value: 2; group: C' },
			{ key: 'left', content: 'value: 4; group: B' },
			{ key: 'right', content: 'value: 2; group: C' }
		]

		for (let { key, content } of steps) {
			first.dispatchEvent(dispatchEvents[key])
			assert.equal(current.getAttribute('aria-label'), content)
		}
	})
})
