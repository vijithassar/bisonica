import {
	render,
	specificationFixture,
	testSelector
} from '../test-helpers.js'
import qunit from 'qunit'

const { module, test } = qunit

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

const testNavigation = (assert, s, steps) => {
	const element = render(s)
	const first = element.querySelector(testSelector('mark'))
	let current
	element.addEventListener('keyup', () => {
		current = element.querySelector('[data-highlight]')
	})
	for (let { key, content } of steps) {
		first.dispatchEvent(dispatchEvents[key])
		assert.equal(current.getAttribute('aria-label'), content)
	}
}

module('integration > keyboard', function() {
	module('circular', () => {
		test('horizontal arrows navigate adjacent segments', function(assert) {
			const s = specificationFixture('circular')
			const steps = [
				{ key: 'right', content: 'value: 8; group: A' },
				{ key: 'right', content: 'value: 4; group: B' },
				{ key: 'right', content: 'value: 2; group: C' },
				{ key: 'left', content: 'value: 4; group: B' },
				{ key: 'right', content: 'value: 2; group: C' }
			]
			testNavigation(assert, s, steps)
		})
	})
})
