import {
	render,
	specificationFixture,
	testSelector
} from '../test-helpers.js'
import qunit from 'qunit'

const { module, test } = qunit

const directions = ['up', 'right', 'down', 'left']
const arrows = {}
directions.forEach(direction => {
	const options = {
		key: `Arrow${direction.slice(0, 1).toUpperCase()}${direction.slice(1)}`,
		bubbles: true
	}
	arrows[direction] = new KeyboardEvent('keyup', options)
})

const testNavigation = (assert, s, steps) => {
	const element = render(s)
	const highlight = () => element.querySelector('[data-highlight]')
	const aria = () => highlight()?.getAttribute('aria-label')
	let current = element.querySelector(testSelector('mark'))
	element.addEventListener('keyup', () => {
		current = highlight()
	})
	for (let [index, { key, content }] of Object.entries(steps)) {
		if (current) {
			current.dispatchEvent(arrows[key])
		}
		if (content !== undefined) {
			if (content === null) {
				assert.equal(current, null, `step ${index} does not highlight a mark`)
			} else {
				assert.ok(aria().includes(content), `step ${index} highlights mark with aria-label attribute "${aria()}" including expected text "${content}"`)
			}
		}
	}
}

module('integration > keyboard', function() {
	module('circular', () => {
		const s = specificationFixture('circular')
		test('horizontal arrows navigate adjacent segments', function(assert) {
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
			const steps = [
				{ key: 'up', content: null },
				{ key: 'down', content: null }
			]
			testNavigation(assert, s, steps)
		})
		test('keyboard navigation loops', function(assert) {
			const steps = [
				{ key: 'right', content: 'group: A' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right', content: 'group: H' },
				{ key: 'right', content: 'group: A' },
				{ key: 'left', content: 'group: H' }
			]
			testNavigation(assert, s, steps)
		})
	})
	module('temporal bar', () => {
		const s = specificationFixture('temporalBar')
		test.skip('horizontal arrows navigate adjacent bars', function(assert) {
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
			const steps = [
				{ key: 'up', content: null },
				{ key: 'down', content: null }
			]
			testNavigation(assert, s, steps)
		})
		test.skip('keyboard navigation loops', function(assert) {
			const steps = [
				{ key: 'right', content: 'date: 2009' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right', content: 'date: 2014' },
				{ key: 'right', content: 'date: 2009' },
				{ key: 'left', content: 'date: 2014' }
			]
			testNavigation(assert, s, steps)
		})
	})
	module('categorical bar', () => {
		const s = specificationFixture('categoricalBar')
		test('horizontal arrows navigate adjacent bars', function(assert) {
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
			const steps = [
				{ key: 'up', content: null },
				{ key: 'down', content: null }
			]
			testNavigation(assert, s, steps)
		})
		test('keyboard navigation loops', function(assert) {
			const steps = [
				{ key: 'right', content: 'animal: rabbit' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right', content: 'animal: mouse' },
				{ key: 'right', content: 'animal: rabbit' },
				{ key: 'left', content: 'animal: mouse' }
			]
			testNavigation(assert, s, steps)
		})
	})
	module('stacked bar', () => {
		const s = specificationFixture('stackedBar')
		test.skip('horizontal arrows navigate covariate encoding', function(assert) {
			const steps = [
				{ key: 'right', content: 'label: 05-19' },
				{ key: 'right', content: 'label: 05-20' },
				{ key: 'left', content: 'label: 05-19' },
				{ key: 'right', content: 'label: 05-20' }
			]
			testNavigation(assert, s, steps)
		})
		test.skip('horizontal arrows loop through covariate encoding', function(assert) {
			const steps = [
				{ key: 'right', content: 'label: 05-19' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right' },
				{ key: 'right', content: 'label: 06-15' },
				{ key: 'right', content: 'label: 05-19' },
				{ key: 'left', content: 'label: 06-15' }
			]
			testNavigation(assert, s, steps)
		})
		test('vertical arrows navigate series', function(assert) {
			const steps = [
				{ key: 'up', content: 'group: A' },
				{ key: 'up', content: 'group: B' },
				{ key: 'down', content: 'group: A' },
				{ key: 'up', content: 'group: B' }
			]
			testNavigation(assert, s, steps)
		})
		test('vertical arrows loop through series', function(assert) {
			const steps = [
				{ key: 'up', content: 'group: A' },
				{ key: 'up' },
				{ key: 'up' },
				{ key: 'up' },
				{ key: 'up' },
				{ key: 'up' },
				{ key: 'up' },
				{ key: 'up' },
				{ key: 'up' },
				{ key: 'up', content: 'group: J' },
				{ key: 'up', content: 'group: A' }
			]
			testNavigation(assert, s, steps)
		})
		test.skip('missing marks are skipped', function(assert) {
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
