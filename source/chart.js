import { WRAPPER_CLASS } from './config.js'
import { audio } from './audio.js'
import { axes } from './axes.js'
import { init } from './lifecycle.js'
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

/**
 * generate chart rendering function based on
 * a Vega Lite specification
 * @param {object} s Vega Lite specification
 * @param {object} panelDimensions chart dimensions
 * @returns {function} renderer
 */
const chart = (s, panelDimensions) => {
	let tooltipHandler
	let errorHandler = console.error
	let tableRenderer = table

	const renderer = selection => {
		try {
			selection.html('')

			selection.call(init(s, panelDimensions))

			initializeInteractions(selection.node(), s)

			const chartNode = selection.select('div.chart')

			chartNode.call(audio(s))

			initializeInteractions(chartNode.node(), s)

			if (feature(s).hasTable()) {
				chartNode.select('.table').call(tableRenderer(s, tableOptions(s)))
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

export { chart }
