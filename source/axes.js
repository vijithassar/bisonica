import * as d3 from 'd3'

import { axisTickLabelText, rotation } from './text.js'
import { barWidth } from './marks.js'
import { degrees, isDiscrete, noop } from './helpers.js'
import { encodingChannelCovariate, encodingChannelQuantitative, encodingType } from './encodings.js'
import { feature } from './feature.js'
import { layerMatch } from './views.js'
import { parseScales } from './scales.js'
import { tickMargin } from './position.js'
import { timeMethod, timePeriod } from './time.js'

/**
 * tick count specifier
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 */
const ticks = (s, channel) => {
	const tickCount = s.encoding[channel].axis?.tickCount
	const hasTimeUnit = !!s.encoding[channel]?.timeUnit

	if (typeof tickCount === 'number') {
		return tickCount
	}

	if (encodingType(s, channel) === 'temporal' && hasTimeUnit) {
		let timeSpecifier

		if (typeof tickCount === 'string') {
			timeSpecifier = tickCount
		} else if (typeof tickCount?.interval === 'string') {
			timeSpecifier = tickCount.interval
		} else {
			timeSpecifier = timePeriod(s, channel)
		}

		if (timeSpecifier) {
			let step = tickCount?.step || 1

			return d3[timeMethod(timeSpecifier)].every(step)
		}
	}

	const scales = parseScales(s)

	if (isDiscrete(s, channel)) {
		return scales[channel].range()
	}

	const hasSingleValue = scales[channel].domain()[0] === scales[channel].domain()[1]

	if (hasSingleValue) {
		return 1
	}

	const max = scales[channel].domain()[1]
	const hasIntegerMax = max === parseInt(max, 10)
	const hasZeroMin = scales[channel].domain()[0] === 0
	const hasSingleDigitMax = max < 10

	if (hasIntegerMax && hasZeroMin && hasSingleDigitMax) {
		return max
	}

	return 10
}

/**
 * retrieve axis title
 * @param {object} s Vega Lite specification
 * @param {'x'|'y'} channel encoding channel
 * @returns {string} title
 */
const title = (s, channel) => {
	const encoding = s.encoding[channel]

	return encoding.axis?.title || encoding.field
}

/**
 * render axis tick text content
 * @param {object} s Vega Lite specification
 * @param {'x'|'y'} channel encoding channel
 * @returns {function} tick text renderer
 */
const tickText = (s, channel) => {
	return selection => {
		const hasLabels = feature(s)[`hasAxisLabels${channel.toUpperCase()}`]()
		const ticks = selection.selectAll('.tick').select('text')

		if (hasLabels) {
			ticks.call(axisTickLabelText(s, channel))
		} else {
			ticks.text('')
		}
	}
}

/**
 * create x axis
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} x axis creator
 */
const createX = (s, dimensions) => {
	if (!feature(s).hasAxisX()) {
		return noop
	}
	return selection => {
		const scales = parseScales(s, dimensions)
		const temporalBarOffsetY = feature(s).isTemporalBar() && encodingChannelCovariate(s) === 'y' ? barWidth(s, dimensions) : 0

		const axis = d3.axisBottom(scales.x)

		axis.ticks(ticks(s, 'x'))

		// removing axis ticks for bar charts makes the text labels
		// appear to label the bars directly
		if (feature(s).isBar()) {
			axis.tickSize(0)
		}

		const x = selection.select('g.x').attr('class', 'x')
		const classes = ['axis', encodingType(s, 'x'), rotation(s, 'x') ? 'angled' : ''].join(' ')

		const xAxis = x
			.append('g')
			.attr('class', classes)
			.classed(encodingType(s, 'x'), true)

		xAxis.call(axis)
		x.call(tickText(s, 'x'))

		const shift = feature(s).isBar() && encodingType(s, 'x') === 'temporal'
		x.attr('transform', () => {
			const bar = feature(s).isBar() ? barWidth(s, dimensions) : 0
			const xOffset = shift ? bar * 0.5 : 0
			let yOffset

			if (scales.y) {
				yOffset = isDiscrete(s, 'y') || encodingType(s, 'y') === 'temporal' ? scales.y.range().pop() : scales.y.range()[0]
				yOffset += temporalBarOffsetY
			} else {
				if (feature(s).isBar() && !feature(s).hasEncodingY()) {
					yOffset = barWidth(s, dimensions)
				} else {
					yOffset = 0
				}
			}

			return `translate(${xOffset},${yOffset})`
		})

		const angle = degrees(rotation(s, 'x'))

		if (angle) {
			const ticks = xAxis.selectAll('.tick text')
			const textHeight = ticks.node().getBBox().height
			const position = [textHeight * 0.5 * -1, 0]
			const degrees = angle % 360
			const below = degrees > 0 && degrees < 180
			const transform = `translate(${position.join(', ')}) rotate(${angle})`
			ticks
				.attr('transform', transform)
				.attr('text-anchor', below ? 'start' : 'end')
		}

		return axis
	}
}

/**
 * create y axis
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} y axis creator
 */
const createY = (s, dimensions) => {
	if (!feature(s).hasAxisY()) {
		return noop
	}
	return selection => {
		const scales = parseScales(s, dimensions)
		const temporalBarOffsetY = feature(s).isTemporalBar() && encodingChannelCovariate(s) === 'y' ? barWidth(s, dimensions) : 0

		const axis = d3.axisLeft(scales.y)

		axis.ticks(ticks(s, 'y'))

		const y = selection.select('g.y')
		const yAxis = y.append('g').classed('axis', true).classed(encodingType(s, 'y'), true)

		yAxis.call(axis).select('.domain').attr('stroke-width', 0)
		y.call(tickText(s, 'y'))

		const angle = degrees(rotation(s, 'y'))

		if (angle) {
			const ticks = yAxis.selectAll('.tick text')
			const textHeight = ticks.node().getBBox().height
			const position = [textHeight * 0.5 * -1, temporalBarOffsetY * 0.5]
			const transform = `translate(${position.join(', ')}) rotate(${angle})`
			ticks.attr('transform', transform)
		}
	}
}

/**
 * render x axis title
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} x axis title renderer
 */
const axisTitleX = (s, dimensions) => {
	return selection => {
		if (feature(s).hasAxisTitleX()) {
			const xTitle = selection.append('text').attr('class', 'title')
			const bar = feature(s).isBar() ? barWidth(s, dimensions) : 0

			xTitle
				.attr('x', dimensions.x * 0.5 - bar * 0.5)
				.attr('y', () => {
					const axisHeight = selection.node().getBBox().height * 2
					const tickHeight = tickMargin(s).bottom
					const yPosition = axisHeight + tickHeight

					return yPosition
				})
				.text(title(s, 'x'))
		}
	}
}

/**
 * render y axis title
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} y axis title renderer
 */
const axisTitleY = (s, dimensions) => {
	return selection => {
		if (feature(s).hasAxisTitleY()) {
			const yTitle = selection.append('text').attr('class', 'title')
			const yTitlePadding = {
				x: 0.2
			}
			const yTitlePosition = {
				x: selection.node().getBBox().width * (1 + yTitlePadding.x) * -1,
				y: dimensions.y * 0.5
			}

			yTitle
				.attr('x', yTitlePosition.x)
				.attr('y', yTitlePosition.y)
				.attr('transform', `rotate(270 ${yTitlePosition.x} ${yTitlePosition.y})`)
				.text(title(s, 'y'))
		}
	}
}

/**
 * extend ticks across the chart
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} y axis tick extension adjustment function
 */
const axisTicksExtensionY = (s, dimensions) => {
	return selection => {
		if ((feature(s).isBar() || feature(s).isLine()) && encodingChannelQuantitative(s) === 'y' && feature(s).hasEncodingX()) {
			const offset = feature(s).isTemporalBar() && encodingType(s, 'x') === 'temporal' ? barWidth(s, dimensions) : 0
			const tickEnd = parseScales(s, dimensions).x.range()[1] + offset
			selection
				.select('.y .axis')
				.selectAll('.tick')
				.select('line')
				.attr('x1', tickEnd)
		}
	}
}

/**
 * adjust axis titles based on a live DOM node
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} axis title adjustment function
 */
const axisTitles = (s, dimensions) => {
	return selection => {
		selection.select('.y').call(axisTitleY(s, dimensions))
		selection.select('.x').call(axisTitleX(s, dimensions))
	}
}

/**
 * adjust axis ticks based on a live DOM node
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} axis tick adjustment function
 */
const axisTicks = (s, dimensions) => {
	return selection => {
		selection.select('.y').call(axisTicksExtensionY(s, dimensions))
	}
}

/**
 * render chart axes
 * @param {object} _s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} renderer
 */
const axes = (_s, dimensions) => {
	const test = s => {
		if (feature(_s).hasLayers()) {
			return s
		} else {
			return s.encoding?.x?.type && s.encoding?.y?.type
		}
	}
	let s = layerMatch(_s, test)

	if (!s) {
		return noop
	}

	const renderer = selection => {
		if (typeof s.encoding !== 'object') {
			return noop
		}

		const axes = selection.select('g.axes')

		if (feature(s).hasEncodingY()) {
			axes.call(createY(s, dimensions))
		}

		if (feature(s).hasEncodingX()) {
			axes.call(createX(s, dimensions))
		}

		if (feature(s).hasAxis()) {
			selection.select('.axes').call(axisTitles(s, dimensions))
			selection.select('.axes').call(axisTicks(s, dimensions))
		}
	}

	return renderer
}

export { axes, ticks }
