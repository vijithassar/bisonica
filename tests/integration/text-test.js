import qunit from 'qunit'
import { render, testSelector, specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('integration > text', function () {
	test('renders text marks', (assert) => {
		const spec = {
			$schema: 'https://vega.github.io/schema/vega-lite/v4.json',
			title: {
				text: 'text mark test'
			},
			data: {
				values: [{}]
			},
			mark: {
				type: 'text'
			},
			encoding: {
				text: {
					datum: 'A'
				}
			}
		}

		const element = render(spec)

		const markSelector = testSelector('mark')

		assert.equal(element.querySelectorAll(markSelector).length, 1)
		assert.equal(element.querySelector(markSelector).tagName, 'text')
	})

	test('renders text marks with dynamic attributes', (assert) => {
		const spec = specificationFixture('scatterPlot')

		spec.mark = { type: 'text' }
		spec.encoding.color = { field: 'section', type: 'nominal' }
		spec.encoding.text = { field: 'section', type: 'nominal' }

		const element = render(spec)

		const marks = [...element.querySelectorAll(testSelector('mark'))]

		const sections = [...new Set(spec.data.values.map((item) => item.section)).values()]

		sections.forEach((section) => {
			const matchingValues = spec.data.values.filter((item) => item.section === section)
			const matchingContent = marks.filter((mark) => mark.textContent === section)

			assert.equal(
				matchingValues.length,
				matchingContent.length,
				`data category ${section} has ${matchingValues.length} values and ${matchingContent.length} mark nodes`
			)
		})

		assert.ok(
			marks.every((mark) => mark.hasAttribute('x')),
			'every mark has x position'
		)
		assert.ok(
			marks.every((mark) => mark.hasAttribute('y')),
			'every mark has y position'
		)
		assert.ok(
			marks.every((mark) => mark.hasAttribute('fill')),
			'every mark has color'
		)
	})
})
