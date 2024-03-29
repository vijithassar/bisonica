import { barWidth, markSelector } from '../../source/marks.js'
import qunit from 'qunit'
import { specificationFixture } from '../test-helpers.js'

const { module, test } = qunit

module('unit > marks', () => {
	module('bar width', () => {
		const dimensions = { x: 1000, y: 1000 }

		test('return value', assert => {
			const specification = specificationFixture('categoricalBar')

			assert.equal(
				typeof barWidth(specification, dimensions),
				'number',
				'bar width is a number'
			)
		})

		test('temporal encoding', assert => {
			const specification = specificationFixture('temporalBar')
			const dates = new Set(specification.data.values.map(item => item.label)).size

			assert.ok(
				barWidth(specification, dimensions) <= dimensions.x / dates,
				'time series bar width sized according to number of timestamps'
			)
		})

		test('nominal encoding', assert => {
			const specification = specificationFixture('categoricalBar')
			const categories = specification.data.values.map(item => item.label).length

			assert.ok(
				barWidth(specification, dimensions) <= dimensions.x / categories,
				'time series bar width sized according to number of categories'
			)
		})

		test('temporal gap', assert => {
			const specification = specificationFixture('stackedBar')
			specification.data.values = [
				{ label: '2020-01-01', value: 10, group: 'a' },
				{ label: '2020-01-01', value: 20, group: 'b' },
				{ label: '2020-01-02', value: 30, group: 'a' },
				{ label: '2020-01-02', value: 40, group: 'b' }
			]
			assert.ok(
				barWidth(specification, dimensions) <= dimensions.x / 3,
				'gap left between two time series bars'
			)
		})

		test('nominal gap', assert => {
			const specification = specificationFixture('categoricalBar')
			specification.data.values = [
				{ group: 'a', value: 10 },
				{ group: 'b', value: 20 }
			]
			assert.ok(
				barWidth(specification, dimensions) <= dimensions.x / 3,
				'gap left between two categorical bars'
			)
		})

		test('iterates through temporal periods for custom domains', assert => {
			const standardSpec = specificationFixture('temporalBar')
			const customSpec = specificationFixture('temporalBar')
			const standardWidth = barWidth(standardSpec, dimensions)
			customSpec.encoding.x.scale = { domain: ['2010', '2020'] }
			const customWidth = barWidth(customSpec, dimensions)
			assert.ok(standardWidth > customWidth)
		})
	})
	module('point marks', () => {
		test('point', assert => {
			assert.equal(markSelector(specificationFixture('scatterPlot')), 'circle')
		})
		test('circle', assert => {
			assert.equal(markSelector(specificationFixture('scatterPlot')), 'circle')
		})
		test('square', assert => {
			const s = specificationFixture('scatterPlot')
			s.mark.type = 'square'
			assert.equal(markSelector(s), 'rect')
		})
	})
})
