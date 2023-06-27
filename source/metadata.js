/**
 * transfer additional properties from raw input data to aggregated data
 * @module metadata
 */

import { encodingChannelCovariateCartesian, encodingField } from './encodings.js'
import { feature } from './feature.js'
import { missingSeries } from './helpers.js'
import { values } from './values.js'

const metadataChannels = ['description', 'tooltip', 'href']

/**
 * test whether a specification has metadata
 * @param {object} s Vega Lite specification
 * @returns {boolean}
 */
const hasMetadata = s => {
	return Object.keys(s.encoding).some(key => metadataChannels.includes(key))
}

/**
 * determine which field values match between two objects
 * @param {object} a object to compare
 * @param {object} b object to compare
 * @param {string[]} fields list of fields to compare
 * @returns {string[]} matching fields
 */
const matchingFields = (a, b, fields) => {
	return fields.filter(field => a[field] === b[field])
}

/**
 * create a function for looking up core encoding channels
 * and returning them as a string key suitable for indexing
 * @param {object} s Vega Lite specification
 * @returns {function(object)} convert datum to string key
 */
const createKeyBuilder = s => {
	const delimiter = ' + '
	const fields = coreEncodingFields(s)
	const getters = fields.map(field => item => item[field])
	const getter = item => getters.map(getter => getter(item)).join(delimiter)
	return getter
}

/**
 * determine which fields contain metadata
 * @param {object} s Vega Lite specification
 */
const metadataFields = s => {
	return metadataChannels
		.map(channel => encodingField(s, channel))
		.filter(Boolean)
}

/**
 * copy desired properties to a sanitized object
 * @param {object} object object with properties
 * @param {string[]} fields desired properties
 * @returns {object} object with only the desired properties
 */
const pick = (object, fields) => {
	let result = {}
	fields.forEach(field => {
		if (object[field]) {
			result[field] = object[field]
		}
	})
	return result
}

/**
 * determine which core encoding channels are
 * represented in a Vega Lite specification
 * @param {object} s Vega Lite specification
 * @returns {string[]} encoding channels
 */
const coreEncodingChannels = s => {
	let channels = []
	if (feature(s).hasColor()) {
		channels.push('color')
	}
	if (feature(s).isCartesian()) {
		channels.push(encodingChannelCovariateCartesian(s))
	}
	return channels
}

/**
  * fields used to represent core
  * encoding channels
  * @param {object} s Vega Lite specification
  * @returns {string[]} encoding fields
  */
const coreEncodingFields = s => {
	return coreEncodingChannels(s).map(channel => encodingField(s, channel)).filter(Boolean)
}

/**
 * count the metadata fields in a data set and look for conflicts
 * @param {object} s Vega Lite specification
 * @param {object[]} data data set to count fields in
 * @param {function} createKey function to create a unique key per datum
 * @returns {object} metadata fields indexed by core field values
 */
const countFields = (s, data, createKey) => {
	const counter = {}
	const fields = metadataFields(s)
	data.forEach(item => {
		const key = createKey(item)
		if (!counter[key]) {
			counter[key] = { count: 0 }
		}
		counter[key].count++
		const count = counter[key].count
		if (count === 1) {
			counter[key].fields = pick(item, fields)
		} else if (count > 1) {
			const matches = matchingFields(counter[key].fields, pick(item, fields), fields)
			if (matches.length !== fields.length) {
				counter[key].fields = pick(item, matches)
			}
		}
	})
	return counter
}

/**
 * restructure a data point from aggregate data
 * for a circular chart to make it easier to find
 * the data fields of interest for comparison
 * @param {object} s Vega Lite specification
 * @param {object} item datum
 * @returns {object} object with lookup fields at the top level
 */
const lookupCircular = (s, item) => {
	let result = {}
	const fields = coreEncodingFields(s)
	if (feature(s).isCircular()) {
		return {
			// this is equivalent to using accessor functions
			// but is hard coded here for performance reasons
			[fields[0]]: item.key
		}
	}
	return result
}

/**
 * restructure a data point from aggregated data for
 * a stack-based chart to make it easier to find the
 * data fields of interest for comparison
 *
 * due to a performance bottleneck, fields are
 * looked up once externally and then passed into
 * this restructuring function as arguments instead
 * of being kept entirely inside this scope
 * @param {object} s Vega Lite specification
 * @param {string} series series key
 * @param {string} covariate covariate
 * @param {object} item datum
 * @returns {object} object with lookup fields at the top level
 */
const lookupStack = (s, series, covariate, item) => {
	let result = {}
	if (series !== missingSeries()) {
		result[encodingField(s, 'color')] = series
	}
	// this is equivalent to using accessor functions
	// but is hard coded here for performance reasons
	result[covariate] = item.data.key
	return result
}

/**
 * restructure a data point from aggregated data for
 * a line chart to make it easier to find the
 * data fields of interest for comparison
 *
 * due to a performance bottleneck, fields are
 * looked up once externally and then passed into
 * this restructuring function as arguments instead
 * of being kept entirely inside this scope
 * @param {object} s Vega Lite specification
 * @param {string} series series key
 * @param {string} covariate covariate
 * @param {object} item datum
 * @returns {object} object with lookup fields at the top level
 */
const lookupLine = (s, series, covariate, item) => {
	let result = []
	if (series !== missingSeries()) {
		const category = encodingField(s, 'color')
		result[category] = series[category]
	}
	result[covariate] = item.period || item.bucket
	return result
}

/**
 * move properties from an array of source
 * values to an aggregate
 * @param {object} s Vega Lite specification
 * @param {object[]} aggregated aggregated data points
 * @param {object[]} raw individual data points
 * @returns {object[]} aggregated data points with transplanted field attached
 */
const transplantFields = (s, aggregated, raw) => {
	const createKey = createKeyBuilder(s)
	const counter = countFields(s, raw, createKey)

	if (feature(s).isCircular()) {
		aggregated.forEach(item => {
			const key = createKey(lookupCircular(s, item))
			Object.assign(item, counter[key]?.fields)
		})
	}

	if (feature(s).isBar()) {
		const covariate = encodingField(s, encodingChannelCovariateCartesian(s))
		aggregated.forEach(series => {
			series.forEach(item => {
				const key = createKey(lookupStack(s, series.key, covariate, item))
				Object.assign(item, counter[key]?.fields)
			})
		})
	}

	if (feature(s).isLine()) {
		aggregated.forEach(series => {
			const covariate = encodingField(s, encodingChannelCovariateCartesian(s))
			series.values.forEach(item => {
				const key = createKey(lookupLine(s, series, covariate, item))
				Object.assign(item, counter[key]?.fields)
			})
		})
	}

	return aggregated
}

/**
 * transfer metadata from raw data points to aggregated data
 * @param {object} s Vega Lite specification
 * @param {object[]} data aggregated data for data join
 * @returns {object[]} aggregated data with metadata
 */
const metadata = (s, data) => {
	const aggregate = feature(s).isBar() || feature(s).isArea() || feature(s).isCircular() || feature(s).isLine()
	if (!hasMetadata(s) || !aggregate) {
		return data
	}
	if (aggregate) {
		return transplantFields(s, data, values(s))
	}
}

export { metadata }
