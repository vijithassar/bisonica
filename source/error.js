/**
 * augment errors with useful diagnostic information
 * @module error
 */

/**
 * add diagnostic information to an error object
 * @param {Error} error error object
 * @param {string} addition additional diagnostic information
 * @return {Error} error object with additional diagnostic information
 */
const extendError = (error, addition) => {
	error.message = `${addition} - ${error.message}`
	throw error
}

export { extendError }
