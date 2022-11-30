import {
  render,
  specificationFixture,
  testSelector,
  tooltipContentUpdate
} from '../test-helpers.js'
import { chart } from '../../source/chart.js'
import qunit from 'qunit'

const { module, test } = qunit

module('integration > tooltips', function () {

  test('renders a chart with SVG title tooltips', (assert) => {
    const spec = specificationFixture('line')
    spec.usermeta = { tooltipHandler: false }

    const element = render(spec)

    assert.ok(element.querySelectorAll(testSelector('mark-title').length > 0), 'mark nodes contain title nodes')
  })

  test('renders a chart without SVG title tooltips', (assert) => {
    const spec = specificationFixture('line')

    spec.usermeta = { tooltipHandler: false }

    delete spec.mark.tooltip
    const element = render(spec)

    assert.equal(element.querySelectorAll(testSelector('mark-title')).length, 0, 'mark nodes do not contain title nodes')
  })

  test('disables SVG title tooltips when a custom tooltip handler is indicated', (assert) => {
    const spec = specificationFixture('line')

    spec.usermeta = { tooltipHandler: true }

    const element = render(spec)

    assert.equal(element.querySelectorAll(testSelector('mark-title')).length, 0, 'mark nodes do not contain title nodes')
  })

  test.skip('disables tooltips from the encoding hash', (assert) => {
    const spec = specificationFixture('line')

    spec.encoding.tooltip = null
    const element = render(spec); // eslint-disable-line

    assert.dom(testSelector('mark-title')).doesNotExist()
  })

  test('renders a chart with encoding values in the SVG title tooltip', (assert) => {
    const spec = specificationFixture('circular')

    spec.usermeta = { tooltipHandler: false }

    const element = render(spec)

    Object.entries(spec.encoding).forEach(([channel, definition]) => {
      const field = definition.field || definition.aggregate
      const title = element.querySelector(testSelector('mark-title'))
      const prefix = `${field}:`
      const undefinedText = `${field}: undefined`
      assert.ok(title.textContent.includes(prefix), `${field} field for ${channel} encoding is included in tooltip content`)
      assert.ok(!title.textContent.includes(undefinedText), `value of ${field} field for ${channel} encoding is undefined`)
    })
  })

  test('renders a stacked bar chart with SVG title tooltips', (assert) => {
    const spec = specificationFixture('stackedBar')

    spec.usermeta = { tooltipHandler: false }

    const element = render(spec)

    assert.ok(element.querySelector(testSelector('mark-title')))
    assert.ok(element.querySelector(testSelector('mark-title')).textContent.length)
    assert.ok(!element.querySelector(testSelector('mark-title')).textContent.includes('undefined'))

  })

  test('renders a circular chart with SVG title tooltips', (assert) => {
    const spec = specificationFixture('circular')

    spec.usermeta = { tooltipHandler: false }

    const element = render(spec)

    assert.ok(element.querySelector(testSelector('mark-title')))
    assert.ok(element.querySelector(testSelector('mark-title')).textContent.length)
    assert.ok(!element.querySelector(testSelector('mark-title')).textContent.includes('undefined'))
  })

  test('renders a line chart with SVG title tooltips', (assert) => {
    const spec = specificationFixture('line')

    spec.usermeta = { tooltipHandler: false }

    const element = render(spec)

    assert.ok(element.querySelector(testSelector('point-title')))
    assert.ok(element.querySelector(testSelector('point-title')).textContent.length)
    assert.ok(!element.querySelector(testSelector('point-title')).textContent.includes('undefined'))
  })

  test('follows tooltip rendering instructions in charts with nested layers', (assert) => {
    const graphic = specificationFixture('circular')

    graphic.mark.innerRadius = 50

    const text = {
      mark: { type: 'text', text: 'test' }
    }
    const spec = {
      title: { text: 'layer tooltip rendering test' },
      layer: [graphic, text],
      usermeta: {}
    }

    spec.usermeta = { tooltipHandler: true }

    const element = render(spec)

    assert.ok(element.querySelector(testSelector('mark')))
    assert.notOk(element.querySelector(testSelector('mark-title')))
  })

  test('emits a CustomEvent with tooltip details in response to mouseover', (assert) => {
    const element = render(specificationFixture('circular'))

    const event = new MouseEvent('mouseover', { bubbles: true })
    let tooltipEvent = null

    element.querySelector('.chart').addEventListener('tooltip', (event) => {
      tooltipEvent = event
    })

    element.querySelectorAll(testSelector('mark'))[0].dispatchEvent(event)

    assert.equal(typeof tooltipEvent.detail.datum, 'object', 'custom event detail has datum')
    assert.equal(typeof tooltipEvent.detail.content, 'object', 'custom event detail has content')
    assert.equal(tooltipEvent.detail.content.length, 2, 'custom event detail has two fields')
    assert.equal(
      typeof tooltipEvent.detail.interaction.bubbles,
      'boolean',
      'custom event detail has original interaction event'
    )
    assert.equal(
      typeof tooltipEvent.detail.node.querySelector,
      'function',
      'custom event detail has node'
    )
  })

  test('emits a CustomEvent with tooltip details in response to mouseover on layered charts', (assert) => {
    const s = {
      "title": {
        "text": "donut chart with layered event interactions"
      },
      "data": {
        "values": [
          {
            "value": 10,
            "group": "a",
            "url": "https://www.example.com/a/"
          },
          {
            "value": 20,
            "group": "b",
            "url": "https://www.example.com/b/"
          },
          {
            "value": 30,
            "group": "c",
            "url": "https://www.example.com/c/"
          }
        ]
      },
      "usermeta": { "tooltipHandler": true },
      "layer": [
        {
          "mark": {
            "type": "arc",
            "innerRadius": 50,
            "tooltip": true
          },
          "encoding": {
            "href": {
              "field": "url",
              "type": "nominal"
            },
            "color": {
              "field": "group",
              "type": "nominal"
            },
            "theta": {
              "field": "value",
              "type": "quantitative"
            }
          }
        },
        {
          "data": {
            "values": [
              {
                "a": "https://www.google.com",
                "b": "9999"
              }
            ]
          },
          "mark": {
            "type": "text",
            "tooltip": true
          },
          "encoding": {
            "href": {
              "field": "a"
            },
            "text": {
              "field": "b"
            },
            "tooltip": {
              "field": "href",
              "type": "nominal"
            }
          }
        }
      ]
    }

    const element = render(s)

    const event = new MouseEvent('mouseover', { bubbles: true })
    let tooltipEvent = null

    element.querySelector('.chart').addEventListener('tooltip', (event) => {
      tooltipEvent = event
    })

    element.querySelectorAll(testSelector('mark'))[0].dispatchEvent(event)

    assert.equal(typeof tooltipEvent.detail.datum, 'object', 'custom event detail has datum')
    assert.equal(typeof tooltipEvent.detail.content, 'object', 'custom event detail has content')
    assert.equal(tooltipEvent.detail.content.length, 2, 'custom event detail has two fields')
    assert.equal(
      typeof tooltipEvent.detail.interaction.bubbles,
      'boolean',
      'custom event detail has original interaction event'
    )
    assert.equal(
      typeof tooltipEvent.detail.node.querySelector,
      'function',
      'custom event detail has node'
    )
  })

  test('custom tooltip handler function', (assert) => {
    const fn = () => null
    const renderer = chart(specificationFixture('circular'))
    renderer.tooltip(fn)
    assert.equal(renderer.tooltip(), fn, 'attaches custom tooltip handler functions')
    assert.throws(() => renderer.tooltip(null), 'rejects invalid tooltip handler functions')
  })

  test.skip('displays a custom tooltip', async function (assert) {
    const spec = specificationFixture('circular'); // eslint-disable-line

    await render(`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
      <div data-falcon-portal="tooltip"></div>
    `)

    const event = new MouseEvent('mouseover', { bubbles: true })

    this.page.mark()[0].dispatchEvent(event)

    let tooltipContent = await tooltipContentUpdate(this.element)

    assert.ok(tooltipContent.includes('group'), 'tooltip content includes key "group"')
    assert.ok(
      tooltipContent.includes('A'),
      'tooltip content includes value "A"'
    )
    assert.ok(tooltipContent.includes('value'), 'tooltip content includes key "label"')
    assert.ok(tooltipContent.includes('167'), 'tooltip content includes value "167"')
  })
})
