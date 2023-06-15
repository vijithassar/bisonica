import qunit from 'qunit'
import { render, testSelector, specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('integration > menu', function() {
	test('renders a menu', assert => {
		const element = render(specificationFixture('circular'))
		assert.ok(element.querySelector(testSelector('menu-item')))
	})
	test('adds custom menu items', assert => {
		const items = [
			{ text: 'WCAG', href: 'https://www.w3.org/WAI/standards-guidelines/wcag/' },
			{ text: 'Vega Lite', href: 'https://vega.github.io/vega-lite/' }
		]
		const s = specificationFixture('circular')
		s.usermeta = {}
		s.usermeta.menu = { items }
		const element = render(s)
		const labels = [...element.querySelectorAll(testSelector('menu-item'))].map(node => node.textContent)
		items
			.map(item => item.text)
			.forEach(text => {
				assert.ok(labels.includes(text))
			})
	})
})
