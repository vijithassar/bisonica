import { identity } from './helpers.js'
import { memoize } from './memoize.js'
import { predicate } from './predicate.js'
import { expression } from './expression.js'
import * as d3 from 'd3'

/**
 * create a function to perform a single calculate expression
 * @param {string} str a calculate expression describing string interpolation
 * @returns {function(string)} string interpolation function
 */
const calculate = str => expression(str)

/**
 * compose all calculate transforms
 * into a single function
 * @param {object[]} transforms
 * @returns {function(object)}
 */
const _composeCalculateTransforms = transforms => {
	if (!transforms) {
		return () => identity
	}
	return d => {
		return transforms
			.filter(transform => transform.calculate)
			.reduce((previous, current) => {
				return {
					...previous,
					[current.as]: calculate(current.calculate)({ ...d })
				}
			}, { ...d })
	}
}

/**
 * create a function to augment a datum with multiple calculate expressions
 * @param {object[]} transforms an array of calculate expressions
 * @returns {function(object[])} transform function
 */
const composeCalculateTransforms = memoize(_composeCalculateTransforms)

/**
 * create a function to run transforms on a single datum
 * @param {object} s Vega Lite specification
 * @returns {function(object)} transform function for a single datum
 */
const transformDatum = s => {
	return composeCalculateTransforms(s.transform)
}

/**
 * run a random sampling transform
 * @param {number} n count
 * @returns {function(object[])} random sampling function
 */
const sample = n => {
	return data => {
		if (!n) {
			return data
		}
		return d3.shuffle(data.slice()).slice(0, n)
	}
}

/**
 * run a filter transform
 * @param {object} s Vega Lite specification
 * @param {object} config transform configuration
 * @returns {function(object[])} filter transform function
 */
const filter = (s, config) => {
	return data => {
		return data.filter(datum => {
			return predicate(config)(datum) || predicate(config)(transformDatum(s)(datum))
		})
	}
}

/**
 * fold fields
 * @param {object} config fold configuration
 * @returns {function(object[])} fold transform function
 */
const fold = config => {
	const fields = config.fold
	const [key, value] = config.as || ['key', 'value']
	return data => {
		return fields.map(field => {
			return data.map(item => {
				return { ...item, [key]: field, [value]: item[field] }
			})
		}).flat()
	}
}

/**
 * flatten fields
 * @param {object} config flatten configuration
 * @returns {function(object[])} flatten transform function
 */
const flatten = config => {
	const fields = config.flatten
	return data => {
		return data.map(item => {
			const longest = +d3.max(fields, d => item[d]?.length)
			return Array.from({ length: longest }).map((_, i) => {
				let result = { ...item }
				fields.forEach((field, index) => {
					const key = config.as ? config.as[index] : field
					result[key] = item[field][i] || null
				})
				return result
			}).flat()
		}).flat()
	}
}

/**
 * apply a single transform
 * @param {s} config transform configuration
 * @param {object[]} data data set
 * @returns {object[]} transformed data set
 */
const applyTransform = (s, config, data) => {
	if (config.sample) {
		return sample(config.sample)(data)
	} else if (config.filter) {
		return filter(s, config.filter)(data)
	} else if (config.fold) {
		return fold(config)(data)
	} else if (config.flatten) {
		return flatten(config)(data)
	}
}

/**
 * create a function to run transforms on a data set
 * @param {object} s Vega Lite specification
 * @returns {function(object[])} transform function for a data set
 */
const _transformValues = s => {
	if (!s.transform) {
		return identity
	}
	return data => {
		return s.transform
			.filter(transform => !transform.calculate)
			.reduce((accumulator, current) => {
				return applyTransform(s, current, accumulator)
			}, data)
	}
}
const transformValues = memoize(_transformValues)

export { calculate, transformDatum, transformValues }
