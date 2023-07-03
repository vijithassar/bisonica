/**
 * render a menu alongside the chart content
 * @module menu
 * @see {@link module:download}
 */

import * as d3 from 'd3'
import { feature } from './feature.js'
import { extension } from './extensions.js'
import { key } from './helpers.js'
import { download } from './download.js'

/**
 * create a menu configuration object for a data download
 * @param {object} s Vega Lite specification
 * @param {'csv'|'json'} format data format
 * @return {object} menu item configuration object
 */
const item = (s, format) => {
	return { text: format, href: download(s, format) }
}

/**
 * determine menu content
 * @param {object} s Vega Lite specification
 * @return {object[]} menu item configuration objects
 */
const items = s => {
	const download = feature(s).hasDownload() && extension(s, 'download')
	return [
		download?.csv !== false ? item(s, 'csv') : null,
		download?.json !== false ? item(s, 'json') : null,
		feature(s).hasTable() ? { text: 'table' } : null,
		...(extension(s, 'menu')?.items ? extension(s, 'menu')?.items : [])
	].filter(Boolean)
}

/**
 * render menu
 * @param {object} s Vega Lite specification
 * @return {function(object)} menu renderer
 */
const menu = s => {
	return selection => {
		selection
			.select('.menu')
			.append('ul')
			.selectAll('li')
			.data(items(s))
			.enter()
			.append('li')
			.attr('data-menu', item => item ? key(item.text) : null)
			.classed('item', true)
			.each(function(item) {
				const tag = item.href ? 'a' : 'button'
				d3.select(this)
					.append(tag)
					.text(item => item.text)
					.attr('href', item.href ? item.href : null)
			})
	}
}

export { menu }
