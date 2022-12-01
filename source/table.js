import { extension } from './extensions.js'
import { noop, values } from './helpers.js'
import { encodingField } from './encodings.js'
import { markData } from './marks.js'
import { layerPrimary } from './views.js'

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
 * render table
 * @param {object} _s Vega Lite specification
 * @returns {function(object)} table renderer
 */
const table = _s => {
	const s = layerPrimary(_s)
	if (extension(s, 'table') === null) {
		return noop
	}
	return selection => {
		const config = extension(s, 'table')?.renderer
		if (config?.renderer) {
			config.renderer(s, selection, { data: { raw: values(s), marks: markData(s) } })
			return
		}
		const table = selection.append('div').classed('table', true)
		table.call(header(s))
		table.call(rows(s))
	}
}

export { table }
