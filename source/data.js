import * as d3 from 'd3'

import {
	encodingChannelQuantitative,
	encodingChannelCovariate,
	encodingChannelCovariateCartesian,
	encodingField,
	encodingValue
} from './encodings.js'
import { metadata } from './metadata.js'
import { feature } from './feature.js'
import { cached } from './fetch.js'
import { identity, missingSeries, nested } from './helpers.js'
import { memoize } from './memoize.js'
import { parseTime } from './time.js'
import { transformValues } from './transform.js'

/**
 * get values from values property
 * @param {object} s Vega Lite specification
 * @returns {object[]|object}
 */
const valuesInline = s => s.data.values || s.data

/**
 * get values from datasets property based on name
 * @param {object} s Vega Lite specification
 * @returns {object[]}
 */
const valuesTopLevel = s => s.datasets[s.data.name]

/**
 * generate a data set
 * @param {object} s Vega Lite specification
 * @returns {object[]} data
 */
const valuesSequence = s => {
	const { start, stop, step } = s.data.sequence
	const values = d3.range(start, stop, (step || 1))
	const key = s.data.sequence.as || 'data'
	return values.map(item => {
		return { [key]: item }
	})
}

/**
 * look up data values attached to specification
 * @param {object} s Vega Lite specification
 * @returns {object[]|object}
 */
const valuesStatic = s => {
	if (s.data?.name) {
		return valuesTopLevel(s)
	} else if (s.data?.sequence) {
		return valuesSequence(s)
	} else {
		return valuesInline(s)
	}
}

/**
 * convert numbers to objects
 * @param {number[]} arr array of primitives
 * @returns {object[]} array of objects
 */
const wrap = arr => {
	if (!arr || typeof arr[0] === 'object') {
		return arr
	} else {
		try {
			return arr.map(item => {
				return { data: item }
			})
		} catch (error) {
			error.message = `could not convert primitives to objects - ${error.message}`
			throw error
		}
	}
}

/**
 * look up data from a nested object based on
 * a string of properties
 * @param {object} s Vega Lite specification
 * @returns {function(object)}
 */
const lookup = s => {
	if (s.data.format?.type !== 'json' || !s.data.format?.property) {
		return identity
	}
	return data => {
		return nested(data, s.data.format?.property)
	}
}

/**
 * get remote data from the cache
 * @param {object} s Vega Lite specification
 * @returns {object[]} data set
 */
const valuesCached = s => cached(s.data)

const parsers = {
	number: d => +d,
	boolean: d => !!d,
	date: d => new Date(d),
	null: identity
}

/**
 * convert field types in an input datum object
 * @param {object} s Vega Lite specification
 * @returns {function(object)} datum field parsing function
 */
const parseFields = s => {
	if (!s.data?.format?.parse) {
		return identity
	}
	const parser = d => {
		let result = { ...d }
		for (const [key, type] of Object.entries(s.data.format.parse)) {
			result[key] = parsers[`${type}`](d[key])
		}
		return result
	}
	return data => data.map(parser)
}

/**
 * run all data transformation and utility functions
 * on an input data set
 * @param {object} s Vega Lite specification
 * @returns {function(object[])} data processing function
 */
const dataUtilities = s => {
	return data => {
		return transformValues(s)(wrap(parseFields(s)(lookup(s)(data)))).slice()
	}
}

/**
 * look up data values
 * @param {object} s Vega Lite specification
 * @returns {object[]} data set
 */
const _values = s => {
	if (!s.data) {
		return
	}
	const url = !!s.data.url
	return dataUtilities(s)(url ? valuesCached(s) : valuesStatic(s))
}
const values = memoize(_values)

/**
 * nest data points in a hierarchy according to property name
 * @param {object[]} data individual data points
 * @param {string} property property name under which to nest
 * @returns {object[]} nested data points
 */
const groupByProperty = (data, property) => {
	return Array.from(d3.group(data, d => d[property])).map(([key, values]) => ({ key, values }))
}

/**
 * compute totals for a set of grouped values
 * @param {object} datum grouped values
 * @param {string} property categorical property to sum on each datum
 * @param {string} valueKey property containing numerical value to sum
 * @returns {object} sum for property
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
 * @returns {object[]} nested group sums
 */
const groupAndSumByProperties = (values, groupBy, sumBy, valueKey) => {
	return groupByProperty(values, groupBy).map(item => sumByProperty(item, sumBy, valueKey))
}

/**
 * string keys used to compute stack layout
 * @param {object[]} data data set
 * @returns {object[]} keys
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
 * @returns {object[]} values summed across time period
 */
const sumByCovariates = s => {
	const quantitative = encodingField(s, encodingChannelQuantitative(s))
	const covariate = encodingField(s, encodingChannelCovariateCartesian(s))
	const group = encodingField(s, 'color')

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
 * @returns {object[]} sorted data set
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
 * @returns {number}
 */
const stackValue = (d, key) => d[key]?.value || 0

/**
 * reorganize data from specification into array
 * of values used to render a stacked bar chart
 * @param {object} s Vega Lite specification
 * @returns {object[]} stacked data series
 */
const stackData = s => {
	const covariate = encodingField(s, encodingChannelCovariateCartesian(s))
	const quantitative = encodingField(s, encodingChannelQuantitative(s))
	const group = encodingField(s, 'color')

	const summed = groupAndSumByProperties(values(s), covariate, group, quantitative)
	const stacker = d3.stack().keys(stackKeys).value(stackValue)
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
 * @returns {object[]} totals by group
 */
const circularData = s => {
	const grouped = Array.from(d3.group(values(s), encodingValue(s, 'color'))).map(
		([key, values]) => ({ key, values })
	)

	const summed = grouped.map(({ key, values }) => {
		return { key, value: d3.sum(values, encodingValue(s, 'theta')) }
	})

	return summed
}

/**
 * reorganize data from a specification into
 * array of values used to render a line chart.
 * @param {object} s Vega Lite specification
 * @returns {object[]} summed values for line chart
 */
const lineData = s => {
	const quantitative = encodingField(s, encodingChannelQuantitative(s))
	const covariate = encodingField(s, encodingChannelCovariateCartesian(s)) || missingSeries()
	const color = encodingField(s, 'color')

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
 * @returns {object[]} data points for point marks
 */
const pointData = values

/**
 * retrieve data points used for generic marks
 * @param {object} s Vega Lite specification
 * @returns {object[]} data points for generic marks
 */
const genericData = values

/**
 * wrapper function around chart-specific data preprocessing functionality
 * @param {object} s Vega Lite specification
 * @returns {object[]} sorted and aggregated data
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
 * @returns {object[]} sorted and aggregated data
 */
const _data = s => {
	return metadata(s, chartData(s))
}
const data = memoize(_data)

export { data, values, pointData, sumByCovariates }
