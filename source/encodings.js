/** @module encodings */

import { feature } from './feature.js'
import { memoize } from './memoize.js'
import { isTemporalScale, isOrdinalScale, isQuantitativeScale, parseScales } from './scales.js'
import { parseTime } from './time.js'
import { transformDatum } from './transform.js'
import { isTextChannel, nested } from './helpers.js'

/**
 * look up the field used for a visual encoding
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {string} encoding field
 */
const encodingField = (s, channel) => {
	return s.encoding?.[channel]?.field || s.facet?.[channel]?.field
}

/**
 * look up the data type used for an encoding in the s
 * (these are types of data sets, not JavaScript primitive types)
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {('nominal'|'ordinal'|'quantitative'|'temporal')} encoding type
 */
const encodingType = (s, channel) => {
	return s.encoding?.[channel]?.type || encodingTypeDefault(s, channel)
}

/**
 * create a function which looks up the data value used for
 * a visual encoding
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {function(object)}
 */
const encodingValue = (s, channel) => {
	const key = encodingField(s, channel)
	const nesting = key && key.includes('.')
	return d => {
		if (!nesting && d[key] !== undefined) {
			return d[key]
		} else if (nesting) {
			return nested(d, key)
		}

		if (s.transform) {
			return transformDatum(s)(d)[key]
		}
	}
}

/**
 * determine which channel is used for quantitative encoding
 * @param {object} s Vega Lite specification
 * @returns {string} visual encoding channel
 */
const encodingChannelQuantitative = s => {
	const test = channel => encodingType(s, channel) === 'quantitative'

	return encodingTest(s, test)
}

/**
 * create a function which looks up the data value used for
 * the quantitative visual encoding
 * @param {object} s Vega Lite specification
 * @returns {function(object)}
 */
const encodingValueQuantitative = s => {
	return encodingValue(s, encodingChannelQuantitative(s))
}

/**
 * default encoding types
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {string} default encoding type
 */
const _encodingTypeDefault = (s, channel) => {
	const channelDefinition = s.encoding?.[channel]
	if (!channelDefinition) {
		return null
	}
	// quantitative
	if (channelDefinition.bin) {
		return 'quantitative'
	}
	if (channelDefinition.aggregate && !['argmin', 'argmax'].includes(channelDefinition.aggregate)) {
		return 'quantitative'
	}
	if (isQuantitativeScale(s, channel)) {
		return 'quantitative'
	}
	// temporal
	if (channelDefinition.timeUnit || isTemporalScale(s, channel)) {
		return 'temporal'
	}
	// ordinal
	if (channelDefinition.sort || isOrdinalScale(s, channel) || encodingField(s, channel) === 'order') {
		return 'ordinal'
	}
	// constant values
	if (channelDefinition.datum) {
		switch (typeof channelDefinition.datum) {
		case 'number':
			return 'quantitative'
		case 'string':
			return 'nominal'
		// this should be a datetime object
		// specifically, not any object
		case 'object':
			return 'temporal'
		}
	}
	// field default
	if (channelDefinition.field) {
		return 'nominal'
	}
}
const encodingTypeDefault = memoize(_encodingTypeDefault)

/**
 * determine which channel matches a predicate function
 * @param {object} s Vega Lite specification
 * @param {function} test test
 * @returns {string} visual encoding channel
 */
const _encodingTest = (s, test) => {
	const encodings = Object.entries(s.encoding).filter(([channel, definition]) => {
		return test(channel, definition)
	})

	if (encodings.length === 1) {
		return encodings[0][0]
	}

	if (encodings.length === 2) {
		const baseEncodings = new Set([0, 1].map(index => encodings[index][0].slice(0, 1)))
		if (baseEncodings.size === 1) {
			return [...baseEncodings.values()][0]
		}
	}

	if (encodings.length === 0) {
		throw new Error('no channels match test function')
	}

	if (encodings.length > 1) {
		const list = encodings.map(encoding => encoding[0]).join(', ')

		throw new Error(`multiple channels (${list}) match test function`)
	}
}
const encodingTest = memoize(_encodingTest)

/**
 * determine which channel is used for the independent variable
 * @param {object} s Vega Lite specification
 * @returns {string} visual encoding channel
 */
const encodingChannelCovariate = s => {
	if ((feature(s).isCircular() || feature(s).isLinear()) && feature(s).hasColor()) {
		return 'color'
	} else if (feature(s).isCartesian()) {
		const filter = channel => {
			return isTextChannel(channel) === false &&
				channel !== 'color' &&
				encodingType(s, channel) !== 'quantitative'
		}
		const covariate = Object.keys(s.encoding).filter(filter)

		if (covariate.length !== 1) {
			throw new Error(`could not identify independent variable between ${covariate.join(', ')}`)
		}

		return covariate.pop()[0]
	}
}

/**
 * determine which channel of a Cartesian specification object
 * is secondary to the quantitative channel
 * @param {object} s Vega Lite specification
 * @returns {string} visual encoding chanel
 */
const encodingChannelCovariateCartesian = s => {
	const channel = ['x', 'y'].find(channel => channel !== encodingChannelQuantitative(s))
	if (channel) {
		return channel
	} else {
		const message = feature(s).isCartesian() ? 'could not determine Cartesian covariate encoding' : 'specification is not Cartesian'
		throw new Error(message)
	}
}

/**
 * bundle together an accessor and an encoder function
 * into an encoder function
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @param {function} accessor accessor function
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} encoder function
 */
const _encoder = (s, channel, accessor, dimensions) => {
	const scales = parseScales(s, dimensions)
	return d => {
		const scale = scales[channel]

		if (s.encoding[channel]?.value) {
			return scale()
		}

		const value = encodingType(s, channel) === 'temporal' ? parseTime(accessor(d)) : accessor(d)

		if (accessor && scale === undefined) {
			throw new Error(`accessor function ${channel}() is missing corresponding scale function`)
		}

		if (d === undefined && value !== null) {
			throw new Error(`datum for ${channel} is undefined`)
		}

		if (typeof scale !== 'function') {
			throw new Error(`scale function for ${channel} is not available`)
		}

		if (value === undefined && feature(s).isMulticolor()) {
			throw new Error(`data value for ${channel} is undefined`)
		}

		const encoded = scale(value)

		if (encoded === undefined) {
			if (encodingType(s, channel) === 'quantitative') {
				return 0
			} else {
				throw new Error(`encoded value for ${channel} is undefined`)
			}
		}

		if (Number.isNaN(encoded)) {
			throw new Error(`encoded value for ${channel} is not a number (NaN)`)
		}

		return encoded
	}
}
const encoder = memoize(_encoder)

/**
 * generate a set of complex encoders
 * @param {object} s Vega Lite specification
 * @param {object} dimensions desired dimensions of the chart
 * @param {object} accessors hash of data accessor functions
 * @returns {object} hash of encoder functions with complex data
 * lookup suitable for use as d3 callbacks
 */
const createEncoders = (s, dimensions, accessors) => {
	const result = {}
	Object.keys(accessors).forEach(channel => {
		result[channel] = encoder(s, channel, accessors[channel], dimensions)
	})

	return result
}

export {
	encodingField,
	encodingValue,
	encodingType,
	encodingChannelQuantitative,
	encodingChannelCovariate,
	encodingChannelCovariateCartesian,
	createEncoders,
	encodingValueQuantitative
}
