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
	for (let [index, { key, content }] of Object.entries(steps)) {
		first.dispatchEvent(dispatchEvents[key])
		if (content !== undefined) {
			if (content === null) {
				assert.equal(current, null, `step ${index} does not highlight a mark`)
			} else {
				const aria = current.getAttribute('aria-label')
				assert.ok(aria.includes(content), `step ${index} highlights mark with aria-label attribute "${aria}" including expected text "${content}"`)
			}
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
				{ key: 'right', content: 'value: 10; date: 2009' },
				{ key: 'right', content: 'value: 20; date: 2010' },
				{ key: 'right', content: 'value: 10; date: 2011' },
				{ key: 'left', content: 'value: 20; date: 2010' },
				{ key: 'right', content: 'value: 10; date: 2011' },
				{ key: 'right', content: 'value: 30; date: 2012' },
				{ key: 'right', content: 'value: 50; date: 2013' },
				{ key: 'right', content: 'value: 10; date: 2014' }
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
	module('categorical bar', () => {
		test('horizontal arrows navigate adjacent bars', function(assert) {
			const s = specificationFixture('categoricalBar')
			const steps = [
				{ key: 'right', content: 'animal: rabbit; value: 31' },
				{ key: 'right', content: 'animal: cow; value: 25' },
				{ key: 'right', content: 'animal: snake; value: 25' },
				{ key: 'left', content: 'animal: cow; value: 25' },
				{ key: 'right', content: 'animal: snake; value: 25' },
				{ key: 'right', content: 'animal: elephant; value: 25' },
				{ key: 'left', content: 'animal: snake; value: 25' },
				{ key: 'right', content: 'animal: elephant; value: 25' }
			]
			testNavigation(assert, s, steps)
		})
		test('vertical arrows are disabled', function(assert) {
			const s = specificationFixture('categoricalBar')
			const steps = [
				{ key: 'up', content: null },
				{ key: 'down', content: null }
			]
			testNavigation(assert, s, steps)
		})
	})
	module('stacked bar', () => {
		test('horizontal arrows navigate covariate encoding', function(assert) {
			const s = specificationFixture('stackedBar')
			const steps = [
				{ key: 'right', content: 'label: 05-19' },
				{ key: 'right', content: 'label: 05-20' },
				{ key: 'left', content: 'label: 05-19' },
				{ key: 'right', content: 'label: 05-20' }
			]
			testNavigation(assert, s, steps)
		})
		test('vertical arrows navigate series', function(assert) {
			const s = specificationFixture('stackedBar')
			const steps = [
				{ key: 'up', content: 'group: A' },
				{ key: 'up', content: 'group: B' },
				{ key: 'down', content: 'group: A' },
				{ key: 'up', content: 'group: B' }
			]
			testNavigation(assert, s, steps)
		})
		test('missing marks are skipped', function(assert) {
			const s = specificationFixture('stackedBar')
			const steps = [
				{ key: 'right', content: 'label: 05-19' },
				{ key: 'right', content: 'label: 05-20' },
				{ key: 'right', content: 'label: 05-22' },
				{ key: 'right', content: 'label: 05-23' }
			]
			testNavigation(assert, s, steps)
		})
	})
})
