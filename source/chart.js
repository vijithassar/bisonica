import { WRAPPER_CLASS } from './config.js'
import { audio } from './audio.js'
import { axes } from './axes.js'
import { setupNode } from './lifecycle.js'
import { initializeInteractions, interactions } from './interactions.js'
import { keyboard } from './keyboard.js'
import { layerMarks } from './views.js'
import { legend } from './legend.js'
import { margin, position } from './position.js'
import { marks } from './marks.js'
import { testAttributes } from './markup.js'
import { usermeta } from './extensions.js'
import { table, tableOptions } from './table.js'
import { feature } from './feature.js'
import { fetchAll } from './fetch.js'
import { copyMethods } from './helpers.js'
import { download } from './download.js'

/**
 * generate chart rendering function based on
 * a Vega Lite specification
 * @param {object} s Vega Lite specification
 * @param {object} [_panelDimensions] chart dimensions
 * @returns {function(object)} renderer
 */
const render = (s, _panelDimensions) => {
	let tooltipHandler
	let errorHandler = console.error
	let tableRenderer = table

	const renderer = selection => {
		try {
			selection.html('')

			let panelDimensions
			if (_panelDimensions) {
				panelDimensions = _panelDimensions
			} else if (s.height && s.width) {
				panelDimensions = {
					x: s.width === 'container' ? selection.node().getBoundingClientRect().width : s.width,
					y: s.height === 'container' ? selection.node().getBoundingClientRect().height : s.height
				}
			}

			selection.call(setupNode(s, panelDimensions))

			initializeInteractions(selection.node(), s)

			const chartNode = selection.select('div.chart')

			chartNode.call(audio(s))

			initializeInteractions(chartNode.node(), s)

			if (feature(s).hasTable()) {
				chartNode.select('.table').call(tableRenderer(s, tableOptions(s)))
			}

			if (feature(s).hasDownload()) {
				chartNode.select('.download').call(download(s))
			}

			// render legend
			if (feature(s).hasLegend()) {
				chartNode.select('.legend').call(legend(s))
			}
			const legendHeight = chartNode.select('.legend').node()?.getBoundingClientRect().height || 0

			const svg = chartNode.select('svg')
			const imageHeight = panelDimensions.y - legendHeight

			svg.attr('height', Math.max(imageHeight, 0))

			const { top, right, bottom, left } = margin(s, panelDimensions)

			// subtract rendered height of legend from dimensions
			const dimensions = {
				x: panelDimensions.x - left - right,
				y: imageHeight - top - bottom
			}

			if (dimensions.y > 0) {
				const wrapper = chartNode
					.select('.graphic')
					.select('svg')
					.call(position(s, { x: panelDimensions.x, y: imageHeight }))
					.select(`g.${WRAPPER_CLASS}`)

				wrapper
					.call(axes(s, dimensions))
					.call((s.layer ? layerMarks : marks)(s, dimensions))
					.call(keyboard(s))
					.call(interactions(s))
				selection.call(testAttributes)
			}
		} catch (error) {
			errorHandler(error)
		}
	}

	renderer.table = t => {
		if (t === undefined) {
			return tableRenderer
		} else {
			if (typeof t === 'function') {
				tableRenderer = t
			}

			return renderer
		}
	}

	renderer.tooltip = h => {
		if (h === undefined) {
			return tooltipHandler
		} else {
			if (typeof h === 'function') {
				tooltipHandler = h
				usermeta(s)
				s.usermeta.tooltipHandler = true
			} else {
				throw new Error(`tooltip handler must be a function, but input was of type ${typeof h}`)
			}

			return renderer
		}
	}
	renderer.error = h => typeof h !== 'undefined' ? (errorHandler = h, renderer) : errorHandler

	return renderer
}

/**
 * convert a synchronous rendering function
 * into an asynchronous rendering function
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} asynchronous rendering function
 */
const asyncRender = (s, dimensions) => {
	const renderer = render(s, dimensions)
	const fn = selection => {
		fetchAll(s)
			.then(() => {
				selection.call(renderer)
			})
	}
	copyMethods(['error', 'tooltip', 'table'], renderer, fn)
	return fn
}

/**
 * optionally fetch remote data, then create and run
 * a chart rendering function
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} renderer
 */
const chart = (s, dimensions) => {
	if (s.data?.url || s.layer?.find(layer => layer.data?.url)) {
		return asyncRender(s, dimensions)
	} else {
		return render(s, dimensions)
	}
}

export { chart }
