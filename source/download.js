/**
 * convert values into files containing raw data which the user can then download
 * @module download
 * @see {@link module:menu}
 */

import { extension } from './extensions.js'
import { values } from './values.js'
import { csvFormat } from 'd3'
import { memoize } from './memoize.js'
import { feature } from './feature.js'

/**
 * render download links
 * @param {specification} s Vega Lite specification
 * @param {'csv'|'json'} format data format
 * @return {string} download url
 */
const _download = (s, format) => {
	if (extension(s, 'download')?.[format] === false || !values(s) || !feature(s).hasDownload()) {
		return
	}
	let mime = `text/${format}`
	let content
	if (format === 'csv') {
		content = csvFormat(values(s))
	} else if (format === 'json') {
		content = JSON.stringify(s)
	}
	if (URL && Blob) {
		const file = new Blob([content], { type: mime })
		return URL?.createObjectURL(file)
	}
}
const download = memoize(_download)

export { download }
