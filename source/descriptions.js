import * as d3 from 'd3'
import { datum, identity, isContinuous } from './helpers.js'
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
import { getTimeFormatter } from './time.js'
import { list } from './text.js'

const delimiter = '; '

const quantitativeChannels = s => {
	const result = Object.keys(s.encoding)
		.filter(channel => encodingType(s, channel) === 'quantitative')
	return result
}

/**
 * calculate minimum and maximum value for
 * each quantitative channel
 * @param {object} s Vega Lite specification
 * @returns {object} extents
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
 * @returns {string} empty string
 */
const empty = () => ''

/**
 * render descriptive text highlighting the minimum
 * and maximum values in the data set
 * @param {object} s Vega Lite specification
 * @returns {function(object)} extent description
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
			return delimiter + endpoints.join(delimiter)
		} else {
			return ''
		}
	}
}
const extentDescription = memoize(_extentDescription)

/**
 * written description of the encodings of a chart
 * @param {object} s Vega Lite specification
 * @returns {string} encoding description
 */
const encodingDescription = s => {
	let segments = []
	if (feature(s).isCircular()) {
		segments.push(`${encodingField(s, encodingChannelQuantitative(s))}`)
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
		return `of ${segments.join(' ')}`
	}
}

/**
 * render a description into the DOM
 * @param {object} s Vega Lite specification
 * @returns {function(object)} mark description renderer
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
 * @param {object} s Vega Lite specification
 * @returns {string|null} chart type
 */
const chartType = s => {
	if (feature(s).hasLayers()) {
		return 'chart'
	} else if (feature(s).isBar()) {
		return 'bar chart'
	} else if (feature(s).isCircular()) {
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
 * @param {object} s Vega Lite specification
 * @returns {string} chart description
 */
const chartDescription = s => {
	return [chartType(s), s.encoding && encodingDescription(s)].filter(Boolean).join(' ')
}

/**
 * generate a string describing the keyboard navigation
 * @param {object} s Vega Lite specification
 * @returns {string} instructions
 */
const instructions = s => {
	if (extension(s, 'description')?.instructions === false) {
		return ''
	}
	return [
		'Use the arrow keys to navigate',
		feature(s).hasLinks() ? ' and press the Enter key to open links' : '',
		'.'
	].join('')
}

/**
 * chart name which includes title and subtitle
 * @param {object} s Vega Lite specification
 * @returns {string} chart title
 */
const chartLabel = s => {
	if (!s.title.text) {
		throw new Error('specification title is required')
	}
	if (s.description) {
		return s.description
	} else {
		return `${[s.title.text, s.title.subtitle].filter(Boolean).join(' - ')}. ${instructions(s)}`
	}
}

/**
 * text description of axis values
 * @param {object} s Vega Lite specification
 * @param {'x'|'y'} channel encoding channel
 * @returns {string} values description
 */
const axisValuesText = (s, channel) => {
	const values = parseScales(s)[channel].domain()
	const formatter = encodingType(s, channel) === 'temporal' ? getTimeFormatter(s, channel) : identity
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
 * @param {object} s Vega Lite specification
 * @param {'x'|'y'} channel encoding channel
 * @returns {string} scale description
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
 * @param {object} s Vega Lite specification
 * @param {'x'|'y'} channel encoding channel
 * @returns {string} axis description
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
