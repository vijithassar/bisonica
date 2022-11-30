import qunit from 'qunit'
import { render, testSelector } from '../test-helpers.js'
import { specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('integration > rules', function () {
  test('renders rules', (assert) => {
    const spec = specificationFixture('rules')
    const element = render(spec)

    const markSelector = testSelector('mark')
    const axisSelectors = {
      y: testSelector('axes-y'),
      x: testSelector('axes-x')
    }
    const mark = [...element.querySelectorAll(markSelector)]

    assert.ok(element.querySelector(axisSelectors.y))
    assert.notOk(element.querySelector(axisSelectors.x))
    assert.ok(element.querySelector(markSelector))
    assert.equal(element.querySelector(markSelector).tagName, 'line')

    mark.forEach((item) => {
      assert.equal(
        item.getAttribute('y1'),
        item.getAttribute('y2'),
        'rule y attributes are the same'
      )
      assert.notEqual(
        item.getAttribute('x1'),
        item.getAttribute('x2'),
        'rule x attributes are not the same'
      )
    })
  })
})
