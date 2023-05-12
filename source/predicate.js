import { identity } from './helpers.js'
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

/**
 * determine whether a string starts and ends with quotes
 * @param {string} string string, possibly a string literal
 * @returns {boolean}
 */
const isStringLiteral = string => {
	return ['"', "'"]
		.some(character => {
			return string.startsWith(character) &&
				string.endsWith(character)
		})
}

/**
 * convert a predicate string expression to the equivalent object
 * @param {object} config predicate config with string expression
 * @returns {object} predicate config with object
 */
const stringPredicate = config => {
	if (!config.includes(' ')) {
		throw new Error('string predicates must use spaces')
	}
	const [a, b, ...rest] = config.split(' ')
	const operators = {
		'==': 'equal',
		'===': 'equal',
		'>': 'gt',
		'>=': 'gte',
		'<': 'lt',
		'<=': 'lte'
	}
	const result = {}
	const field = a.split('.').pop()
	const operator = operators[b]
	const value = rest.join(' ')
	result.field = field
	result[operator] = isStringLiteral(value) ? value.slice(1, -1) : +value
	return result
}

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
 * @param {object|string} _config predicate definition
 * @returns {function(object)} predicate test function
 */
const single = _config => {
	const converter = typeof _config === 'string' ? stringPredicate : identity
	const config = converter(_config)
	const [key, create] = Object.entries(predicates).find(([key]) => config[key])
	if (typeof create === 'function') {
		return create(config)
	} else {
		throw new Error(`could not create ${key} predicate function for data field ${config.field}`)
	}
}

/**
 * compose a single predicate function based on multiple predicate definitions
 * @param {object} config predicate definition
 * @returns {function(object)} predicate test function
 */
const compose = config => {
	const key = ['and', 'or', 'not'].find(key => config[key])
	const functions = config[key].map(single)
	const predicates = {
		and: datum => functions.every(fn => fn(datum) === true),
		not: datum => functions.every(fn => fn(datum) === false),
		or: datum => functions.some(fn => fn(datum) === true)
	}
	return predicates[key]
}

/**
 * generate a predicate test function
 * @param {object} config predicate definition
 * @returns {function(object)} predicate test function
 */
const _predicate = config => {
	const multiple = config.and || config.or || config.not
	try {
		if (multiple) {
			return compose(config)
		} else {
			return single(config)
		}
	} catch (error) {
		error.message = `could not create predicate function - ${error.message}`
		throw error
	}
}
const predicate = memoize(_predicate)

export { predicate }
