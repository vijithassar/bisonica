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
	let file
	if (format === 'csv') {
		file = new Blob([csvFormat(values(s))], { type: 'text/csv' })
	} else if (format === 'json') {
		file = new Blob([JSON.stringify(s)], { type: 'text/json' })
	}
	if (URL) {
		const url = URL?.createObjectURL(file)
		return url
	}
}
const download = memoize(_download)

export { download }
