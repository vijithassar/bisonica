/**
 * render a menu alongside the chart content
 * @module menu
 * @see {@link module:download}
 */

import { feature } from './feature.js'
import { extension } from './extensions.js'
import { key } from './helpers.js'
import { download } from './download.js'

/**
 * create a menu configuration object for a data download
 * @param {object} s Vega Lite specification
 * @param {'csv'|'json'} format data format
 * @returns {object} menu item configuration object
 */
const item = (s, format) => {
	return { text: format, href: download(s, format) }
}

/**
 * determine menu content
 * @param {object} s Vega Lite specification
 * @returns {object[]} menu item configuration objects
 */
const items = s => {
	const download = feature(s).hasDownload() && extension(s, 'download')
	return [
		download?.csv !== false ? item(s, 'csv') : null,
		download?.json !== false ? item(s, 'json') : null,
		...(extension(s, 'menu')?.items ? extension(s, 'menu')?.items : [])
	].filter(Boolean)
}

/**
 * render menu
 * @param {object} s Vega Lite specification
 * @returns {function(object)} menu renderer
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
			.attr('data-menu', item => key(item.text))
			.classed('item', true)
			.append('a')
			.text(item => item.text)
			.attr('href', item => item.href)
	}
}

export { menu }
