import * as d3 from 'd3'
import { encodingChannelCovariateCartesian, encodingValue } from './encodings.js'
import { memoize } from './memoize.js'
import { feature } from './feature.js'
import { barWidth } from './marks.js'

import matchAll from 'string.prototype.matchall'

const UTC = 'utc'
const TIME = 'time'

/**
 * convert date string in YYYY-MM-DD format to date object
 * @param {string} dateString string in YYYY-MM-DD format
 * @returns {object} date object
 */
const timeParseYYYYMMDD = d3.utcParse('%Y-%m-%d')

/**
 * convert date string in YYYY-MM format to date object
 * @param {string} dateString string in YYYY-MM format
 * @returns {object} date object
 */
const timeParseYYYYMM = d3.utcParse('%Y-%m')

/**
 * convert date string in ISO8601 range format to date object
 * @param {string} date string in ISO8601 range format
 * @returns {object} date object
 */
const timeParseIsoRange = (date) => {
	if (typeof date === 'string') {
		const fragment = date.split('Z-')[0]

		return d3.isoParse(`${fragment}Z`)
	}
}

/**
 * convert date string in ISO8601 format to date object
 * @param {string} dateString string in ISO8601 format
 * @returns {object} date object
 */
const timeParseIso = d3.isoParse

/**
 * convert date in milliseconds to date object
 * @param {number} date number of milliseconds
 * @returns {object} date object
 */
const timeParseMilliseconds = (date) => new Date(date)

/**
 * convert date in milliseconds as string to date object
 * @param {string} date number of milliseconds
 * @returns {object} date object
 */
const timeParseMillisecondsString = (date) => timeParseMilliseconds(+date)

const _getTimeParser = (date) => {
	const parsers = [
		timeParseYYYYMMDD,
		timeParseIso,
		timeParseIsoRange,
		timeParseYYYYMM,
		timeParseMilliseconds,
		timeParseMillisecondsString
	]
	const isDate = (parser) => {
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
 * @returns {function} date parsing function
 */
const getTimeParser = memoize(_getTimeParser)

/**
 * select a function that can parse a date format
 * @param {(string|number)} date date representation
 * @returns {Date} date object
 */
const _parseTime = (date) => {
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
 * @returns {string} camelcased time specifier string
 */
const camelCaseTimePeriod = (timeSpecifier) => {
	let matches = [...matchAll(timeSpecifier, findTimePeriod)]

	if (!matches.length) {
		return timeSpecifier
	}

	let [, period] = matches[0]

	return timeSpecifier.replace(period, period[0].toUpperCase() + period.slice(1))
}

/**
 * convert time specifier into d3 method name
 * @param {string} specifier time specifier string
 * @returns {string} d3 time interval method name
 */
const timeMethod = (specifier) => {
	const prefix = specifier.startsWith(UTC) ? '' : TIME

	return camelCaseTimePeriod(`${prefix}${specifier}`)
}

/**
 * string key for controlling date functionality
 * @param {object} s Vega Lite specification
 * @param {string} channel temporal channel
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
 * default date format
 * @param {object} date Date object
 * @returns {string} string representation
 */
const defaultTimeFormatter = (date) => date.toUTCString()

/**
 * string key for controlling date functionality
 * @param {object} s Vega Lite specification
 * @param {string} channel temporal channel
 * @returns {function} date string formatting function
 */
const _getTimeFormatter = (s, channel) => {
	const format = s.encoding?.[channel]?.axis?.format

	if (format) {
		return d3.utcFormat(format)
	}

	return defaultTimeFormatter
}
const getTimeFormatter = memoize(_getTimeFormatter)

/**
 * alter dimensions object to subtract the bar width
 * for a temporal bar chart
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {object} chart dimensions with bar width offset
 */
const temporalBarDimensions = (s, dimensions) => {
	const offset = feature(s).isTemporalBar() ? barWidth(s, dimensions) : 0
	const channel = encodingChannelCovariateCartesian(s)
	return {
		...dimensions,
		[channel]: dimensions[channel] - offset
	}
}

export { getTimeParser, parseTime, timePeriod, getTimeFormatter, timeMethod, temporalBarDimensions }
