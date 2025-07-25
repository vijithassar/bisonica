/**
 * convert data values to visual attributes
 * @module scales
 * @see {@link module:accessors}
 * @see {@link module:encodings}
 * @see {@link https://vega.github.io/vega-lite/docs/scale.html|vega-lite:scale}
 */

import './types.d.js'

import * as d3 from 'd3'
import { extendError } from './error.js'

import { data, stackOffset, sumByCovariates } from './data.js'
import { values } from './values.js'
import { colors } from './color.js'
import { encodingChannelQuantitativeCartesian, encodingType, encodingValue } from './encodings.js'
import { feature } from './feature.js'
import { identity, isContinuous, isDiscrete, isTextChannel } from './helpers.js'
import { memoize } from './memoize.js'
import { parseTime, temporalBarDimensions } from './time.js'
import { sorter } from './sort.js'
import { step } from './marks.js'

const defaultDimensions = { x: 0, y: 0 }

/**
 * make a normal function appear to be a scale function
 * by adding domain and range methods
 * @param {function} scale scale function
 * @param {array} domain scale domain
 * @param {array} range scale range
 * @return {function} scale function with mocked domain and range
 */
const syntheticScale = (scale, domain, range) => {
	return Object.assign(scale, { domain: () => domain, range: () => range })
}

/**
 * parse scale types which have been explicitly specified
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {string|null}
 */
const explicitScale = (s, channel) => {
	if (s.encoding[channel]?.scale === null) {
		return null
	} else {
		if (channel === 'size') {
			return 'scaleSqrt'
		}
		const type = scaleType(s, channel)
		return `scale${type.slice(0, 1).toUpperCase() + type.slice(1)}`
	}
}

/**
 * scale type lookup
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {string} scale type
 */
const scaleType = (s, channel) => {
	return s.encoding[channel]?.scale?.type
}

/**
 * determine the d3 method name of the scale function to
 * generate for a given dimension of visual encoding
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {string|null} d3 scale type
 */
const scaleMethod = (s, channel) => {
	if (scaleType(s, channel) || s.encoding[channel]?.scale === null) {
		return explicitScale(s, channel)
	}
	let methods = {
		temporal: 'scaleUtc',
		nominal: 'scaleOrdinal',
		quantitative: 'scaleLinear',
		ordinal: 'scaleOrdinal'
	}

	let method

	if (['x', 'y'].includes(channelRoot(channel)) && isDiscrete(s, channel)) {
		if (feature(s).isBar()) {
			method = 'scaleBand'
		} else {
			method = 'scalePoint'
		}
	} else {
		method = methods[encodingType(s, channel)]
	}
	if (typeof d3[method] === 'function') {
		return method
	} else {
		throw new Error(
			`could not determine scale method for ${channel} channel because encoding type is ${encodingType(s, channel)}`
		)
	}
}

/**
 * get the specified domain from a specification
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {array} domain
 */
const customDomain = (s, channel) => {
	const domain = s.encoding[channel]?.scale?.domain

	if (domain) {
		if (encodingType(s, channel) === 'temporal') {
			return domain.map(parseTime)
		} else {
			return domain
		}
	}
}

/**
 * sanitize channel name
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {number} number of data categories
 */
const categoryCount = (s, channel) => {
	let rangeProcessor

	if (feature(s).isRule()) {
		rangeProcessor = identity
	} else {
		rangeProcessor = data
	}
	return (customDomain(s, channel) || rangeProcessor(s)).length
}

/**
 * sanitize channel name
 * @param {string} channel encoding channel
 * @return {string} encoding channel
 */
const channelRoot = channel => {
	return channel.endsWith('2') ? channel.slice(0, -1) : channel
}

/**
 * determine whether a scale starts at zero
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {boolean} whether to start the scale at zero
 */
const zero = (s, channel) => {
	if (encodingType(s, channel) === 'temporal' || scaleType(s, channel) === 'log') {
		return false
	}
	if (s.encoding[channel]?.scale?.zero) {
		return !!s.encoding[channel].scale.zero
	}
	return ['x', 'y'].includes(channel) && !!customDomain(s, channel)
}

/**
 * baseline for an axis
 * @param {specification} s Vega Lite specification
 * @param {cartesian} channel visual encoding
 * @return {number[]}
 */
const baseline = (s, channel) => {
	return d3.min([0, ...values(s).map(encodingValue(s, channel))])
}

/**
 * compute raw values for scale domain
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {number[]|string[]} domain
 */
const domainBaseValues = (s, channel) => {
	const type = encodingType(s, channel)

	if (channel === 'color') {
		const colors = Array.from(new Set(values(s).map(encodingValue(s, 'color'))))

		return colors
	}

	if (type === 'temporal') {
		const date = d => parseTime(encodingValue(s, channel)(d)).getTime()

		return d3.extent(values(s), date)
	} else if (type === 'nominal' || type === 'ordinal') {
		return [...new Set(values(s).map(item => encodingValue(s, channel)(item)))]
	} else if (type === 'quantitative') {
		if (channel === 'theta') {
			return [0, 360]
		}

		let min
		let max

		if (feature(s).isBar() || feature(s).isArea()) {
			if (channel === 'x' || channel === 'y') {
				min = baseline(s, channel)
			}
			if (stackOffset(s) === 'normalize') {
				max = 1
			} else if (stackOffset(s) === 'center') {
				max = d3.max(d3.extent(sumByCovariates(s)).map(Math.abs)) * 0.5
				min = max * -1
			} else {
				max = d3.max(sumByCovariates(s))
			}
		} else if (feature(s).isLine()) {
			const byPeriod = data(s)
				.map(item => item.values)
				.flat()
			const accessor = d => +d.value
			const periodMin = d3.min(byPeriod, accessor)

			if (zero(s, channel)) {
				min = 0
			} else {
				min = periodMin
			}

			max = d3.max(byPeriod, accessor)
		} else {
			min = 0
			max = d3.max(values(s), encodingValue(s, channel))
		}

		return [min, max]
	} else {
		return d3.extent(values(s), item => encodingValue(s, channel)(item))
	}
}

/**
 * adjust a domain by substituting explicit values
 * if they are included in the specification
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {function(array)} domain adjustment function
 */
const adjustDomain = (s, channel) => {
	const scale = s.encoding?.[channel]?.scale
	if (!scale || !isContinuous(s, channel)) {
		return identity
	}
	return domain => {
		if (scale?.domainMin) {
			domain[0] = scale?.domainMin
		}
		if (scale?.domainMax) {
			domain[1] = scale?.domainMax
		}
		return domain
	}
}

/**
 * sort the domain
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {function(array)}
 */
const domainSort = (s, channel) => {
	if (!s.encoding[channel].sort || s.encoding[channel].sort === null) {
		return identity
	}

	return domain => domain.slice().sort(sorter(s, channel))
}

/**
 * compute domain
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 */
const domain = (s, channel) => {
	return customDomain(s, channel) || domainSort(s, channel)(adjustDomain(s, channel)(domainBaseValues(s, channel)))
}

/**
 * compute cartesian range
 * @param {specification} s Vega Lite specification
 * @param {cartesian} channel encoding channel
 * @return {function(object)} function which computes Cartesian range
 */
const cartesianRange = (s, channel) => {
	return dimensions => {
		let result

		if (isDiscrete(s, channel) && !['scaleBand', 'scalePoint'].includes(scaleMethod(s, channel))) {
			const count = domain(s, channel).length
			const interval = dimensions[channel] / count

			const positions = Array.from({ length: count }).map((item, index) => index * interval)

			result = positions
		} else {
			const start = baseline(s, channel)
			const end = feature(s).isTemporalBar() ? temporalBarDimensions(s, dimensions)[channel] : dimensions[channel]
			result = [start, end]
		}

		if (channel === 'y' && encodingType(s, channel) === 'quantitative') {
			result.reverse()
		}

		return result
	}
}

/**
 * compute scale range
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @param {string} _channel visual encoding
 * @return {number[]} range
 */
const range = (s, dimensions, _channel) => {
	const channel = channelRoot(_channel)
	const scale = s.encoding[channel].scale

	const ranges = {
		x: () => cartesianRange(s, 'x')(dimensions),
		y: () => cartesianRange(s, 'y')(dimensions),
		color: () => {
			if (s.encoding.color?.scale?.range) {
				return s.encoding.color.scale.range
			} else {
				return colors(s, categoryCount(s, channel))
			}
		},
		theta: () => [0, Math.PI * 2],
		detail: () => {
			return s.encoding.detail?.scale?.range || Array.from({ length: categoryCount(s, channel) }).map(() => null)
		},
		yOffset: () => [step(s, dimensions).y, 0],
		xOffset: () => [0, step(s, dimensions).x],
		size: () => {
			let min = 0
			let max
			if (feature(s).isBar()) {
				if (isDiscrete(s, channel)) {
					max = 2
				} else {
					max = 5
				}
			} else if (feature(s).isText()) {
				max = 11
			} else {
				max = 30
			}
			return [min, max]
		},
		radius: () => [0, 100]
	}

	try {
		let range

		if (scale?.range?.field) {
			range = [...new Set(values(s).map(item => item[scale.range.field]))]
		} else {
			range = ranges[channel]()
		}

		if (isContinuous(s, channel)) {
			if (scale?.rangeMin) {
				range[0] = scale?.rangeMin
			}
			if (scale?.rangeMax) {
				range[1] = scale?.rangeMax
			}
		}

		if (s.encoding[channel].reverse) {
			range.reverse()
		}

		return range
	} catch (error) {
		extendError(`could not determine scale range for ${channel} channel`)
	}
}

/**
 * generate scale functions described by the
 * specification's encoding section
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {object} hash of d3 scale functions
 */
const coreScales = (s, dimensions) => {
	if (typeof s.encoding !== 'object') {
		return
	}

	const scales = {}

	Object.entries(s.encoding).forEach(([channel, definition]) => {
		if (definition === null) {
			return
		}

		if (definition !== null && definition.value) {
			scales[channel] = () => definition.value
		}

		if ((definition.datum && isTextChannel(channel)) || (feature(s).isImage() && channel === 'url')) {
			scales[channel] = identity
		}
	})

	Object.keys(s.encoding)
		.filter(channel => !isTextChannel(channel) && !scales[channel])
		.forEach(channel => {
			try {
				const method = scaleMethod(s, channelRoot(channel))
				if (method === null) {
					scales[channel] = syntheticScale(identity, domain(s, channel), range(s, dimensions, channel))
				} else {
					const scale = d3[method]().domain(domain(s, channel)).range(range(s, dimensions, channel))

					if (method === 'scaleLinear') {
						scale.nice()
					}

					scales[channel] = scale
				}
			} catch (error) {
				extendError(error, `could not generate ${channel} scale`)
			}
		})

	if (!scales.color && !feature(s).isMulticolor()) {
		scales.color = () => colors(s, 1).pop()
	}

	return scales
}

/**
 * determine whether a specification describes a chart that
 * will require scale functions beyond the ones listed directly
 * in the s's encoding section
 * @param {specification} s Vega Lite specification
 * @return {string[]} additional scale functions required
 */
const detectScaleExtensions = s => {
	const extensions = []

	if (feature(s).isBar() || feature(s).isArea()) {
		extensions.push('length')
		extensions.push('start')
	}

	if (feature(s).isText() && !s.mark.text && s.encoding.text.field) {
		extensions.push('text')
	}

	return extensions
}

/**
 * generate additional necessary scale functions beyond those
 * described in the s's encoding section
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @param {object} scales a hash of the core scale functions
 * @return {object} hash of extended d3 scale functions
 */
const extendScales = (s, dimensions, scales) => {
	const extendedScales = { ...scales }
	const extensions = detectScaleExtensions(s)

	if (extensions.includes('length')) {
		extendedScales.length = d => {
			const channel = encodingChannelQuantitativeCartesian(s)
			if (extendedScales[channel].domain().every(endpoint => endpoint === 0)) {
				return 0
			}

			const positive = d > 0
			const value = extendedScales[channel](d)
			const zero = extendedScales[channel](0)
			if (channel === 'y') {
				if (positive) {
					return zero - value
				} else {
					return Math.abs(value) - zero
				}
			} else if (channel === 'x') {
				if (positive) {
					return value - zero
				} else {
					return Math.abs(value)
				}
			}
		}
	}

	if (extensions.includes('start')) {
		extendedScales.start = d => {
			const channel = encodingChannelQuantitativeCartesian(s)
			if (feature(s).isStacked()) {
				if (channel === 'y') {
					return extendedScales[channel](d[0]) - extendedScales.length(d[1] - d[0])
				} else if (channel === 'x') {
					return extendedScales[channel](d[0])
				}
			} else {
				const length = extendedScales.length(d[1] - d[0])
				if (channel === 'y') {
					const flip = d[1] > d[0] ? 1 : 0
					const offset = length * flip
					return extendedScales.y(0) - offset
				} else if (channel === 'x') {
					const offset = d[1] > d[0] ? 0 : length
					return extendedScales.x(0) - offset
				}
			}
		}
	}

	if (extensions.includes('text')) {
		extendedScales.text = d => `${d}`
	}

	return extendedScales
}

const _parseScales = (s, dimensions = defaultDimensions) => {
	const core = coreScales(s, dimensions)
	const extended = extendScales(s, dimensions, core)

	return extended
}

/**
 * determine whether an encoding uses a time scale
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {boolean}
 */
const isTemporalScale = (s, channel) => {
	return ['time', 'utc'].includes(scaleType(s, channel))
}

/**
 * determine whether an encoding uses an ordinal scale
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {boolean}
 */
const isOrdinalScale = (s, channel) => {
	return ['ordinal', 'point', 'band'].includes(scaleType(s, channel))
}

/**
 * determine whether an encoding uses an ordinal scale
 * @param {specification} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {boolean}
 */
const isQuantitativeScale = (s, channel) => {
	return ['linear', 'pow', 'sqrt', 'symlog', 'log'].includes(scaleType(s, channel))
}

/**
 * generate all scale functions necessary to render a s
 * @param {specification} s Vega Lite specification
 * @param {object} [dimensions] chart dimensions
 * @return {object} hash of all necessary d3 scale functions
 */
const parseScales = memoize(_parseScales)

export { categoryCount, colors, isTemporalScale, isOrdinalScale, isQuantitativeScale, scaleType, parseScales }
