/**
 * store the current state of a chart
 * @module state
 * @see {@link module:interactions}
 */

/**
 * store current keyboard navigation position in a closure
 * @returns {object} methods for modifying keyboard position state
 */
const createState = () => {
	let index

	return {
		init() {
			if (typeof index === 'undefined') {
				index = 0
			}
		},
		index(n) {
			return typeof n === 'undefined' ? index : ((index = n), true)
		}
	}
}

export { createState }
