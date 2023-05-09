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
	}),
	up: new KeyboardEvent('keyup', {
		key: 'ArrowUp',
		bubbles: true
	}),
	down: new KeyboardEvent('keyup', {
		key: 'ArrowDown',
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
		if (content === null) {
			assert.equal(current, null)
		} else {
			assert.equal(current.getAttribute('aria-label'), content)
		}
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
		test('vertical arrows are disabled', function(assert) {
			const s = specificationFixture('circular')
			const steps = [
				{ key: 'up', content: null },
				{ key: 'down', content: null }
			]
			testNavigation(assert, s, steps)
		})
	})
	module('temporal bar', () => {
		test('horizontal arrows navigate adjacent bars', function(assert) {
			const s = specificationFixture('temporalBar')
			const steps = [
				{ key: 'right', content: 'value: 10; date: 2009; minimum value of value field' },
				{ key: 'right', content: 'value: 20; date: 2010' },
				{ key: 'right', content: 'value: 10; date: 2011; minimum value of value field' },
				{ key: 'left', content: 'value: 20; date: 2010' },
				{ key: 'right', content: 'value: 10; date: 2011; minimum value of value field' },
				{ key: 'right', content: 'value: 30; date: 2012' },
				{ key: 'right', content: 'value: 50; date: 2013; maximum value of value field' },
				{ key: 'right', content: 'value: 10; date: 2014; minimum value of value field' }
			]
			testNavigation(assert, s, steps)
		})
		test('vertical arrows are disabled', function(assert) {
			const s = specificationFixture('temporalBar')
			const steps = [
				{ key: 'up', content: null },
				{ key: 'down', content: null }
			]
			testNavigation(assert, s, steps)
		})
	})
})
