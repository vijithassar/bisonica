/**
 * render x and y axes for a chart
 * @module axes
 * @see {@link https://vega.github.io/vega-lite/docs/axis.html|vega-lite:axis}
 */

import './types.d.js'

import * as d3 from 'd3'

import { axisTicksLabelText, rotation, truncate } from './text.js'
import { barWidth } from './marks.js'
import { degrees, detach, isContinuous, isDiscrete, noop } from './helpers.js'
import { encodingChannelCovariate, encodingType } from './encodings.js'
import { feature } from './feature.js'
import { layerMatch } from './views.js'
import { parseScales } from './scales.js'
import { renderStyles } from './styles.js'
import { tickMargin } from './position.js'
import { timeMethod, timePeriod } from './time.js'
import { axisDescription } from './descriptions.js'

/**
 * tick count specifier
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {number|function} tick count
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
		return scales[channel].range().length
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
 * @param {specification} s Vega Lite specification
 * @param {cartesian} channel encoding channel
 * @return {string} title
 */
const axisTitle = (s, channel) => {
	const encoding = s.encoding[channel]
	return encoding.axis?.title || encoding.title || encoding.field
}

/**
 * retrieve axis title and possibly truncate
 * @param {specification} s Vega Lite specification
 * @param {cartesian} channel encoding channel
 * @return {string} title text, potentially truncated
 */
const titleText = (s, channel) => {
	const limit = s.encoding[channel].axis?.titleLimit
	const text = axisTitle(s, channel)
	return limit ? truncate(text, limit) : text
}

/**
 * render axis tick text content
 * @param {specification} s Vega Lite specification
 * @param {cartesian} channel encoding channel
 * @return {function(object)} tick text renderer
 */
const tickText = (s, channel) => {
	return selection => {
		const hasLabels = feature(s)[`hasAxisLabels${channel.toUpperCase()}`]()
		const ticks = selection.selectAll('.tick').select('text')

		if (hasLabels) {
			ticks.call(axisTicksLabelText(s, channel))
		} else {
			ticks.text('')
		}
	}
}

/**
 * axis positions
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {function('x'|'y')} y axis positions
 */
const axisOffset = (s, dimensions) => {
	return channel => {
		if (channel !== 'y') {
			throw new Error(`cannot compute axis offset for channel ${channel}`)
		}
		const shift = feature(s).isBar() && encodingType(s, 'x') === 'temporal'
		const bar = feature(s).isBar() ? barWidth(s, dimensions) : 0
		const x = shift ? bar * 0.5 : 0

		let y
		const scales = parseScales(s, dimensions)
		const temporalBarOffsetY = feature(s).isTemporalBar() && encodingChannelCovariate(s) === 'y' ? barWidth(s, dimensions) : 0
		if (scales.y) {
			y = isDiscrete(s, 'y') || encodingType(s, 'y') === 'temporal' ? scales.y.range().pop() : scales.y.range()[0]
			y += temporalBarOffsetY
		} else {
			if (feature(s).isBar() && !feature(s).hasEncodingY()) {
				y = barWidth(s, dimensions)
			} else {
				y = 0
			}
		}

		return { x, y }
	}
}

/**
 * create x axis
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {function(object)} x axis creator
 */
const createX = (s, dimensions) => {
	if (!feature(s).hasAxisX()) {
		return noop
	}
	return selection => {
		const scales = parseScales(s, dimensions)

		const axis = d3.axisBottom(scales.x)

		axis.ticks(ticks(s, 'x'))

		if (feature(s).isBar() && isDiscrete(s, 'x')) {
			axis.tickSize(0)
		}

		const classes = [
			'axis',
			encodingType(s, 'x'),
			isContinuous(s, 'x') ? 'continuous' : null,
			isDiscrete(s, 'x') ? 'continuous' : null,
			rotation(s, 'x') ? 'angled' : ''
		].filter(Boolean).join(' ')

		const xAxis = selection
			.append('g')
			.attr('class', classes)
			.classed(encodingType(s, 'x'), true)

		xAxis.call(axis)
		selection.call(tickText(s, 'x'))

		selection.attr('transform', () => {
			const { x, y } = axisOffset(s, dimensions)('y')
			return `translate(${x},${y})`
		})

		return axis
	}
}

/**
 * create y axis
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {function(object)} y axis creator
 */
const createY = (s, dimensions) => {
	if (!feature(s).hasAxisY()) {
		return noop
	}
	const classes = [
		'axis',
		encodingType(s, 'x'),
		isContinuous(s, 'x') ? 'continuous' : null,
		isDiscrete(s, 'x') ? 'continuous' : null,
		rotation(s, 'x') ? 'angled' : ''
	].filter(Boolean).join(' ')

	return selection => {
		const scales = parseScales(s, dimensions)

		const axis = d3.axisLeft(scales.y)

		axis.ticks(ticks(s, 'y'))

		if (feature(s).isBar() && isDiscrete(s, 'y')) {
			axis.tickSize(0)
		}

		const yAxis = selection
			.append('g')
			.attr('class', classes)
			.classed(encodingType(s, 'y'), true)

		yAxis.call(axis).select('.domain').attr('stroke-width', 0)
		selection.call(tickText(s, 'y'))
	}
}

/**
 * render x axis title
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {function(object)} x axis title renderer
 */
const axisTitleX = (s, dimensions) => {
	if (!feature(s).hasEncodingX() || !feature(s).hasAxisTitleX()) {
		return noop
	}
	return selection => {
		const xTitle = selection.append('text').attr('class', 'title')
		xTitle
			.attr('x', () => {
				return dimensions.x * 0.5
			})
			.attr('y', () => {
				const axisHeight = selection.node().getBBox().height * 2
				const tickHeight = tickMargin(s).bottom
				const yPosition = axisHeight + tickHeight

				return yPosition
			})
			.attr('transform', `translate(0,${axisOffset(s, dimensions)('y').y})`)
			.text(titleText(s, 'x'))
			.call(axisTitleStyles(s, 'x'))
	}
}

/**
 * render y axis title
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {function(object)} y axis title renderer
 */
const axisTitleY = (s, dimensions) => {
	return selection => {
		if (feature(s).hasEncodingY() && feature(s).hasAxisTitleY()) {
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
				.text(titleText(s, 'y'))
				.call(axisTitleStyles(s, 'y'))
		}
	}
}

/**
 * determine whether a given axis should have axis
 * ticks that extend across the full data rectangle
 * to serve as grid lines
 * @param {specification} s Vega Lite specification
 * @param {cartesian} channel visual encoding channel
 */
const hasGridLines = (s, channel) => {
	if (isContinuous(s, channel)) {
		if (feature(s).isBar() && encodingType(s, channel) !== 'quantitative') {
			return false
		}
		return true
	}
}

/**
 * extend ticks across the chart
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {function(object)} y axis tick extension adjustment function
 */
const axisTicksExtensionY = (s, dimensions) => {
	return selection => {
		if (!hasGridLines(s, 'y')) {
			return
		}
		if (isContinuous(s, 'y') && feature(s).hasEncodingX()) {
			const offset = feature(s).isTemporalBar() && encodingType(s, 'x') === 'temporal' ? barWidth(s, dimensions) : 0
			const tickEnd = parseScales(s, dimensions).x.range()[1] + offset
			selection
				.select('line')
				.attr('x1', tickEnd)
		}
	}
}

/**
 * extend ticks across the chart
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {function(object)} x axis tick extension adjustment function
 */
const axisTicksExtensionX = (s, dimensions) => {
	return selection => {
		if (!hasGridLines(s, 'x')) {
			return
		}
		if (isContinuous(s, 'x') && feature(s).hasEncodingY()) {
			const offset = feature(s).isTemporalBar() && encodingType(s, 'y') === 'temporal' ? barWidth(s, dimensions) : 0
			const tickLength = d3.sum(parseScales(s, dimensions).y.range().map(Math.abs)) + offset
			const tickEnd = tickLength * -1
			selection
				.select('line')
				.attr('y1', tickEnd)
				.attr('y2', 0)
		}
	}
}

/**
 * adjust y axis tick rotation based on a live DOM node
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {function(object)} y axis tick rotation adjustment function
 */
const axisTicksRotationY = (s, dimensions) => {
	return selection => {
		const angle = degrees(rotation(s, 'y'))

		if (angle) {
			const temporalBarOffsetY = feature(s).isTemporalBar() && encodingChannelCovariate(s) === 'y' ? barWidth(s, dimensions) : 0
			const ticks = selection.selectAll('text')
			const textHeight = ticks.node().getBBox().height
			const position = [textHeight * 0.5 * -1, temporalBarOffsetY * 0.5]
			const transform = `translate(${position.join(', ')}) rotate(${angle})`
			ticks.attr('transform', transform)
		}
	}
}

/**
 * adjust y axis tick rotation based on a live DOM node
 * @param {specification} s Vega Lite specification
 * @return {function(object)} x axis tick rotation adjustment function
 */
const axisTicksRotationX = s => {
	return selection => {
		const angle = degrees(rotation(s, 'x'))

		if (angle) {
			const ticks = selection.selectAll('text')
			const textHeight = ticks.node().getBBox().height
			const position = [textHeight * 0.5 * -1, 0]
			const degrees = angle % 360
			const below = degrees > 0 && degrees < 180
			const transform = `translate(${position.join(', ')}) rotate(${angle})`
			ticks
				.attr('transform', transform)
				.attr('text-anchor', below ? 'start' : 'end')
		}
	}
}

/**
 * adjust axis titles based on a live DOM node
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {function(object)} axis title adjustment function
 */
const axisTitles = (s, dimensions) => {
	return selection => {
		selection.select('.y').call(axisTitleY(s, dimensions))
		selection.select('.x').call(axisTitleX(s, dimensions))
	}
}

/**
 * adjust axis ticks based on a live DOM node
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {function(object)} axis tick adjustment function
 */
const axisTicks = (s, dimensions) => {
	return selection => {
		selection.selectAll('.y .tick')
			.call(axisTicksExtensionY(s, dimensions))
		selection.selectAll('.x .tick')
			.call(axisTicksExtensionX(s, dimensions))
			.call(axisTicksRotationX(s))
			.call(axisTicksStyles(s, 'x'))
		selection.selectAll('.y .tick')
			.call(axisTicksRotationY(s, dimensions))
			.call(axisTicksStyles(s, 'y'))
	}
}

const titleStyles = {
	titleColor: 'fill',
	titleFont: 'font-family',
	titleFontSize: 'font-size',
	titleFontStyle: 'font-style',
	titleFontWeight: 'font-weight',
	titleOpacity: 'opacity'
}

/**
 * render style instructions for an axis title
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {function(object)} title style rendering function
 */
const axisTitleStyles = (s, channel) => renderStyles(titleStyles, s.encoding[channel].axis)

const tickStyles = {
	tickColor: 'fill',
	tickCap: 'stroke-linecap',
	tickOpacity: 'opacity'
}

/**
 * render style instructions for axis ticks
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {function(object)} tick style rendering function
 */
const axisTicksStyles = (s, channel) => {
	if (feature(s)[`hasEncoding${channel.toUpperCase()}`]()) {
		return renderStyles(tickStyles, s.encoding[channel].axis)
	} else {
		return noop
	}
}

/**
 * run functions that require a live DOM node
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {function(object)} axis adjustment function
 */
const postAxisRender = (s, dimensions) => {
	return selection => {
		if (feature(s).hasAxis()) {
			selection.select('.axes').call(axisTitles(s, dimensions))
			selection.select('.axes').call(axisTicks(s, dimensions))
		}
	}
}

/**
 * render chart axes
 * @param {object} _s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {function(object)} renderer
 */
const axes = (_s, dimensions) => {
	const test = s => {
		if (feature(_s).hasLayers()) {
			return s
		} else {
			return (feature(s).hasEncodingX() && feature(s).hasEncodingY()) ||
				(feature(s).hasEncodingX() || feature(s).hasEncodingY())
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
			axes
				.select('.y')
				.attr('aria-label', s.encoding.y.axis?.aria !== false ? axisDescription(s, 'y') : null)
				.call(detach(createY(s, dimensions)))
		}

		if (feature(s).hasEncodingX()) {
			axes
				.select('.x')
				.attr('aria-label', s.encoding.x.axis?.aria !== false ? axisDescription(s, 'x') : null)
				.call(detach(createX(s, dimensions)))
		}

		selection.call(postAxisRender(s, dimensions))
	}

	return renderer
}

export { axes, axisTitle, ticks }
