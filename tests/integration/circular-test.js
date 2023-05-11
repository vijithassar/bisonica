import qunit from 'qunit'
import { render, testSelector, specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('integration > circular', function() {
	test('renders a circular chart', assert => {
		const s = specificationFixture('circular')
		const element = render(s)
		const marks = [...element.querySelectorAll(testSelector('mark'))]
		assert.equal(marks.length, s.data.values.length)
		assert.ok(marks.every(item => item.tagName === 'path'))
		assert.equal(new Set(marks.map(item => item.style.fill)).size, s.data.values.length)
	})

	test('renders a circular chart with arbitrary field names', assert => {
		const s = specificationFixture('circular')
		const keys = {
			group: '•',
			label: '-',
			value: '+'
		}
		s.data.values = s.data.values.map(item => {
			Object.entries(keys).forEach(([original, altered]) => {
				item[altered] = item[original]
				delete item[original]
			})
			return item
		})
		Object.entries(s.encoding).forEach(([channel, definition]) => {
			const original = definition.field
			const altered = keys[original]
			s.encoding[channel].field = altered
		})

		const element = render(s)

		const marks = [...element.querySelectorAll(testSelector('mark'))]
		assert.equal(marks.length, s.data.values.length)
		assert.ok(marks.every(item => item.tagName === 'path'))
		assert.equal(new Set(marks.map(item => item.style.fill)).size, s.data.values.length)
	})
})
