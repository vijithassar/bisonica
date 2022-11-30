import * as d3 from 'd3'

import { encodingField, encodingType, encodingValue } from './encodings.js'
import { feature } from './feature.js'

/**
 * round number based on significant digits
 * @param {number} number number
 * @returns {string} rounded number as string with SI suffix
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
 * look up data values attached to specification
 * @param {object} s Vega Lite specification
 * @returns {array}
 */
const values = s => {
	return s.data?.values.slice()
}

/**
 * return the original data object if it has been nested
 * by a layout generator
 * @param {object} s Vega Lite specification
 * @param {object} d datum, which may or may not be nested
 * @returns {object} datum
 */
const datum = (s, d) => {
	if (feature(s).isCircular() && d.data) {
		return d.data
	}

	return d
}

/**
 * look up a value from an object using dot notation
 * @param {object} d datum
 * @param {string} key multiple dot-delimited lookup keys
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
 * get the string used when there's no appropriate name for a series
 * @returns {string} series name
 */
const missingSeries = () => '_'

/**
 * look up the URL attached to a datum
 * @param {object} s Vega Lite specification
 * @param {object} d datum, which may or may not be nested
 * @returns {string} url
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
 * @returns {string} mark name
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
 * convert a string to machine-friendly key
 * @param {string} string input string
 * @returns {string} kebab case string
 */
const key = string => string?.toLowerCase().replace(/ /g, '-')

/**
 * convert radians to degrees
 * @param {number} radians angle in radians
 * @returns {number} angle in degrees
 */
const degrees = radians => (radians * 180) / Math.PI

/**
 * test whether a channel is continuous
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {boolean}
 */
const isContinuous = (s, channel) => {
	return ['temporal', 'quantitative'].includes(encodingType(s, channel))
}

/**
 * test whether a channel is discrete
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {boolean}
 */
const isDiscrete = (s, channel) => {
	return ['nominal', 'ordinal'].includes(encodingType(s, channel))
}

/**
 * determine whether DOM nodes overlap
 * @param {array} nodes DOM nodes
 * @returns {boolean} overlap
 */
const overlap = nodes => {
	return [...nodes].some((node, index) => {
		if (index === nodes.length - 1) {
			return false
		}
		const a = node.getBoundingClientRect()
		const b = nodes[index + 1]?.getBoundingClientRect()
		const overlap = !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)

		return overlap
	})
}

/**
 * convert polar coordinates to Cartesian
 * @param {number} radius radius
 * @param {number} angle angle in radians
 * @returns {object} equivalent Cartesian coordinates
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
 *
 * @returns {function(object)} rendering function which uses detached node
 */
const detach = (fn, ...rest) => {
	return selection => {
		const tag = selection.node().tagName
		const namespace = tag === 'g' ? 'svg' : 'html'
		const detached = d3.create(`${namespace}:${tag}`)
		detached.call(fn, ...rest)
		selection.append(() => detached.node())
	}
}

export {
	abbreviateNumbers,
	mark,
	values,
	datum,
	nested,
	missingSeries,
	getUrl,
	noop,
	identity,
	key,
	degrees,
	isContinuous,
	isDiscrete,
	overlap,
	polarToCartesian,
	detach
}
