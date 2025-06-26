const extendError = (error, addition) => {
	error.message = `${addition} - ${error.message}`
	throw error
}

export { extendError }
