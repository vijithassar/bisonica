import * as d3 from 'd3'
import { encodingField } from '../../source/encodings.js'
import {
  render,
  marksWithUrls,
  specificationFixture,
  testSelector
} from '../test-helpers.js'
import qunit from 'qunit'

const { module, test } = qunit

module('integration > pivot urls', function () {

  const getUrl = (item) => d3.select(item).datum().url

  test('stacked bar chart pivot links', (assert) => {
    const spec = specificationFixture('stackedBar')

    spec.encoding.href = { field: 'url' }
    spec.data.values[0].url = 'https://www.example.com/a'
    spec.data.values[1].url = 'https://www.example.com/b'

    const element = render(spec)
    assert.equal(marksWithUrls(element).length, 2)

    const urls = marksWithUrls(element).map(getUrl)

    assert.notEqual(urls[0], urls[1])
  })

  test('categorical bar chart pivot links', (assert) => {
    const spec = specificationFixture('categoricalBar')

    spec.encoding.href = { field: 'url' }
    spec.data.values[0].url = 'https://www.example.com/a'
    spec.data.values[1].url = 'https://www.example.com/b'

    const element = render(spec)
    assert.equal(marksWithUrls(element).length, 2)

    const urls = marksWithUrls(element).map(getUrl)

    assert.notEqual(urls[0], urls[1])
  })

  test('line chart pivot links', (assert) => {
    const spec = specificationFixture('line')

    spec.encoding.href = { field: 'url' }
    spec.data.values[0].url = 'https://www.example.com/a'
    spec.data.values[1].url = 'https://www.example.com/b'

    const element = render(spec)

    // in this case because of the nested series we need to
    // bypass the marksWithUrls() helper in order to flatten the array
    // and likewise bypass the getUrl() helper since the mark datum has
    // already been retrieved during that flat map
    const data = [...element
      .querySelectorAll(testSelector('mark'))]
      .map((mark) => d3.select(mark).datum().values)
      .flat()

    const marksWithUrls = data.filter((item) => item.url)

    assert.equal(marksWithUrls.length, 2)

    const urls = marksWithUrls.map((item) => item.url)

    assert.notEqual(urls[0], urls[1])
  })

  test('circular chart pivot links', (assert) => {
    const spec = specificationFixture('circular')

    spec.data.values = [
      { group: 'a', value: 1, url: 'https://www.example.com/a' },
      { group: 'a', value: 2, url: 'https://www.example.com/a' },
      { group: 'b', value: 3, url: 'https://www.example.com/b' },
      { group: 'b', value: 4, url: 'https://www.example.com/b' },
      { group: 'c', value: 5, url: 'https://www.example.com/c' },
      { group: 'c', value: 6, url: 'https://www.example.com/c' },
    ]

    spec.encoding.href = { field: 'url' }

    const element = render(spec)

    const getUrl = (mark) => d3.select(mark).datum().data[encodingField(spec, 'href')]
    const marks = [...element.querySelectorAll(testSelector('mark'))]
    const links = marks.filter(getUrl).map(getUrl)

    assert.equal(links.length, 3)
    assert.notEqual(links[0], links[1])
    assert.notEqual(links[1], links[2])
    assert.notEqual(links[0], links[2])
  })
})
