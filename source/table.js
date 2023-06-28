/**
 * render a table of data values to accompany the graphic
 * @module table
 */

import { extension } from './extensions.js'
import { deduplicateByField, noop } from './helpers.js'
import { encodingField } from './encodings.js'
import { layerPrimary } from './views.js'
import { markData } from './marks.js'
import { parseScales } from './scales.js'
import { values } from './values.js'

/**
 * create the outer DOM for the table
 * @param {object} s Vega Lite specification
 * @returns {function(object)} table setup function
 */
const setup = s => {
	return selection => {
		selection
			.append('table')
			.append('caption')
			.text(s.title.text)
	}
}

/**
 * column headers
 * @param {object} s Vega Lite specification
 * @returns {string[]} array of column names
 */
const channels = s => deduplicateByField(s)(Object.keys(s.encoding))

/**
 * column encoding fields
 * @param {object} s Vega Lite specification
 * @returns {string[]} array of column encoding fields
 */
const fields = s => {
	const encodings = channels(s).map(channel => encodingField(s, channel))
	const first = values(s)[0]
	const other = Object.keys(first).filter(item => !encodings.includes(item))
	return [...encodings, ...other]
}

/**
 * create an ordered datum for data binding
 * @param {object} s datum
 * @returns {function(object)} function to convert a datum into key/value pairs
 */
const columnEntries = s => {
	return d => Object.entries(d)
		.sort((a, b) => fields(s).indexOf(a[0]) - fields(s).indexOf(b[0]))
}

/**
 * render table header
 * @param {object} s Vega Lite specification
 * @returns {function(object)} header renderer
 */
const header = s => {
	return selection => {
		const header = selection
			.select('table')
			.append('thead')
			.append('tr')
		header
			.selectAll('td')
			.data(fields(s))
			.enter()
			.append('td')
			.attr('scope', 'col')
			.text(d => d)
	}
}

/**
 * render table rows
 * @param {object} s Vega Lite specification
 * @returns {function(object)} rows renderer
 */
const rows = s => {
	return selection => {
		const cell = selection
			.select('table')
			.append('tbody')
			.selectAll('tr')
			.data(values(s))
			.enter()
			.append('tr')
			.attr('scope', 'row')
			.selectAll('td')
			.data(d => columnEntries(s)(d))
			.enter()
			.append('td')
			.text(([_, value]) => value)
			.attr('class', ([_, value]) => typeof value === 'number' ? 'quantitative' : null)
		if (s.encoding.color?.field) {
			cell.filter(([key]) => key === encodingField(s, 'color'))
				.append('div')
				.style('background-color', ([_, value]) => parseScales(s).color(value))
		}
	}
}

/**
 * compile options to pass to an external table renderer
 * @param {object} s Vega Lite specification
 * @returns {object} options for table rendering
 */
const tableOptions = s => {
	return { data: { marks: markData(layerPrimary(s)) } }
}

/**
 * render table
 * @param {object} _s Vega Lite specification
 * @returns {function(object)} table renderer
 */
const table = (_s, options) => { // eslint-disable-line no-unused-vars
	const s = layerPrimary(_s)
	if (extension(s, 'table') === null) {
		return noop
	}
	return selection => {
		selection
			.call(setup(_s))
			.call(header(s))
			.call(rows(s))
	}
}

export { table, tableOptions }
