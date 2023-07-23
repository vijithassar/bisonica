import qunit from 'qunit'
import { render, specificationFixture, testSelector } from '../test-helpers.js'

const { module, test } = qunit

module('integration > table', function() {
	const selector = `${testSelector('menu-item')}[data-menu="table"] button`
	const event = () => new MouseEvent('click')
	test('renders a chart with a table item in the menu', assert => {
		const element = render(specificationFixture('circular'))
		assert.ok(element.querySelector(selector))
	})
	test('disables table item in the menu', assert => {
		const spec = specificationFixture('circular')
		spec.usermeta = { table: null }
		const element = render(spec)
		assert.notOk(element.querySelector(selector))
	})
	test('menu item toggles between table and graphic when clicked', assert => {
		const element = render(specificationFixture('circular'))
		const toggle = element.querySelector(selector)
		assert.equal(toggle.textContent, 'table')
		toggle.dispatchEvent(event())
		assert.equal(toggle.textContent, 'graphic')
		toggle.dispatchEvent(event())
		assert.equal(toggle.textContent, 'table')
	})
	test('content toggles between table and graphic when clicked', assert => {
		const element = render(specificationFixture('circular'))
		const table = element.querySelector('.table')
		const toggle = element.querySelector(selector)
		assert.notOk(table.querySelector('tr'), 'table view is inactive')
		toggle.dispatchEvent(event())
		assert.equal(table.querySelectorAll('tr').length, 9, 'table view is active')
		toggle.dispatchEvent(event())
		assert.notOk(table.querySelector('tr'), 'table view is inactive')
	})
	test('renders urls as links', assert => {
		const s = specificationFixture('circular')
		const count = s.data.values.length
		s.data.values = s.data.values.map((item, index) => {
			return { ...item, url: `https://example.com/${index}` }
		})
		s.encoding.href = { field: 'url' }
		const element = render(s)
		const toggle = element.querySelector(selector)
		const table = element.querySelector('.table')
		toggle.dispatchEvent(event())
		assert.equal(table.querySelectorAll('td a').length, count, `${count} links in table`)
	})
})
