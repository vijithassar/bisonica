/**
 * generate written descriptions of data
 * @module descriptions
 */

import './types.d.js'

import * as d3 from 'd3'
import { capitalize, datum, identity, isContinuous } from './helpers.js'
import {
	encodingField,
	encodingType,
	encodingValue,
	encodingChannelQuantitative,
	encodingChannelCovariateCartesian
} from './encodings.js'
import { memoize } from './memoize.js'
import { getTooltipField, tooltipContent } from './tooltips.js'
import { data } from './data.js'
import { feature } from './feature.js'
import { extension } from './extensions.js'
import { axisTitle } from './axes.js'
import { scaleType, parseScales } from './scales.js'
import { formatAxis } from './format.js'
import { list } from './text.js'

const fieldDelimiter = '; '

const quantitativeChannels = s => {
	const result = Object.keys(s.encoding)
		.filter(channel => encodingType(s, channel) === 'quantitative')
	return result
}

/**
 * calculate minimum and maximum value for
 * each quantitative channel
 * @param {specification} s Vega Lite specification
 * @return {object} extents
 */
const calculateExtents = s => {
	const quantitative = quantitativeChannels(s)
	let result = {}

	let values
	let value
	if (feature(s).isCircular()) {
		values = data(s)
		value = d => d.value
	} else if (feature(s).isLine()) {
		values = data(s).map(series => series.values).flat()
		value = d => d.value
	} else if (feature(s).isBar()) {
		values = data(s).flat()
		value = d => d[1] - d[0]
	} else {
		values = data(s)
	}

	quantitative.forEach(channel => {
		// if the value function can't be determined before
		// this point, there may be multiple quantitative
		// encodings
		if (!value) {
			value = d => encodingValue(s, channel)(d)
		}

		result[channel] = new Map()
		const [min, max] = d3.extent(values, value)
		result[channel].set(min, { type: 'minimum' })
		result[channel].set(max, { type: 'maximum' })
	})

	return result
}

/**
 * return an empty string as a default value
 * @return {string} empty string
 */
const empty = () => ''

/**
 * render descriptive text highlighting the minimum
 * and maximum values in the data set
 * @param {specification} s Vega Lite specification
 * @return {function(object)} extent description
 */
const _extentDescription = s => {
	const disabled = extension(s, 'description')?.extent === false
	if (disabled || feature(s).hasLayers()) {
		return empty
	}
	const extents = calculateExtents(s)
	return d => {
		const endpoints = quantitativeChannels(s).map(channel => {
			const value = d => getTooltipField(s, channel)(d).value
			const endpoint = extents[channel].get(value(d))
			if (!endpoint) {
				return ''
			}
			return `${endpoint.type} value of ${s.encoding[channel].field} field`
		}).filter(Boolean)
		if (endpoints.length) {
			return fieldDelimiter + endpoints.join(fieldDelimiter)
		} else {
			return ''
		}
	}
}
const extentDescription = memoize(_extentDescription)

/**
 * written description of the encodings of a chart
 * @param {specification} s Vega Lite specification
 * @return {string} encoding description
 */
const encodingDescription = s => {
	if (!s.encoding) {
		return ''
	}
	if (extension(s, 'description')?.instructions === false) {
		return ''
	}
	let segments = []
	if (feature(s).isCircular()) {
		segments.push(`${encodingField(s, 'theta')}`)
		if (feature(s).hasRadius()) {
			segments.push(`and ${encodingField(s, 'radius')}`)
		}
	} else if (feature(s).isCartesian()) {
		const quantitative = quantitativeChannels(s).length
		if (quantitative === 1) {
			segments.push(`${encodingField(s, encodingChannelQuantitative(s))}`)
			if (feature(s).isTemporal()) {
				segments.push('over time')
			} else {
				segments.push(`by ${encodingField(s, encodingChannelCovariateCartesian(s))}`)
			}
		} else if (quantitative === 2) {
			segments.push(`${encodingField(s, 'x')} by ${encodingField(s, 'y')}`)
		}
	}
	if (feature(s).hasColor()) {
		segments.push(`split by ${encodingField(s, 'color')}`)
	}
	if (segments.length) {
		return `${segments.join(' ')}`
	}
}

/**
 * render a description into the DOM
 * @param {specification} s Vega Lite specification
 * @return {function(object)} mark description renderer
 */
const _markDescription = s => {
	return d => {
		if (s.mark.aria === false) {
			return
		}
		if (s.encoding.description) {
			return encodingValue(s, 'description')(datum(s, d))
		} else {
			return `${tooltipContent(s)(d)}${extentDescription(s)(d)}`
		}
	}
}
const markDescription = memoize(_markDescription)

/**
 * chart type
 * @param {specification} s Vega Lite specification
 * @return {string|null} chart type
 */
const chartType = s => {
	if (feature(s).hasLayers()) {
		return 'chart'
	} else if (feature(s).isBar()) {
		return 'bar chart'
	} else if (feature(s).isCircular()) {
		if (feature(s).hasRadius()) {
			return 'radial plot'
		}
		if (s.mark && s.mark.innerRadius) {
			return 'donut chart'
		} else {
			return 'pie chart'
		}
	} else if (feature(s).isLine()) {
		return 'line chart'
	} else if (feature(s).isArea()) {
		return 'area chart'
	} else if (feature(s).hasPoints && !feature(s).isLine() && feature(s).hasEncodingX() && feature(s).hasEncodingY()) {
		return 'scatterplot'
	}
	return null
}

/**
 * chart description
 * @param {specification} s Vega Lite specification
 * @return {string} chart description
 */
const chartDescription = s => {
	const segmentDelimiters = ['.', '!', '?']
	const type = chartType(s)
	const description = s.description
	const encoding = encodingDescription(s)
	const chart = type && encoding ? `${capitalize(type)} of ${encoding}` : type || encoding
	return [
		description,
		chart,
		instructions(s)
	]
		.filter(Boolean)
		.map(item => segmentDelimiters.includes(item.slice(-1)) ? item : `${item}.`)
		.join(' ')
}

/**
 * generate a string describing the keyboard navigation
 * @param {specification} s Vega Lite specification
 * @return {string} instructions
 */
const instructions = s => {
	if (extension(s, 'description')?.instructions === false) {
		return ''
	}
	return [
		'Use the arrow keys to navigate',
		feature(s).hasLinks() ? ' and press the Enter key to open links' : ''
	].join('')
}

/**
 * chart name which includes title and subtitle
 * @param {specification} s Vega Lite specification
 * @return {string} chart title
 */
const chartLabel = s => {
	if (typeof s.title === 'string') {
		throw new Error('specification title must be an object with a text property, not a string')
	}
	if (!s.title.text) {
		throw new Error('specification title is required')
	}
	return `${[s.title.text, s.title.subtitle].filter(Boolean).join(' - ')}`
}

/**
 * text description of axis values
 * @param {specification} s Vega Lite specification
 * @param {cartesian} channel encoding channel
 * @return {string} values description
 */
const axisValuesText = (s, channel) => {
	const values = parseScales(s)[channel].domain()
	const formatter = encodingType(s, channel) === 'temporal' ? formatAxis(s, channel) : identity
	if (isContinuous(s, channel)) {
		return `with values from ${d3.extent(values).map(formatter).join(' to ')}`
	} else {
		return `with ${values.length} values: ${list(values.map(formatter))}`
	}
}

const scaleDescriptions = {
	pow: 'exponential',
	sqrt: 'square root',
	symlog: 'symmetric log',
	log: 'logarithmic'
}

/**
 * written description of a scale
 * @param {specification} s Vega Lite specification
 * @param {cartesian} channel encoding channel
 * @return {string} scale description
 */
const scaleDescription = (s, channel) => {
	if (encodingType(s, channel) !== 'quantitative') {
		return ''
	}
	const type = scaleType(s, channel)
	if (!type) {
		return 'linear'
	} else if (type && scaleDescriptions[type]) {
		return scaleDescriptions[type]
	} else if (type) {
		return type
	}
}

/**
 * written description of an axis
 * @param {specification} s Vega Lite specification
 * @param {cartesian} channel encoding channel
 * @return {string} axis description
 */
const axisDescription = (s, channel) => {
	if (s.encoding[channel].axis?.description) {
		return s.encoding[channel].axis?.description
	}
	const segments = [
		`${channel} axis`,
		`titled '${axisTitle(s, channel)}'`,
		`for ${[scaleDescription(s, channel), encodingType(s, channel)].filter(Boolean).join(' ')} scale`,
		axisValuesText(s, channel)
	]
	return segments.join(' ')
}

export { markDescription, chartLabel, chartDescription, axisDescription }
