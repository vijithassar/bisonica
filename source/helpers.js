/**
 * general utilities
 * @module helpers
 */

import * as d3 from 'd3'

import { encodingField, encodingType, encodingValue } from './encodings.js'
import { feature } from './feature.js'

/**
 * round number based on significant digits
 * @param {number} number number
 * @return {string} rounded number as string with SI suffix
 */
const abbreviateNumbers = number => {
	if (number < 10 && Number.isInteger(number)) {
		return `${number}`
	} else if (number < 10 && !Number.isInteger(number)) {
		return d3.format('.1f')(number)
	} else if (number > 10) {
		return d3.format('.2s')(number)
	}
}

/**
 * return the original data object if it has been nested
 * by a layout generator
 * @param {object} s Vega Lite specification
 * @param {object} d datum, which may or may not be nested
 * @return {object} datum
 */
const datum = (s, d) => {
	if (feature(s).isCircular() && d.data) {
		return d.data
	}

	return d
}

/**
 * look up a value from an object using dot notation or
 * set to a new value
 * @param {object} d datum
 * @param {string} key multiple dot-delimited lookup keys
 * @param {string|number|null|object} [newValue] new value to set
 */
const nested = function(d, key, newValue) {
	let keys = key.split('.').reverse()

	// get
	if (arguments.length === 2) {
		let value = d
		while (keys.length) {
			value = value[keys.pop()]
		}
		return value
	}

	// set
	if (arguments.length === 3) {
		let value = newValue
		while (keys.length) {
			value = { [keys.pop()]: value }
		}
		return value
	}
}

/**
 * create a function which ensures channels have
 * unique fields
 * @param {object} s Vega Lite specification
 * @return {function(array)} deduplication function
 */
const deduplicateByField = s => {
	const fields = Object.entries(s.encoding).map(([_, definition]) => definition?.field).filter(Boolean)
	const unique = [...new Set(fields).values()]
	return channels => {
		const allowed = unique.reduce((accumulator, current) => {
			accumulator[current] = true
			return accumulator
		}, {})
		let result = []
		channels
			.forEach(channel => {
				const field = s.encoding[channel]?.field
				if (allowed[field]) {
					result.push(channel)
					allowed[field] = false
				}
			})
		return result
	}
}

/**
 * get the string used when there's no appropriate name for a series
 * @return {string} series name
 */
const missingSeries = () => '_'

/**
 * look up the URL attached to a datum
 * @param {object} s Vega Lite specification
 * @param {object} d datum, which may or may not be nested
 * @return {string} url
 */
const getUrl = (s, d) => {
	if (s.mark.href) {
		return s.mark.href
	}
	if (s.encoding.href.value) {
		return s.encoding.href.value
	}
	const field = encodingField(s, 'href')
	return d?.data?.[missingSeries()]?.[field] || d?.data?.[field] || encodingValue(s, 'href')(d)
}

/**
 * look up the mark name from either a simple string
 * or the type property of a mark specification object
 * @param {object} s Vega Lite specification
 * @return {string} mark name
 */
const mark = s => {
	if (typeof s.mark === 'string') {
		return s.mark
	} else if (typeof s.mark === 'object') {
		return s.mark.type
	}
}

/**
 * does not do anything; occasionally useful to ensure a function is
 * returned consistently from a factory or composition
 */
const noop = () => {
	return
}

/**
 * returns the input; occasionally useful for composition
 */
const identity = x => x

/**
 * convert an identifier to machine-friendly key
 * @param {string|number} id identifier
 * @return {string} kebab case string
 */
const key = id => `${id}`.toLowerCase().replace(/ /g, '-')

/**
 * convert radians to degrees
 * @param {number} radians angle in radians
 * @return {number} angle in degrees
 */
const degrees = radians => (radians * 180) / Math.PI

/**
 * test whether a channel is continuous
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {boolean}
 */
const isContinuous = (s, channel) => {
	return ['temporal', 'quantitative'].includes(encodingType(s, channel))
}

/**
 * test whether a channel is discrete
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @return {boolean}
 */
const isDiscrete = (s, channel) => {
	return ['nominal', 'ordinal'].includes(encodingType(s, channel))
}

/**
 * determine whether a given channel is text based
 * @param {string} channel encoding parameter
 * @return {boolean} whether the field is text based
 */
const isTextChannel = channel => {
	return ['href', 'text', 'tooltip', 'description', 'url'].includes(channel)
}

/**
 * convert polar coordinates to Cartesian
 * @param {number} radius radius
 * @param {number} angle angle in radians
 * @return {object} equivalent Cartesian coordinates
 */
const polarToCartesian = (radius, angle) => {
	return { x: radius * Math.cos(angle), y: radius * Math.sin(angle) }
}

/**
 * run a rendering function using a detached node
 * and then transfer the results to the original
 * selection
 *
 * this will not work properly if the rendering function
 * depends on accurate DOM measurements or reflow, such as
 * by using scrollTop or .getBoundingClientRect()
 * @return {function(object)} rendering function which uses detached node
 */
const detach = (fn, ...rest) => {
	return selection => {
		const tag = selection.node().tagName.toLowerCase()
		try {
			const namespace = tag === 'g' ? 'svg' : 'html'
			const detached = d3.create(`${namespace}:${tag}`)
			detached.call(fn, ...rest)
			selection.append(() => detached.node())
		} catch (error) {
			const identifier = fn.name ? `function ${fn.name}()` : 'function'
			error.message = `could not run ${identifier} with detached <${tag}> node - ${error.message}`
			throw error
		}
	}
}

/**
 * alias methods from a source onto a target
 * @param {string[]} methods
 * @param {object|function} source
 * @param {object|function} target
 */
const copyMethods = (methods, source, target) => {
	methods.forEach(method => {
		target[method] = source[method]
	})
}

/**
 * convert kebab-case string to camelCase
 * @param {string} kebab kebab case string
 * @return camelCase string
 */
const kebabToCamel = kebab => {
	return kebab
		.split('-')
		.map((segment, index) => {
			if (index === 0) {
				return segment
			} else {
				return segment.slice(0, 1).toUpperCase() + segment.slice(1)
			}
		})
		.join('')
}

export {
	abbreviateNumbers,
	mark,
	datum,
	nested,
	deduplicateByField,
	missingSeries,
	getUrl,
	noop,
	identity,
	key,
	degrees,
	isContinuous,
	isDiscrete,
	isTextChannel,
	polarToCartesian,
	detach,
	copyMethods,
	kebabToCamel
}
