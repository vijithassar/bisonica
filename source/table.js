import { extension } from './extensions.js'
import { noop, values } from './helpers.js'
import { encodingField } from './encodings.js'
import { layerPrimary } from './views.js'
import { markData } from './marks.js'

/**
 * render table header
 * @param {object} s Vega Lite specification
 * @returns {function(object)} header renderer
 */
const header = s => {
	const columns = Object.keys(s.encoding).map(channel => encodingField(s, channel))
	return selection => {
		const header = selection
			.append('table')
			.append('tr')
		header
			.selectAll('td')
			.data(columns)
			.enter()
			.append('td')
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
		selection
			.select('table')
			.append('tbody')
			.selectAll('tr')
			.data(values(s))
			.enter()
			.append('tr')
			.selectAll('td')
			.data(d => Object.values(d))
			.enter()
			.append('td')
			.text(d => d)
			.attr('class', d => typeof d === 'number' ? 'quantitative' : null)
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
const table = (_s, options) => {
	const s = layerPrimary(_s)
	if (extension(s, 'table') === null) {
		return noop
	}
	return selection => {
		const table = selection.append('div').classed('table', true)
		table.call(header(s))
		table.call(rows(s))
	}
}

export { table, tableOptions }
