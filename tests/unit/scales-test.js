import { dimensions } from './support.js'
import qunit from 'qunit'
import { parseScales } from '../../source/scales.js'
import { parseTime } from '../../source/time.js'
import { specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

const lineChartSpec = specificationFixture('multiline')
const categoricalBarChartSpec = specificationFixture('categoricalBar')

const ordinalSpec = specificationFixture('multiline')
ordinalSpec.encoding.color.type = 'ordinal'

module('unit > scales', hooks => {
	let scales

	hooks.beforeEach(() => {
		scales = {
			...parseScales(lineChartSpec, dimensions),
			colorOrdinal: parseScales(ordinalSpec, dimensions).color
		}
	})

	const scaleTypes = {
		x: 'temporal',
		y: 'quantitative',
		color: 'nominal',
		colorOrdinal: 'ordinal'
	}

	Object.entries(scaleTypes).forEach(([channel, type]) => {
		test(`${type} scales`, function(assert) {
			const scale = scales[channel]

			assert.equal(typeof scale, 'function', `${type} scale for ${channel} is a function`)
			assert.equal(
				typeof scale.domain,
				'function',
				`${type} scale for ${channel} provides a domain method`
			)
			assert.ok(
				Array.isArray(scale.domain()),
				`${type} scale for ${channel} domain method returns an array`
			)
			assert.equal(
				typeof scale.range,
				'function',
				`${type} scale for ${channel} provides a range method`
			)
			assert.ok(
				Array.isArray(scale.range()),
				`${type} scale for ${channel} range method returns an array`
			)

			if (['quantitative', 'temporal'].includes(type)) {
				assert.equal(
					scale.domain().length,
					2,
					`${channel} domain for ${type} scale is a set of two data endpoints`
				)
				assert.equal(
					scale.range().length,
					2,
					`${channel} range for ${type} scale is a set of two spatial endpoints`
				)
			}
		})
	})

	test('extended scales', assert => {
		const core = parseScales(lineChartSpec, dimensions)
		const extended = parseScales(categoricalBarChartSpec, dimensions)

		assert.ok(Object.keys(core).length < Object.keys(extended).length, 'creates additional scales')
		Object.entries(extended)
			.filter(([key]) => typeof core[key] === 'undefined')
			.forEach(function([name, scale]) {
				assert.equal(typeof scale, 'function', `${name} scale is a function`)
			})
	})

	test('explicit color ranges', assert => {
		const range = ['black', 'white']
		const s = {
			data: {
				values: [{ value: 1 }, { value: 2 }, { value: 3 }]
			},
			encoding: { color: { scale: { range }, type: 'nominal' } }
		}
		const scales = parseScales(s, dimensions)

		assert.equal(scales.color.range()[0], range[0])
		assert.equal(scales.color.range()[1], range[1])
	})

	test('line chart y axis scale zero baselines', assert => {
		const spec = () => {
			return {
				data: {
					values: [
						{ value: 100, label: '2020-01-01' },
						{ value: 200, label: '2020-01-02' },
						{ value: 300, label: '2020-01-03' }
					]
				},
				mark: 'line',
				encoding: {
					y: {
						field: 'value',
						type: 'quantitative',
						scale: { zero: null }
					},
					x: {
						field: 'label',
						type: 'temporal'
					}
				}
			}
		}

		const startAtZero = spec()
		const values = startAtZero.data.values.map(d => d.value)
		const min = Math.min.apply(null, values)

		const defaultBehavior = parseScales(startAtZero, dimensions).y

		assert.equal(defaultBehavior.domain()[0], 0, 'start at zero by default')

		const nonzero = spec()

		nonzero.encoding.y.scale.zero = false

		const nonzeroScales = parseScales(nonzero, dimensions).y

		assert.equal(nonzeroScales.domain()[0], min, 'can disable zero baseline')

		const zero = spec()

		zero.encoding.y.scale.zero = true

		const zeroScales = parseScales(zero, dimensions).y

		assert.equal(zeroScales.domain()[0], 0, 'can explicitly specify zero baseline')

		const negative = spec()

		negative.data.values[0].value = -100

		const negativeScales = parseScales(negative, dimensions).y

		assert.equal(negativeScales.domain()[0], -100, 'overridden by negative numbers')
	})

	test('uses custom domains', assert => {
		const s = {
			data: {
				values: [
					{ value: 100, group: 'a', label: '2020-01-01' },
					{ value: 200, group: 'b', label: '2020-01-02' },
					{ value: 300, broup: 'c', label: '2020-01-03' }
				]
			},
			encoding: {
				y: {
					field: 'value',
					type: 'quantitative',
					scale: { domain: [0, 500] }
				},
				x: {
					field: 'label',
					type: 'temporal',
					scale: { domain: ['2010-01-01', '2013-01-01'] }
				},
				color: {
					field: 'group',
					type: 'nominal',
					scale: { domain: ['a', 'b', 'c', 'd'] }
				}
			}
		}
		const { x, y, color } = parseScales(s)

		assert.equal(x.domain()[0].getTime(), parseTime(s.encoding.x.scale.domain[0]).getTime())
		assert.equal(x.domain()[1].getTime(), parseTime(s.encoding.x.scale.domain[1]).getTime())
		assert.equal(y.domain()[0], s.encoding.y.scale.domain[0])
		assert.equal(y.domain()[1], s.encoding.y.scale.domain[1])
		color.domain().forEach((value, index) => {
			assert.equal(value, s.encoding.color.scale.domain[index])
		})
	})

	test('generates color ranges to match custom domains', assert => {
		const domain = ['a', 'b', 'c', 'd']
		const s = {
			data: {
				values: [{ group: 'a' }, { group: 'b' }, { group: 'c' }]
			},
			encoding: {
				color: {
					field: 'group',
					type: 'nominal',
					scale: { domain }
				}
			}
		}
		const { color } = parseScales(s)

		assert.equal(color.range().length, domain.length)
	})

	test('generates scales for static value encodings', assert => {
		const s = {
			encoding: {
				size: {
					value: 5
				}
			}
		}
		const { size } = parseScales(s)

		assert.equal(typeof size, 'function')
		assert.equal(size(), s.encoding.size.value)
	})

	test('parses dates as temporal scales', assert => {
		const s = {
			data: {
				values: [
					{ date: '2021-01-01', value: 0 },
					{ date: '2021-01-02', value: 10 },
					{ date: '2021-01-03', value: 100 }
				]
			},
			encoding: {
				x: {
					type: 'temporal',
					field: 'date'
				}
			}
		}
		const { x } = parseScales(s)

		assert.equal(typeof x, 'function')
		x.domain().forEach(date => {
			assert.equal(typeof date, 'object')
			assert.equal(typeof date.getTime, 'function')
		})
	})

	test('parses dates as categorical scales', assert => {
		const s = {
			data: {
				values: [
					{ date: '2021-01-01', value: 0 },
					{ date: '2021-01-02', value: 10 },
					{ date: '2021-01-03', value: 100 }
				]
			},
			encoding: {
				x: {
					type: 'nominal',
					field: 'date'
				}
			}
		}
		const { x } = parseScales(s)

		assert.equal(typeof x, 'function')
		x.domain().forEach(date => {
			assert.equal(typeof date, 'string')
		})
	})

	test('null disables scales and passes values directly', assert => {
		const s = {
			data: {
				values: [
					{ group: 'red', value: 0 },
					{ group: 'blue', value: 10 },
					{ group: 'green', value: 100 }
				]
			},
			mark: {
				type: 'arc'
			},
			encoding: {
				theta: {
					type: 'quantitative',
					field: 'value'
				},
				color: {
					type: 'nominal',
					field: 'group',
					scale: null
				}
			}
		}
		assert.equal(parseScales(s).color('red'), 'red')
	})

	test('throws errors for unknown encoding types', assert => {
		const s = {
			data: {
				values: [
					{ group: 'a', value: 0 },
					{ group: 'b', value: 10 },
					{ group: 'c', value: 100 }
				]
			},
			mark: {
				type: 'arc'
			},
			encoding: {
				theta: {
					type: 'unknown encoding type',
					field: 'value'
				},
				color: {
					type: 'nominal',
					field: 'group'
				}
			}
		}
		assert.throws(() => parseScales(s))
	})

	test('generates symmetric log scales', assert => {
		const spec = {
			data: {
				values: [
					{ value: 10000, label: '2020-01-01' },
					{ value: 200, label: '2020-01-02' },
					{ value: 300, label: '2020-01-03' },
					{ value: 400, label: '2020-01-04' },
					{ value: 500, label: '2020-01-05' }
				]
			},
			mark: 'line',
			encoding: {
				y: {
					field: 'value',
					type: 'quantitative',
					scale: { type: 'symlog' }
				}
			}
		}

		assert.strictEqual(
			parseScales(spec, dimensions).y(100).toFixed(4),
			'50.5953',
			'should generate symmetric log scales'
		)
		assert.strictEqual(
			parseScales(spec, dimensions).y(0).toFixed(4),
			'100.0000',
			'symmetric log scales should handle zero'
		)
	})

	module('explicit scales', () => {
		const scales = [
			'sqrt',
			'pow',
			'linear',
			'log',
			'symlog',
			'time',
			'utc',
			'ordinal',
			'band',
			'point',
			'quantile',
			'quantize',
			'threshold'
		]
		scales.forEach(scale => {
			test(`${scale} scale`, assert => {
				const s = specificationFixture('line')
				s.encoding.y.scale = { type: scale }
				const { y } = parseScales(s)
				assert.equal(typeof y, 'function', `generates d3 scale function for ${scale} scale type`)
			})
		})
	})
})
