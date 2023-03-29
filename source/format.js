import { memoize } from './memoize.js'
import { identity, noop } from './helpers.js'
import { encodingType } from './encodings.js'

import * as d3 from 'd3'

/**
 * create a time formatting function
 * @param {object|undefined} format d3 time format string
 * @returns {function(Date)} date formatting function
 */
const timeFormat = format => {
	if (!format) {
		return date => date.toString()
	}
	return d3.timeFormat(format)
}

/**
 * create a time formatting function in UTC
 * @param {object|undefined} format d3 time format string
 * @returns {function(Date)} UTC date formatting function
 */
const utcFormat = format => {
	if (!format) {
		return date => date.toUTCString()
	}
	return d3.utcFormat(format)
}

/**
 * create a number formatting function
 * @param {object|undefined} format d3 number format string
 * @returns {function(number)} number formatting function
 */
const numberFormat = format => {
	if (!format) {
		return number => number.toString()
	}
	return d3.format(format)
}

/**
 * create a formatting function
 * @param {object} config encoding or axis definition object
 * @returns {function(string|number|Date)} formatting function
 */
const _format = config => {
	if (!config || (!config.format && !config.axis?.format)) {
		return identity
	}
	const time = config.type === 'temporal' || config.formatType === 'time' || config.timeUnit
	const format = config.format || config.axis.format
	if (time) {
		const utc = !!config.timeUnit?.startsWith('utc')
		if (utc) {
			return utcFormat(format)
		} else {
			return timeFormat(format)
		}
	} else {
		return numberFormat(format)
	}
}
const format = memoize(_format)

/**
 * get formatting function for an encoding channel
 * @param {object} s Vega Lite specification
 * @param {'text'|'tooltip'} channel encoding channel
 */
const formatChannel = (s, channel) => {
	return format(s.encoding[channel])
}

/**
 * get formatting function for an axis, and fall back
 * to the encoding channel definition if necessary
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 */
const formatAxis = (s, channel) => {
	const config = s.encoding[channel].axis
	if (config === null) {
		return noop
	}
	// sidestep the format() wrapper function in cases where
	// the time encoding is specified at the channel level
	// instead of with axis.type
	if (encodingType(s, channel) === 'temporal' && !config.formatType) {
		return timeFormat(config.format)
	} else {
		return format(config)
	}
}

export { format, formatChannel, formatAxis }
