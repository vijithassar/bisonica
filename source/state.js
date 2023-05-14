/**
 * store current keyboard navigation position in a closure
 * @returns {object} methods for modifying keyboard position state
 */
const createState = () => {
	let index

	return {
		init() {
			if (index === undefined) {
				index = 0
			}
		},
		index(n) {
			return n === undefined ? index : ((index = n), true)
		}
	}
}

export { createState }
