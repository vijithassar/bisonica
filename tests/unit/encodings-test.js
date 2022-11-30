import {
  createEncoders,
  encodingField,
  encodingChannelCovariate,
  encodingChannelQuantitative,
  encodingType,
  encodingValue
} from '../../source/encodings.js'
import { data } from '../../source/data.js'
import { dimensions } from './support.js'
import qunit from 'qunit'
import { parseTime } from '../../source/time.js'
import { specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('unit > encoders', () => {
  test('creates encoders', (assert) => {
    const accessors = {
      x: (d) => parseTime(d.label),
      y: (d) => d.value,
      color: (d) => d.group
    }
    const specification = specificationFixture('line')
    const encoders = createEncoders(specification, dimensions, accessors)
    const dataPoint = specification.data.values[0]

    assert.equal(typeof encoders, 'object', 'encoders are methods on an object')
    Object.entries(encoders).forEach(([name, encoder]) => {
      assert.equal(typeof encoder, 'function', `${name} encoder is a function`)
    })
    assert.equal(
      typeof encoders.x(dataPoint),
      'number',
      'x encoder function returns a numerical value'
    )
    assert.equal(
      typeof encoders.y(dataPoint),
      'number',
      'y encoder function returns a numerical value'
    )
    assert.equal(
      typeof encoders.color(dataPoint),
      'string',
      'color encoder function returns a string'
    )
  })

  test('identifies encoding field names', (assert) => {
    const s = { encoding: { x: { field: 'a' }, y: { field: 'b' } } }

    assert.equal(encodingField(s, 'x'), 'a')
    assert.equal(encodingField(s, 'y'), 'b')
  })

  test('accesses nested fields with encoding value lookup', (assert) => {
    const datum = {
      a: {
        b: 2
      }
    }
    const s = {
      data: {
        values: [
          datum
        ]
      },
      mark: {
        type: 'point'
      },
      encoding: {
        x: {
          type: 'quantitative',
          field: 'a.b'
        }
      }
    }
    assert.equal(encodingField(s, 'x'), 'a.b', 'looks up nested field as a string')
    assert.equal(encodingValue(s, 'x')(datum), 2, 'looks up value based on nested field')

  })

  test('accesses nested fields with data preprocessing for circular charts', (assert) => {
    const nest = (datum) => {
      datum.a = {
        b: {
          c: datum.value
        }
      }
      delete datum.value
      return datum
    }
    const flat = data(specificationFixture('circular'))
    const s = specificationFixture('circular')
    s.data.values = s.data.values.map(nest)
    s.encoding.theta.field = 'a.b.c'
    const nested = data(s)
    assert.deepEqual(flat, nested)
  })

  test('accesses nested fields with data preprocessing for bar charts', (assert) => {
    const nest = (datum) => {
      datum.a = {
        b: {
          c: datum.value
        }
      }
      delete datum.value
      return datum
    }
    const flat = data(specificationFixture('categoricalBar'))
    const s = specificationFixture('categoricalBar')
    s.data.values = s.data.values.map(nest)
    s.encoding.y.field = 'a.b.c'
    const nested = data(s)
    assert.deepEqual(flat, nested)
  })

  test('accesses nested fields with data preprocessing for multidimensional charts', (assert) => {
    const nest = (datum) => {
      datum.a = {
        b: {
          c: datum.value
        }
      }
      delete datum.value
      return datum
    }
    const flat = data(specificationFixture('line'))
    const s = specificationFixture('line')
    s.data.values = s.data.values.map(nest)
    s.encoding.y.field = 'a.b.c'
    const nested = data(s)
    assert.deepEqual(flat, nested)
  })

  test('identifies covariate encoding channels', (assert) => {
    const ordinal = { encoding: { x: { type: 'ordinal' }, y: { type: 'quantitative' } } }
    const nominal = { encoding: { x: { type: 'nominal' }, y: { type: 'quantitative' } } }
    const temporal = { encoding: { x: { type: 'temporal' }, y: { type: 'quantitative' } } }
    const doubleNominal = { encoding: { x: { type: 'nominal' }, y: { type: 'nominal' } } }
    const doubleQuantitative = {
      encoding: { x: { type: 'quantitative' }, y: { type: 'quantitative' } }
    }

    assert.equal(encodingChannelCovariate(ordinal), 'x')
    assert.equal(encodingChannelCovariate(nominal), 'x')
    assert.equal(encodingChannelCovariate(temporal), 'x')
    assert.throws(() => encodingChannelCovariate(doubleNominal))
    assert.throws(() => encodingChannelCovariate(doubleQuantitative))    
  })

  test('identifies quantitative encoding channels', (assert) => {
    const s = { encoding: { x: { type: 'nominal' }, y: { type: 'quantitative' } } }

    assert.equal(encodingChannelQuantitative(s), 'y')
  })

  test('detects encoding types', (assert) => {
    const s = { encoding: { x: { type: 'nominal' } } }

    assert.ok(encodingType(s, 'x'), 'nominal')
  })

  test('generates simple value accessor functions', (assert) => {
    const s = { encoding: { x: { field: 'a' } } }
    const target = { a: 1 }
    const getValue = encodingValue(s, 'x')

    assert.ok(getValue(target), 1)
  })
})
