/**
 * render a table of data values to accompany the graphic
 * @module table
 */

import { extension } from './extensions.js'
import { deduplicateByField, noop, show, hide } from './helpers.js'
import { encodingField } from './encodings.js'
import { layerPrimary } from './views.js'
import { markData } from './marks.js'
import { parseScales } from './scales.js'
import { values } from './values.js'
import { feature } from './feature.js'

const tableSelector = '.chart > .table'
const legendSelector = '.chart .legend'
const graphicSelector = '.chart .graphic'
const toggleSelector = '.menu [data-menu="table"] a'

/**
 * create the outer DOM for the table
 * @param {object} s Vega Lite specification
 * @return {function(object)} table setup function
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
 * @return {string[]} array of column names
 */
const channels = s => deduplicateByField(s)(Object.keys(s.encoding))

/**
 * column encoding fields
 * @param {object} s Vega Lite specification
 * @return {string[]} array of column encoding fields
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
 * @return {function(object)} function to convert a datum into key/value pairs
 */
const columnEntries = s => {
	return d => Object.entries(d)
		.sort((a, b) => fields(s).indexOf(a[0]) - fields(s).indexOf(b[0]))
}

/**
 * render table header
 * @param {object} s Vega Lite specification
 * @return {function(object)} header renderer
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
 * @return {function(object)} rows renderer
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
 * @return {object} options for table rendering
 */
const tableOptions = s => {
	return { data: { marks: markData(layerPrimary(s)) } }
}

/**
 * render table
 * @param {object} _s Vega Lite specification
 * @param {object} options table options
 * @return {function(object)} table renderer
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

/**
 * toggle the content from a graphic to a table
 * @param {object} s Vega Lite specification
 * @param {function} renderer custom table rendering function
 * @return {function(object)} table toggle interaction function
 */
const tableToggle = (s, renderer) => {
	// input selection must be the outer chart wrapper
	// which includes both menu and content
	return selection => {
		if (!feature(s).hasTable()) {
			return
		}
		const toggle = selection.select(toggleSelector)
		const table = selection.select(tableSelector)
		const graphic = selection.select(graphicSelector)
		const legend = selection.select(legendSelector)
		toggle.on('click', function(event) {
			event.preventDefault()
			table.html('')
			const values = ['table', 'graphic']
			const previous = toggle.text()
			const next = values.filter(value => value !== previous).pop()
			if (previous === 'table') {
				table.call(renderer(s, tableOptions(s)))
				graphic.call(hide)
				legend.call(hide)
			} else if (previous === 'graphic') {
				graphic.call(show)
				legend.call(show)
			}
			toggle.text(next)
		})
	}
}

export { table, tableToggle }
