/**
 * create a function to perform a single calculate expression
 * @param {string} str a calculate expression describing string interpolation
 * @returns {function} string interpolation function
 */
const expression = str => {
	const segments = str
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

export { expression }
