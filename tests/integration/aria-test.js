import qunit from 'qunit'
import { render, specificationFixture, testSelector } from '../test-helpers.js'

const { module, test } = qunit

module('integration > aria', function() {
	test('aria-label includes tooltip by default', assert => {
		const spec = specificationFixture('circular')

		spec.usermeta = { tooltipHandler: false }

		const element = render(spec)

		const marks = [...element.querySelectorAll(testSelector('mark'))]
		const labels = marks.map(mark => mark.getAttribute('aria-label'))
		const titles = marks.map(mark => mark.querySelector(testSelector('mark-title')))
		const match = labels.every((label, index) => label.includes(titles[index].textContent))

		assert.ok(match)
	})

	test('aria-label includes tooltip when tooltip channel is specified', assert => {
		const spec = specificationFixture('circular')

		spec.usermeta = { tooltipHandler: false }

		spec.mark.tooltip = true
		spec.encoding.tooltip = 'value'

		const element = render(spec)

		const marks = [...element.querySelectorAll(testSelector('mark'))]
		const labels = marks.map(mark => mark.getAttribute('aria-label'))
		const titles = marks.map(mark => mark.querySelector(testSelector('mark-title')).textContent)
		const match = labels.every((label, index) => label.includes(titles[index]))

		assert.ok(match)
	})

	test('aria-label can be set with description field', assert => {
		const spec = specificationFixture('circular')
		const element = render(spec);

		[...element.querySelectorAll(testSelector('mark'))].forEach(mark => {
			assert.ok(mark.getAttribute('aria-label'))
		})
	})

	test('aria-label can be set to a calculate transform field', assert => {
		const spec = specificationFixture('circular')

		spec.transform = [{ calculate: "'START:' + datum.value + ':END'", as: 'test' }]
		spec.encoding.description = { field: 'test' }

		const element = render(spec)

		assert.ok(element.querySelector(testSelector('mark')).getAttribute('aria-label').match(/^START.*END$/))
	})

	test('aria-label can diverge from tooltip', assert => {
		const spec = specificationFixture('circular')

		spec.usermeta = { tooltipHandler: false }

		spec.transform = [
			{ calculate: "'a'", as: 'a' },
			{ calculate: "'b'", as: 'b' }
		]
		spec.encoding.description = { field: 'a' }
		spec.encoding.tooltip = { field: 'b' }

		const element = render(spec)

		const marks = [...element.querySelectorAll(testSelector('mark'))]
		const labels = marks.map(mark => mark.getAttribute('aria-label'))
		const titles = marks.map(mark => mark.querySelector(testSelector('mark-title')).textContent)
		const match = labels.every((label, index) => label === titles[index])

		assert.notOk(match)
	})

	test('every bar chart mark has an aria-label attribute by default', assert => {
		const spec = specificationFixture('categoricalBar')
		const element = render(spec)
		element.querySelectorAll(testSelector('mark')).forEach(mark => {
			assert.ok(mark.getAttribute('aria-label'))
		})
	})

	test('every circular chart mark has an aria-label attribute by default', assert => {
		const spec = specificationFixture('circular')
		const element = render(spec)
		element.querySelectorAll(testSelector('mark')).forEach(mark => {
			assert.ok(mark.getAttribute('aria-label'))
		})
	})

	test('every line chart point mark has an aria-label attribute by default', assert => {
		const spec = specificationFixture('line')
		const element = render(spec)
		element.querySelectorAll(testSelector('mark')).forEach(mark => {
			assert.ok(mark.getAttribute('aria-label'))
		})
	})
})
