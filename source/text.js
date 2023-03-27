import * as d3 from 'd3'
import { MINIMUM_TICK_COUNT } from './config.js'
import { encodingType } from './encodings.js'
import { getTimeFormatter } from './time.js'
import { memoize } from './memoize.js'
import { parseScales } from './scales.js'
import { ticks } from './axes.js'
import { isContinuous, isDiscrete } from './helpers.js'

const canvas = document.createElement('canvas')
const context = canvas.getContext('2d')

const maxWidth = 180

const defaultStyles = {}

/**
 * measure the width of a text string
 * @param {string} text text string
 * @param {object} [styles] styles
 * @returns {number} string width
 */
const _measureText = (text, styles = defaultStyles) => {
	// set styles
	Object.assign(context, styles)

	const value = context.measureText(text).width

	// reset styles on shared global <canvas> DOM node
	Object.entries(styles).forEach(([key]) => {
		context[key] = null
	})

	return value
}

const measureText = memoize(_measureText)

/**
 * extract font styles relevant to string width
 * from a DOM node
 * @param {object} node DOM node
 * @returns {object} hashmap of styles
 */
const fontStyles = node => {
	const fontStyleProperties = ['letter-spacing', 'font-size', 'font', 'font-weight']
	const computedStyles = getComputedStyle(node)
	let fontStyles = {}

	fontStyleProperties.forEach(property => {
		const value = computedStyles[property]

		if (value) {
			fontStyles[property] = value
		}
	})

	return fontStyles
}

/**
 * abbreviate axis tick label text
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @param {'x'|'y'} channel encoding channel
 * @returns {function} abbreviation function
 */
const _abbreviate = (s, dimensions, channel) => {
	return tick => {
		if (encodingType(s, channel) !== 'quantitative') {
			return tick
		}

		const scales = parseScales(s, dimensions)

		const hasLargeValues = scales[channel]
			.ticks()
			.some(tick => typeof tick === 'number' && tick >= 1000)

		if (!hasLargeValues) {
			return tick
		}

		const si = scales[channel].tickFormat(MINIMUM_TICK_COUNT, '.1~s')

		return si(tick).toUpperCase().replace('G', 'B')
	}
}
const abbreviate = memoize(_abbreviate)

/**
 * format axis tick label text
 * @param {object} s Vega Lite specification
 * @param {'x'|'y'} channel encoding channel
 * @returns {function} formatting function
 */
const format = (s, channel) => {
	const formatter = encodingType(s, channel) === 'temporal' ? getTimeFormatter(s, channel) : label => label.toString()

	return text => formatter(text)
}

/**
 * rotate axis tick label text
 * @param {object} s Vega Lite specification
 * @returns {number} axis tick text rotation
 */
const rotation = (s, channel) => (s.encoding?.[channel]?.axis?.labelAngle * Math.PI) / 180 || 0

/**
 * truncate axis tick label text
 *
 * This returns a string instead of acting as a factory
 * because the string length computation is expensive
 * so it's particularly helpful to be able to memoize
 * all the arguments at once.
 *
 * @param {string} text text to truncate
 * @param {number} limit maximum width
 * @param {object} [styles] styles to incorporate when measuring text width
 * @returns {string} truncated string
 */
const _truncate = (text, limit, styles = defaultStyles) => {
	if (limit === 0) {
		return text
	}
	let change = false

	let substring = text

	while (measureText(`${substring}…`, styles) > limit && substring.length > 0) {
		change = true
		substring = substring.slice(0, -1)
	}

	const suffix = change ? '…' : ''

	return `${substring}${suffix}`
}
const truncate = memoize(_truncate)

/**
 * process axis tick text content
 * @param {object} s Vega Lite specification
 * @param {'x'|'y'} channel axis dimension
 * @param {string} textContent text to process
 * @param {object} [styles] styles to incorporate when measuring text width
 * @returns {string} text processing function
 */
const _axisTicksLabelTextContent = (s, channel, textContent, styles = defaultStyles) => {
	let text = textContent

	text = format(s, channel)(text)

	text = abbreviate(s, channel)(text)

	const limit = d3.min([s.encoding[channel].axis?.labelLimit, maxWidth])

	text = truncate(text, limit, styles)

	return text
}
const axisTicksLabelTextContent = memoize(_axisTicksLabelTextContent)

/**
 * compute margin values based on chart type
 * @param {object} s Vega Lite specification
 * @returns {object} longest axis tick label text length in pixels
 */
const _longestAxisTickLabelTextWidth = s => {
	const scales = parseScales(s)

	const channels = ['x', 'y']
	const tickLabels = channels.map(channel => {
		const processText = tick => axisTicksLabelTextContent(s, channel, tick)

		if (isContinuous(s, channel)) {
			return scales[channel].ticks(ticks(s, channel)).map(processText)
		} else if (isDiscrete(s, channel)) {
			return scales[channel].domain().map(processText)
		} else {
			return ['']
		}
	})

	const longest = tickLabels.map(ticks => {
		return d3.max(ticks, d => measureText(d))
	})

	const result = longest.reduce((previous, current, index) => {
		return {
			...previous,
			[channels[index]]: current || null
		}
	}, {})

	return result
}
const longestAxisTickLabelTextWidth = memoize(_longestAxisTickLabelTextWidth)

/**
 * render axis tick text
 * @param {object} s Vega Lite specification
 * @param {'x'|'y'} channel encoding channel
 * @returns {function} text processing function
 */
const axisTicksLabelText = (s, channel) => {
	let styles = {}

	return selection => {
		// only retrieve rendered font styles once per axis instead of separately
		// for each tick to avoid performance issues
		const node = selection.node()

		if (!styles[channel] && node) {
			styles[channel] = fontStyles(node)
		}

		selection.text(label => axisTicksLabelTextContent(s, channel, label, styles[channel]))
	}
}

/**
 * format legend content as a readable string
 * @param {string[]|number[]} items domain
 * @returns {string} domain with string formatting
 */
const list = items => {
	if (items.length === 1) {
		return `${items[0]}`
	} else {
		const rest = items.slice(0, -1)
		const last = items.slice().pop()
		return `${rest.join(', ')}, and ${last}`
	}
}

export {
	abbreviate,
	rotation,
	format,
	truncate,
	axisTicksLabelTextContent,
	axisTicksLabelText,
	longestAxisTickLabelTextWidth,
	list
}
