const datumPrefix = 'datum.'

/**
 * create a function to perform a function execution
 * @param {string} str a calculate expression calling a single function
 * @returns {function} static function
 */
const functionExpression = str => {
	const fns = {
		random: () => Math.random(),
		now: () => Date.now(),
		windowSize: () => window ? [window.innerWidth, window.innerHeight] : [undefined, undefined],
		screen: () => window ? window.screen : {}
	}
	return fns[str.slice(0, -2)]
}

/**
 * create a function to perform a single string interpolation
 * @param {string} str a calculate expression describing string interpolation
 * @returns {function(object)} string interpolation function
 */
const stringExpression = str => {
	const segments = str
		.split('+')
		.map(item => item.trim())
		.map(item => {
			const interpolate = typeof item === 'string' && item.startsWith(datumPrefix)
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
				if (segment.startsWith(datumPrefix)) {
					const key = segment.slice(datumPrefix.length)

					return d[key]
				} else {
					return segment
				}
			})
			.join('')
}

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
const expressionStringParse = config => {
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

/**
 * create a function to perform a single calculate expression
 * @param {string} str expression
 * @returns {function} expression evaluation function
 */
const expression = str => {
	if (str.slice(-2) === '()') {
		return functionExpression(str)
	} else {
		return stringExpression(str)
	}
}

export { expression, expressionStringParse }
