import { identity } from './helpers.js'
import { memoize } from './memoize.js'
import { predicate } from './predicate.js'
import * as d3 from 'd3'

/**
 * create a function to perform a single calculate expression
 * @param {string} expression a calculate expression describing string interpolation
 * @returns {function} string interpolation function
 */
const calculate = expression => {
	const segments = expression
		.split('+')
		.map(item => item.trim())
		.map(item => {
			const interpolate = typeof item === 'string' && item.startsWith('datum.')
			const literal = item.startsWith("'") && item.endsWith("'")

			if (literal) {
				return item.slice(1, -1)
			} else if (interpolate) {
				return item
			}
		})
		.filter(item => !!item)

	return d =>
		segments
			.map(segment => {
				if (segment.startsWith('datum.')) {
					const key = segment.slice(6)

					return d[key]
				} else {
					return segment
				}
			})
			.join('')
}

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
 * @param {array} transforms an array of calculate expressions
 * @returns {function} transform function
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
 * randomly sample from a data set
 * @param {object} s Vega Lite specification
 * @returns {function(object[])} random sampling function
 */
const sample = s => {
	if (!s.transform) {
		return identity
	}
	const lookup = transform => transform.sample
	return data => {
		const n = +d3.min(s.transform.filter(lookup), lookup)
		if (!n) {
			return data
		}
		return d3.shuffle(data.slice()).slice(0, n)
	}
}

/**
 * run all filter transforms
 * @param {object} s Vega Lite specification
 * @returns {function(object[])} filter transform function
 */
const filters = s => {
	const configs = s.transform
		.filter(transform => transform.filter)
		.map(item => item.filter)
	const predicates = configs
		.map(predicate)
		.map(fn => {
			return datum => fn(datum) || fn(transformDatum(s)(datum))
		})
	return data => {
		return predicates.reduce((accumulator, current) => {
			return accumulator.filter(current)
		}, data)
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
	return data => filters(s)(sample(s)(data))
}
const transformValues = memoize(_transformValues)

export { calculate, transformDatum, transformValues }
