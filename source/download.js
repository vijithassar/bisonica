import { extension } from './extensions.js'
import { noop } from './helpers.js'
import { values } from './values.js'
import { csvFormat } from 'd3'
import { feature } from './feature.js'
import { memoize } from './memoize.js'

const formats = ['csv', 'json']

/**
 * create a data download URL
 * @param {object} s Vega Lite specification
 * @param {'csv'|'json'} format data format
 */
const _url = (s, format) => {
	let file
	if (format === 'csv') {
		file = new Blob([csvFormat(values(s))], { type: 'text/csv' })
	} else if (format === 'json') {
		file = new Blob([JSON.stringify(s)], { type: 'text/json' })
	}
	const url = URL.createObjectURL(file)
	return url
}
const url = memoize(_url)

/**
 * render download links
 * @param {object} s Vega Lite specification
 * @returns {function(object)} download link renderer
 */
const download = s => {
	if (!feature(s).hasDownload()) {
		return noop
	}
	return selection => {
		selection.append('h3').text('download')
		formats.forEach(format => {
			if (extension(s, 'download')?.[format] === false || !values(s)) {
				return
			}
			selection
				.append('a')
				.text(format)
				.attr('href', url(s, format))
		})
	}
}

export { download }
