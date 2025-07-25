/**
 * collect data to be rendered into a tooltip
 * @module tooltips
 * @see {@link module:interactions}
 * @see {@link https://vega.github.io/vega-lite/docs/tooltip.html|vega-lite:tooltip}
 */

import * as d3 from 'd3'
import { extendError } from './error.js'

import { category } from './marks.js'
import { createAccessors } from './accessors.js'
import { encodingChannelQuantitative, encodingField, encodingType, encodingValue } from './encodings.js'
import { feature } from './feature.js'
import { formatAxis } from './format.js'
import { memoize } from './memoize.js'
import { deduplicateByField, noop } from './helpers.js'
import { parseScales } from './scales.js'
import { transformDatum } from './transform.js'
import { values } from './values.js'

/**
 * format field description
 * @param {object} field key and value pair
 * @return {string} field description
 */
const formatField = field => {
	return `${field.key}: ${field.value}`
}

/**
 * format datum description
 * @param {object[]|string} content data fields to format
 * @return {string} datum description
 */
const formatTooltipContent = content => {
	if (Array.isArray(content)) {
		return content.map(formatField).join('; ')
	} else {
		return content
	}
}

const _includedChannels = s => {
	const excluded = ['tooltip', 'href', 'text', 'description']

	if (!feature(s).isMulticolor()) {
		excluded.push('color')
	}

	const included = Object.keys(s.encoding)
		.filter(channel => excluded.includes(channel) === false)

	return deduplicateByField(s)(included)
}

/**
 * determine which encoding channels to include in a description
 * @param {specification} s Vega Lite specification
 * @return {string[]} included channels
 */
const includedChannels = memoize(_includedChannels)

/**
 * dispatch a CustomEvent with a data point
 * @param {specification} s Vega Lite specification
 * @param {SVGElement} node mark DOM node
 * @param {object} interaction event
 */
function tooltipEvent(s, node, interaction) {
	try {
		const datum = d3.select(node).datum()

		if (!datum) {
			return
		}

		const detail = { datum, node, interaction, content: tooltipContentData(s)(datum) }

		if (feature(s).isMulticolor()) {
			detail.color = parseScales(s).color(category.get(datum))
		}

		const customEvent = new CustomEvent('tooltip', {
			bubbles: true,
			detail
		})

		node.dispatchEvent(customEvent)
	} catch (error) {
		extendError(error, 'could not emit tooltip event')
	}
}

/**
 * render a tooltip
 * @param {object} selection D3 selection with a mark
 * @param {specification} s Vega Lite specification
 */
const tooltip = (selection, s) => {
	if (!s.mark.tooltip || s.encoding.tooltip === null) {
		return noop
	}

	selection.append('title').text(tooltipContent(s)(selection.datum()))
}

/**
 * create a function to render all tooltips
 * @param {specification} s Vega Lite specification
 * @return {function(object)} tooltip rendering function
 */
const tooltips = s => {
	if (s.usermeta?.tooltipHandler) {
		return noop
	}
	return selection => {
		selection.each(function() {
			tooltip(d3.select(this), s)
		})
	}
}

/**
 * create a function to retrieve a tooltip field pair from a datum
 * @param {specification} s Vega Lite specification
 * @param {string} type encoding parameter, field, or transform field
 * @return {function(object)} function
 */
const _getTooltipField = (s, type) => {
	let accessors

	const channel = type

	accessors = createAccessors(s)

	// report length instead of start position as tooltip value for stacks
	if (feature(s).isBar() || feature(s).isArea()) {
		accessors[encodingChannelQuantitative(s)] = accessors.length
	}

	let key

	key = encodingField(s, channel)

	const getValue = accessors?.[channel] ? accessors[channel] : encodingValue(s, channel)

	const stack = s.encoding[channel]?.stack
	const normalize = stack === 'normalize'

	const percentage = value => {
		let total
		if (feature(s).isCircular()) {
			total = d3.sum(values(s).map(encodingValue(s, channel)))
		} else if (feature(s).isCartesian()) {
			total = 1
		}
		return Math.round(value / total * 100) + '%'
	}

	return d => {
		let value

		value = getValue(d)

		if (channel === 'color' && value === undefined) {
			value = category.get(d)
		}

		if (encodingType(s, channel) === 'temporal') {
			value = formatAxis(s, channel)(value)
		}

		if (!key && !value) {
			key = type // key may be a field, not a channel
			value = transformDatum(s)()(d)[key]
		}

		if (normalize) {
			value = percentage(value)
		}

		return { key, value }
	}
}
const getTooltipField = memoize(_getTooltipField)

/**
 * retrieve default fields for tooltip
 * @param {specification} s Vega Lite specification
 * @return {function(object)} default field content retrieval function
 */
const _tooltipContentDefault = s => {
	return d => {
		return includedChannels(s).map(channel => getTooltipField(s, channel)(d))
	}
}
const tooltipContentDefault = memoize(_tooltipContentDefault)

const _tooltipContentAll = s => {
	return d => {
		const encodings = tooltipContentDefault(s)(d)
		const encodingFields = new Set(encodings.map(item => item.key))
		const properties = Object.keys(d)
		const metadataProperties = properties.filter(property => !encodingFields.has(property))
		const metadata = metadataProperties.map(property => {
			return { key: property, value: d[property] }
		})

		return [...encodings, ...metadata]
	}
}
/**
 * retrieve all datum fields for tooltip
 * @param {specification} s Vega Lite specification
 * @param {object} d datum
 * @return {object[]} all field content
 */
const tooltipContentAll = memoize(_tooltipContentAll)

/**
 * create a function to retrieve tooltip content
 * @param {specification} s Vega Lite specification
 * @return {function(object)} tooltip field data lookup function
 */
const tooltipContentData = s => {
	return d => {
		if (!Object.keys(d).length) {
			return
		}

		const single = encodingField(s, 'tooltip') && !Array.isArray(s.encoding.tooltip)
		const multiple = Array.isArray(s.encoding.tooltip)
		const all = s.mark.tooltip?.content === 'data'

		if (all) {
			return tooltipContentAll(s)(d)
		} else if (single) {
			return getTooltipField(s, 'tooltip')(d).value
		} else if (multiple) {
			return s.encoding.tooltip.map(fieldDefinition => {
				const field = getTooltipField(s, fieldDefinition.field)(d)

				if (fieldDefinition.label) {
					field.key = fieldDefinition.label
				}

				return field
			})
		} else {
			return tooltipContentDefault(s)(d)
		}
	}
}

/**
 * create a function to render tooltip content
 * @param {specification} s Vega Lite specification
 * @return {function} tooltip content renderer
 */
const _tooltipContent = s => {
	return memoize(d => formatTooltipContent(tooltipContentData(s)(d)))
}
const tooltipContent = memoize(_tooltipContent)

export { tooltips, tooltipEvent, tooltipContent, getTooltipField }
