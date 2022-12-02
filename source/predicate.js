import { memoize } from './memoize.js'

const value = (config, datum) => datum[config.field]

/**
 * equal to predicate
 * @param {object} config predicate definition
 * @returns {function(object)} filter predicate
 */
const equal = config => datum => value(config, datum) === config.equal

/**
 * less than predicate
 * @param {object} config predicate definition
 * @returns {function(object)} filter predicate
 */
const lt = config => datum => value(config, datum) < config.lt

/**
 * less than or equal to predicate
 * @param {object} config predicate definition
 * @returns {function(object)} filter predicate
 */
const lte = config => datum => value(config, datum) <= config.lte

/**
 * greater than predicate
 * @param {object} config predicate definition
 * @returns {function(object)} filter predicate
 */
const gt = config => datum => value(config, datum) > config.gt

/**
 * greater than or equal to predicate
 * @param {object} config predicate definition
 * @returns {function(object)} filter predicate
 */
const gte = config => datum => value(config, datum) >= config.gte

/**
 * range predicate
 * @param {object} config predicate definition
 * @returns {function(object)} filter predicate
 */
const range = config => datum => value(config, datum) >= config.range[0] && value(config, datum) <= config.range[1]

/**
 * oneOf predicate
 * @param {object} config predicate definition
 * @returns {function(object)} filter predicate
 */
const oneOf = config => datum => config.oneOf.includes(value(config, datum))

/**
 * valid predicate
 * @param {object} config predicate definition
 * @returns {function(object)} filter predicate
 */
const valid = config => datum => config.valid ? !Number.isNaN(value(config, datum)) && value(config, datum) !== null : true

const predicates = {
	equal,
	lt,
	lte,
	gt,
	gte,
	range,
	oneOf,
	valid
}

/**
 * generate a predicate test function
 * @param {object} config predicate definition
 * @returns {function(object)} predicate test function
 */
const _predicate = config => {
	const [key, create] = Object.entries(predicates).find(([key]) => config[key])
	if (typeof create === 'function') {
		return create(config)
	} else {
		throw new Error(`could not create ${key} predicate function for data field ${config.field}`)
	}
}
const predicate = memoize(_predicate)

export { predicate }
