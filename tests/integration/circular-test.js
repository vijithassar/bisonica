import qunit from 'qunit'
import { render, testSelector, specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('integration > circular', function() {
	test('renders a circular chart', assert => {
		const spec = specificationFixture('circular')

		const element = render(spec)

		const markSelector = testSelector('mark')

		assert.ok(element.querySelector(markSelector))
		assert.equal(element.querySelector(markSelector).tagName, 'path')

		const marks = element.querySelector(testSelector('marks'))

		assert.ok(isCircular(marks), 'marks group has approximately equal height and width')

		const mark = [...marks.querySelectorAll(markSelector)]
		const colors = new Set(mark.map(item => item.style.fill))

		assert.ok(mark.length === colors.size, 'every segment is a different color')
	})

	test('renders a circular chart with arbitrary field names', assert => {
		const spec = specificationFixture('circular')
		const keys = {
			group: '•',
			label: '-',
			value: '+'
		}
		spec.data.values = spec.data.values.map(item => {
			Object.entries(keys).forEach(([original, altered]) => {
				item[altered] = item[original]
				delete item[original]
			})
			return item
		})
		Object.entries(spec.encoding).forEach(([channel, definition]) => {
			const original = definition.field
			const altered = keys[original]
			spec.encoding[channel].field = altered
		})

		const element = render(spec)

		const markSelector = testSelector('mark')

		assert.ok(element.querySelector(markSelector))
		assert.equal(element.querySelector(markSelector).tagName, 'path')

		const marks = element.querySelector(testSelector('marks'))

		assert.ok(isCircular(marks), 'marks group has approximately equal height and width')

		const mark = [...marks.querySelectorAll(markSelector)]
		const colors = new Set(mark.map(item => item.style.fill))

		assert.ok(mark.length === colors.size, 'every segment is a different color')
	})

	test('renders a pie chart', assert => {
		const spec = specificationFixture('circular')

		spec.mark = 'arc'

		const element = render(spec)

		const mark = testSelector('mark')

		assert.ok(element.querySelector(mark))
		assert.equal(element.querySelector(mark).tagName, 'path')

		const marks = element.querySelector(testSelector('marks'))

		assert.ok(isPie(marks))
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
