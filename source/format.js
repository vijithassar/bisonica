import { memoize } from './memoize.js'
import { identity } from './helpers.js'
import * as d3 from 'd3'

/**
 * create a time formatting function
 * @param {object} config encoding or axis definition object
 * @returns {function(Date)} date formatting function
 */
const timeFormat = config => {
	if (!config?.format) {
		return date => date.toString()
	}
	return d3.timeFormat(config.format)
}

/**
 * create a time formatting function in UTC
 * @param {object} config encoding or axis definition object
 * @returns {function(Date)} UTC date formatting function
 */
const utcFormat = config => {
	if (!config?.format) {
		return date => date.toUTCString()
	}
	return d3.utcFormat(config.format)
}

/**
 * create a number formatting function
 * @param {object} config encoding or axis definition object
 * @returns {function(number)} number formatting function
 */
const numberFormat = config => {
	if (!config?.format) {
		return number => number.toString()
	}
	return d3.format(config.format)
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
	if (time) {
		const utc = !!config.timeUnit?.startsWith('utc')
		if (utc) {
			return utcFormat(config)
		} else {
			return timeFormat(config)
		}
	} else {
		return numberFormat(config)
	}
}
const format = memoize(_format)

export { format }
