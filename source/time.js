/**
 * timestamp computations
 * @module time
 */

import './types.d.js'

import * as d3 from 'd3'
import { encodingChannelCovariateCartesian, encodingValue } from './encodings.js'
import { memoize } from './memoize.js'
import { feature } from './feature.js'
import { barWidth } from './marks.js'

const UTC = 'utc'
const TIME = 'time'

/**
 * convert date string in YYYY-MM-DD format to date object
 * @param {string} dateString string in YYYY-MM-DD format
 * @return {Date} date object
 */
const timeParseYYYYMMDD = d3.utcParse('%Y-%m-%d')

/**
 * convert date string in ISO8601 format to date object
 * @param {string} dateString string in ISO8601 format
 * @return {Date} date object
 */
const timeParseIso = d3.isoParse

/**
 * convert date in milliseconds to date object
 * @param {number} date number of milliseconds
 * @return {Date} date object
 */
const timeParseMilliseconds = date => new Date(date)

const _getTimeParser = date => {
	const parsers = [
		timeParseYYYYMMDD,
		timeParseIso,
		timeParseMilliseconds
	]
	const isDate = parser => {
		const parsed = parser(date)
		const year = !!parsed && parsed.getFullYear()

		return typeof year === 'number' && !Number.isNaN(year)
	}

	// use the first date parsing function that works
	const parser = parsers.find(isDate)

	const isFunction = typeof parser === 'function'

	return isFunction ? parser : null
}

/**
 * select a function that can parse a date format
 * @param {(string|number)} date date representation
 * @return {function(Date)} date parsing function
 */
const getTimeParser = memoize(_getTimeParser)

/**
 * select a function that can parse a date format
 * @param {(string|number)} date date representation
 * @return {Date} date object
 */
const _parseTime = date => {
	const parser = getTimeParser(date)

	if (typeof parser === 'function') {
		return parser(date)
	}
}
const parseTime = memoize(_parseTime)

const findTimePeriod = new RegExp(`(?:${TIME}|${UTC})(\\w+)`, 'gi')
/**
 * capitalize the time period in a time specifier string
 * @param {string} timeSpecifier lowercase time specifier string
 * @return {string} camelcased time specifier string
 */
const camelCaseTimePeriod = timeSpecifier => {
	let matches = [...timeSpecifier.matchAll(findTimePeriod)]

	if (!matches.length) {
		return timeSpecifier
	}

	let [, period] = matches[0]

	return timeSpecifier.replace(period, period[0].toUpperCase() + period.slice(1))
}

/**
 * convert time specifier into d3 method name
 * @param {string} specifier time specifier string
 * @return {string} d3 time interval method name
 */
const timeMethod = specifier => {
	const prefix = specifier.startsWith(UTC) ? '' : TIME

	return camelCaseTimePeriod(`${prefix}${specifier}`)
}

/**
 * string key for controlling date functionality
 * @param {object} s Vega Lite specification
 * @param {string} channel temporal encoding channel
 */
const timePeriod = (s, channel) => {
	const unit = s.encoding[channel].timeUnit || 'utcday'
	const utc = unit.startsWith(UTC)
	const weekly = unit.endsWith('week')
	const prefix = utc ? UTC : TIME
	let period

	if (!utc) {
		period = unit
	} else {
		if (weekly) {
			const firstDate = parseTime(d3.min(s.data.values, encodingValue(s, channel)))

			period = d3.utcFormat('%A')(firstDate)
		} else {
			period = unit.slice(UTC.length)
		}
	}

	return camelCaseTimePeriod(`${prefix}${period}`)
}

/**
 * alter dimensions object to subtract the bar width
 * for a temporal bar chart
 * @param {object} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {dimensions} chart dimensions with bar width offset
 */
const temporalBarDimensions = (s, dimensions) => {
	const offset = feature(s).isTemporalBar() ? barWidth(s, dimensions) : 0
	const channel = encodingChannelCovariateCartesian(s)
	return {
		...dimensions,
		[channel]: dimensions[channel] - offset
	}
}

export { getTimeParser, parseTime, timePeriod, timeMethod, temporalBarDimensions }
