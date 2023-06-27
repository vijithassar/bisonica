/**
 * fetch, cache, and transform raw data
 * @module values
 * @see {@link module:data}
 * @see {@link module:fetch}
 * @see {@link module:transform}
 */

import * as d3 from 'd3'
import { cached } from './fetch.js'
import { identity, nested } from './helpers.js'
import { transformValues } from './transform.js'
import { memoize } from './memoize.js'

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

export { values }
