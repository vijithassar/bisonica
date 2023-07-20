/**
 * general data processing utilities and preprocessing specific to particular chart forms
 * @module data
 * @see {@link module:metadata}
 * @see {@link module:fetch}
 * @see {@link module:transform}
 * @see {@link https://vega.github.io/vega-lite/docs/data.html|vega-lite:data}
 */

import * as d3 from 'd3'

import {
	encodingChannelQuantitative,
	encodingChannelQuantitativeCartesian,
	encodingChannelCovariate,
	encodingChannelCovariateCartesian,
	encodingField,
	encodingValue
} from './encodings.js'
import { metadata } from './metadata.js'
import { feature } from './feature.js'
import { missingSeries, nested } from './helpers.js'
import { memoize } from './memoize.js'
import { parseTime } from './time.js'
import { values } from './values.js'

/**
 * stack offset configuration
 * @param {object} s Vega Lite specification
 * @return {string} stack command
 */
const stackOffset = s => s.encoding[encodingChannelQuantitative(s)].stack

/**
 * nest data points in a hierarchy according to property name
 * @param {object[]} data individual data points
 * @param {string} property property name under which to nest
 * @return {object[]} nested data points
 */
const groupByProperty = (data, property) => {
	return Array.from(d3.group(data, d => d[property])).map(([key, values]) => ({ key, values }))
}

/**
 * compute totals for a set of grouped values
 * @param {object} datum grouped values
 * @param {string} property categorical property to sum on each datum
 * @param {string} valueKey property containing numerical value to sum
 * @return {object} sum for property
 */
const sumByProperty = (datum, property, valueKey) => {
	const result = {}

	result.key = datum.key
	datum.values.forEach(item => {
		const key = item[property]

		if (result[key] === undefined) {
			result[key] = { value: 0 }
		}

		const value = valueKey && valueKey.includes('.') ? nested(item, valueKey) : item[valueKey]

		result[key].value += +value

		// this should be refactored
		const field = ['url', 'description', 'tooltip']

		field.forEach(field => {
			if (item[field]) {
				result[key][field] = item[field]
			}
		})
	})

	return result
}

/**
 * sum individual values into totals by group
 * @param {object[]} values individual data points
 * @param {string} groupBy property to group by
 * @param {string} sumBy property to sum by
 * @param {string} valueKey property to sum
 * @return {object[]} nested group sums
 */
const groupAndSumByProperties = (values, groupBy, sumBy, valueKey) => {
	return groupByProperty(values, groupBy).map(item => sumByProperty(item, sumBy, valueKey))
}

/**
 * string keys used to compute stack layout
 * @param {object[]} data data set
 * @return {object[]} keys
 */
const stackKeys = data => {
	const keys = data
		.map(item => {
			return Object.keys(item).filter(item => item !== 'key')
		})
		.flat()
	const unique = [...new Set(keys)]

	return unique
}

/**
 * sum values across the time period specified on the x axis
 * @param {object} s Vega Lite specification
 * @return {object[]} values summed across time period
 */
const sumByCovariates = s => {
	const quantitative = encodingField(s, encodingChannelQuantitative(s))
	const covariate = feature(s).isCartesian() ? encodingField(s, encodingChannelCovariateCartesian(s)) : null
	const group = encodingField(s, 'color') || encodingField(s, 'detail')

	const summedByGroup = groupAndSumByProperties(values(s), covariate, group, quantitative)
	const keys = stackKeys(summedByGroup)
	const summedByPeriod = summedByGroup.map(item => {
		return d3.sum(keys.map(key => item[key]?.value || 0))
	})

	return summedByPeriod
}

/**
 * sort nested data by date and series category
 * @param {object[]} data unsorted data set
 * @return {object[]} sorted data set
 */
const sort = data => {
	const keys = stackKeys(data)
	const sortedDate = data.map(item => {
		return item.sort((a, b) => {
			return Number(new Date(a.data.key)) - Number(new Date(b.data.key))
		})
	})
	const sortedSeries = sortedDate.sort((a, b) => {
		return keys.indexOf(a.key) - keys.indexOf(b.key)
	})

	return sortedSeries
}

/**
 * retrieve a numerical value for the stack layout
 * @param {object} d datum
 * @param {string} key property
 * @return {number}
 */
const stackValue = (d, key) => d[key]?.value || 0

/**
 * reorganize data from specification into array
 * of values used to render a stacked bar chart
 * @param {object} s Vega Lite specification
 * @return {object[]} stacked data series
 */
const stackData = s => {
	const covariate = feature(s).isCartesian() ? encodingField(s, encodingChannelCovariateCartesian(s)) : null
	const quantitative = encodingField(s, encodingChannelQuantitative(s))
	const group = encodingField(s, 'color') || encodingField(s, 'detail')

	const summed = groupAndSumByProperties(values(s), covariate, group, quantitative)
	const stacker = d3.stack().keys(stackKeys).value(stackValue)

	if (stackOffset(s) === 'normalize') {
		stacker.offset(d3.stackOffsetExpand)
	}

	if (stackOffset(s) === 'center') {
		stacker.offset(d3.stackOffsetSilhouette)
	}

	const stacked = stacker(summed)
	const single = stacked.length === 1

	// this needs to test for the field instead of
	// the encoding as with feature(s).hasColor()
	// in order to account for value encodings
	const seriesEncoding = encodingField(s, 'color')

	const sanitize = single && !seriesEncoding

	if (sanitize) {
		// mutate instead of map in order to preserve
		// hidden keys attached to the stack layout
		stacked.forEach(series => {
			series.key = missingSeries()
			series.forEach(item => {
				if (item.data.undefined) {
					item.data[missingSeries()] = item.data.undefined
					delete item.data.undefined
				}
			})
		})
	}

	return sort(stacked)
}

/**
 * reorganize data from specification into totals
 * used to render a circular chart
 * @param {object} s Vega Lite specification
 * @return {object[]} totals by group
 */
const circularData = s => {
	const grouped = Array.from(d3.group(values(s), encodingValue(s, 'color'))).map(
		([key, values]) => ({ key, values })
	)

	const summed = grouped.map(({ key, values }) => {
		const result = { key }
		const channels = ['theta', 'radius']
		channels
			.forEach(channel => {
				const key = channel === 'theta' ? 'value' : encodingField(s, channel)
				if (key) {
					result[key] = d3.sum(values, encodingValue(s, channel))
				}
			})
		return result
	})

	return summed
}

/**
 * reorganize data from a specification into
 * array of values used to render a line chart.
 * @param {object} s Vega Lite specification
 * @return {object[]} summed values for line chart
 */
const lineData = s => {
	const quantitative = encodingField(s, encodingChannelQuantitativeCartesian(s))
	const covariate = encodingField(s, encodingChannelCovariateCartesian(s)) || missingSeries()
	const color = encodingField(s, 'color') || encodingField(s, 'detail')

	const summed = groupAndSumByProperties(values(s), covariate, color, quantitative)
	const results = stackKeys(summed).map(key => {
		const values = summed
			.filter(item => !!item[key])
			.map(item => {
				const bucket = feature(s).isTemporal() ? 'period' : encodingField(s, encodingChannelCovariate(s))
				const result = {
					[bucket]: item.key,
					value: item[key].value
				}
				return result
			})
			.sort((a, b) => Number(parseTime(a.period)) - Number(parseTime(b.period)))

		return {
			[encodingField(s, 'color') || missingSeries()]: key,
			values
		}
	})

	return results
}

/**
 * retrieve data points used for point marks
 * @param {object} s Vega Lite specification
 * @return {object[]} data points for point marks
 */
const pointData = values

/**
 * retrieve data points used for generic marks
 * @param {object} s Vega Lite specification
 * @return {object[]} data points for generic marks
 */
const genericData = values

/**
 * wrapper function around chart-specific data preprocessing functionality
 * @param {object} s Vega Lite specification
 * @return {object[]} sorted and aggregated data
 */
const chartData = s => {
	if (feature(s).isBar() || feature(s).isArea()) {
		return stackData(s)
	} else if (feature(s).isLine()) {
		return lineData(s)
	} else if (feature(s).isCircular()) {
		return circularData(s)
	} else {
		return genericData(s)
	}
}

/**
 * wrapper function around data preprocessing functionality
 * @param {object} s Vega Lite specification
 * @return {object[]} sorted and aggregated data
 */
const _data = s => {
	return metadata(s, chartData(s))
}
const data = memoize(_data)

export { data, pointData, stackOffset, sumByCovariates }
