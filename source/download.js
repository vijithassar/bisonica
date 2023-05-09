import { extension } from './extensions.js'
import { noop } from './helpers.js'
import { values } from './values.js'
import { csvFormat } from 'd3'
import { feature } from './feature.js'

const formats = ['csv', 'json']

/**
 * render download links
 * @param {object} s Vega Lite specification
 * @returns {function(object)} download link renderer
 */
const download = s => {
	if (!feature(s).hasDownload()) {
		return noop
	}
	const handler = event => {
		const format = event.target.innerText
		let file
		if (format === 'csv') {
			file = new Blob([csvFormat(values(s))], { type: 'text/csv' })
		} else if (format === 'json') {
			file = new Blob([JSON.stringify(s)], { type: 'text/json' })
		}
		window.open(URL.createObjectURL(file))
	}
	return selection => {
		selection.append('h3').text('download')
		formats.forEach(format => {
			if (extension(s, 'download')?.[format] !== false) {
				selection
					.append('a')
					.text(format)
					.on('click', handler)
			}
		})
	}
}

export { download }
