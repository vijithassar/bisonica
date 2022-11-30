import { margin } from '../../source/position.js'
import qunit from 'qunit'

const { module, test } = qunit

const round = (i, precision = 1000) => Math.round(i * precision) / precision

const specification = modifier => {
	return modifier({
		data: {
			values: [
				{ value: 10, label: 'a' },
				{ value: 10, label: 'b' },
				{ value: 30, label: 'c' }
			]
		},
		mark: { type: 'bar' },
		encoding: {
			x: { field: 'value', type: 'quantitative' },
			y: { field: 'label', type: 'nominal' }
		}
	})
}

const axisTitle = (channel, text) => {
	return s => {
		if (!s.encoding[channel].axis) {
			s.encoding[channel].axis = {}
		}

		s.encoding[channel].axis.title = text

		return s
	}
}

const labelAngle = angle => {
	return s => {
		if (!s.encoding.x.axis) {
			s.encoding.x.axis = {}
		}

		s.encoding.x.axis.labelAngle = angle

		return s
	}
}

const s = angle => specification(labelAngle(angle))

const dimensions = { x: 500, y: 500 }

const bottom = angle => round(margin(s(angle), dimensions).bottom)

module('unit > margin', () => {
	test('increases bottom margins to reserve space for labelAngle rotation', assert => {
		assert.ok(margin(s(0), dimensions).bottom < margin(s(45), dimensions).bottom)
		assert.ok(margin(s(45), dimensions).bottom < margin(s(90), dimensions).bottom)
	})

	test('computes identical bottom margins for equivalent positive and negative axis tick text labelAngle rotation', assert => {
		assert.equal(margin(s(45), dimensions).bottom, margin(s(-45), dimensions).bottom)
	})

	module(
		'computes identical bottom margins for equivalent axis tick text labelAngle rotation starting at',
		() => {
			const offsets = [5, 10, 15, 20, 25, 30]
			const startAngles = [90, 270]

			startAngles.forEach(angle => {
				test(`${angle} degrees`, assert => {
					offsets.forEach(offset => {
						const a = angle - offset
						const b = angle + offset

						assert.equal(
							bottom(a),
							bottom(b),
							`rotating x axis tick text ${a} degrees and ${b} degrees results in identical bottom margins`
						)
					})
				})
			})
		}
	)
	module('increases margin for axis titles', () => {
		const axes = { x: 'bottom', y: 'left' }

		Object.entries(axes).forEach(([channel, position]) => {
			test(channel, assert => {
				const hasAxisTitle = margin(specification(axisTitle(channel, 'testing')), dimensions)
				const noAxisTitle = margin(specification(axisTitle(channel, null)), dimensions)

				assert.true(hasAxisTitle[position] > noAxisTitle[position], channel)
			})
		})
	})
})
