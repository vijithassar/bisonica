import { memoize } from './memoize.js'
import { identity } from './helpers.js'
import * as d3 from 'd3'

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
		return d3.timeFormat(config.format)
	} else {
		return d3.format(config.format)
	}
}
const format = memoize(_format)

export { format }
