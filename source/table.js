import { extension } from './extensions.js'
import { noop } from './helpers.js'

/**
 * render table header
 * @param {object} s Vega Lite specification
 * @returns {function(object)} header renderer
 */
const header = s => {
	return selection => {
		console.log(s)
	}
}

/**
 * render table rows
 * @param {object} s Vega Lite specification
 * @returns {function(object)} rows renderer
 */
const rows = s => {
	return selection => {
		console.log(s)
	}
}

/**
 * render table
 * @param {object} s Vega Lite specification
 * @returns {function(object)} table renderer
 */
const table = s => {
	if (extension(s, 'table') === null) {
		return noop
	}
	return selection => {
		const table = selection.append('div').classed('table', true)
		table.call(header(s))
		table.call(rows(s))
	}
}

export { table }
