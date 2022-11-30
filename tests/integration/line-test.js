import qunit from 'qunit'
import { render, specificationFixture } from '../test-helpers.js'
import { testSelector } from '../test-helpers.js'

const { module, test } = qunit

const pointSelector = testSelector('marks-mark-point')

module('integration > line', function () {
  test('renders a line chart', (assert) => {
    const spec = specificationFixture('line')
    const element = render(spec)

    const selector = testSelector('mark')

    assert.ok(element.querySelector(selector))
    assert.ok(element.querySelector(selector).getAttribute('d'))

    const pathStrings = [...element.querySelectorAll(selector)].map((node) =>
      node.getAttribute('d')
    )

    pathStrings.forEach((pathString) => {
      assert.ok(pathString.length > 0, 'path string is not empty')
      assert.equal((pathString.match(/NaN/g) || []).length, 0, 'path string does not contain NaN')
    })
  })

  test('renders a line chart with points', (assert) => {
    const spec = specificationFixture('line')
    const element = render(spec)
    assert.ok(element.querySelector(pointSelector))
  })

  test('renders a line chart without points', (assert) => {
    const spec = specificationFixture('line')

    delete spec.mark.point
    const element = render(spec)
    assert.notOk(element.querySelector(pointSelector))
  })

  test('renders a line chart with arbitrary field names', (assert) => {
    const spec = specificationFixture('line')
    const propertyMap = {
      label: '_',
      group: '*',
      value: '•'
    }

    spec.data.values = spec.data.values.map((item) => {
      Object.entries(propertyMap).forEach(([a, b]) => {
        item[b] = item[a]
        delete item[a]
      })

      return { ...item }
    })
    Object.entries(spec.encoding).forEach(([, definition]) => {
      const old = definition.field

      definition.field = propertyMap[old]
    })
    const element = render(spec)
    assert.ok(element.querySelector(pointSelector))
  })
})
