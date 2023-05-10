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
	test.skip('renders a donut chart', assert => {
		const donutChartSpec = {
			...specificationFixture('circular'),
			mark: { type: 'arc', innerRadius: 50 },
			data: {
				// must have at least five segments to avoid
				// bounds overlapping the center of the chart
				values: [
					{ group: 'a', value: 1 },
					{ group: 'b', value: 1 },
					{ group: 'c', value: 1 },
					{ group: 'd', value: 1 },
					{ group: 'e', value: 1 }
				]
			}
		}

		const element = render(donutChartSpec)

		const marksSelector = testSelector('marks')
		const markSelector = testSelector('mark')

		assert.ok(element.querySelector(markSelector))
		assert.equal(element.querySelector(markSelector).tagName, 'path')

		const marks = element.querySelector(marksSelector)

		assert.ok(isDonut(marks))
	})
})
