import qunit from 'qunit'
import { render, testSelector, specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('integration > menu', function() {
	test('renders a menu', assert => {
		const element = render(specificationFixture('circular'))
		assert.ok(element.querySelector(testSelector('menu-item')))
	})
})
