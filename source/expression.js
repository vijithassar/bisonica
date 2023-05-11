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

export { expression }
