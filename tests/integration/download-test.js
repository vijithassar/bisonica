import qunit from 'qunit'
import { testSelector, specificationFixture, render } from '../test-helpers.js'

const { module, test } = qunit

module('unit > download', () => {
	test('renders download links', assert => {
		const element = render(specificationFixture('circular'))
		const items = [...element.querySelectorAll(testSelector('menu-item'))]
		const text = items.map(node => node.textContent)
		assert.ok(text.includes('csv'))
		assert.ok(text.includes('json'))
	})
	test('disables download links individually', assert => {
		const s = specificationFixture('circular')
		s.usermeta = {}
		s.usermeta.download = { csv: false }
		const element = render(s)
		const items = [...element.querySelectorAll(testSelector('menu-item'))]
		const text = items.map(node => node.textContent)
		assert.notOk(text.includes('csv'))
		assert.ok(text.includes('json'))
	})
	test('disables all download links', assert => {
		const s = specificationFixture('circular')
		s.usermeta = {}
		s.usermeta.download = null
		const element = render(s)
		const items = [...element.querySelectorAll(testSelector('menu-item'))]
		const text = items.map(node => node.textContent)
		assert.notOk(text.includes('csv'))
		assert.notOk(text.includes('json'))
	})
})
