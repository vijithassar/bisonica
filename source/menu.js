import { feature } from './feature.js'
import { extension } from './extensions.js'
import { download } from './download.js'

/**
 * determine menu content
 * @param {object} s Vega Lite specification
 * @returns {string[]} menu items
 */
const items = s => {
	const download = feature(s).hasDownload() && extension(s, 'download')
	return [
		download?.csv !== false ? 'csv' : null,
		download?.json !== false ? 'json' : null
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
			.attr('data-menu', item => item)
			.classed('item', true)
			.append('a')
			.text(item => item)
			.attr('href', item => download(s, item))
	}
}

export { menu }
