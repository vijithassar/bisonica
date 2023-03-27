import { identity } from './helpers.js'
import { memoize } from './memoize.js'

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
 * create a function to run transforms on a specification
 * @param {object} s Vega Lite specification
 * @returns {function} transform function
 */
const transform = s => {
	return composeCalculateTransforms(s.transform)
}

export { calculate, transform }
