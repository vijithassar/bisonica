/**
 * main wrapper function to render a chart
 * @module chart
 */

import './types.d.js'

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
import { table, tableToggle } from './table.js'
import { feature } from './feature.js'
import { fetchAll } from './fetch.js'
import { copyMethods } from './helpers.js'
import { defs } from './defs.js'
import { dimensions } from './dimensions.js'
import { menu } from './menu.js'
import { select } from 'd3'
import { extendError } from './error.js'

/**
 * resolve target input element to selection
 * if necessary
 * @param {HTMLElement|object} target HTML element or d3 selection
 * @return {object} d3 selection
 */
const resolveTarget = target => {
	return target instanceof Element ? select(target) : target
}

/**
 * generate chart rendering function based on
 * a Vega Lite specification
 * @param {specification} s Vega Lite specification
 * @param {dimensions} [_panelDimensions] chart dimensions
 * @return {function(object)} renderer
 */
const render = (s, _panelDimensions) => {
	let tooltipHandler
	let errorHandler = console.error
	let tableRenderer = table

	const handleError = error => {
		if (typeof errorHandler === 'function') {
			errorHandler(error)
		} else if (errorHandler === null) {
			throw error
		}
	}

	const renderer = selection => {
		selection = resolveTarget(selection)
		try {
			selection.html('')

			let panelDimensions = dimensions(s, selection.node(), _panelDimensions)

			selection.call(setupNode(s, panelDimensions))

			initializeInteractions(selection.node(), s)

			const chartNode = selection.select('div.chart')

			chartNode.call(audio(s))

			initializeInteractions(chartNode.node(), s)

			chartNode.call(menu(s))

			chartNode.call(tableToggle(s, tableRenderer))

			// render legend
			if (feature(s).hasLegend()) {
				chartNode.select('.legend').call(legend(s))
			}
			const legendHeight = chartNode.select('.legend').node()?.getBoundingClientRect().height || 0

			const svg = chartNode.select('svg')
			const imageHeight = panelDimensions.y - legendHeight

			svg.attr('height', Math.max(imageHeight, 0))

			svg.call(defs(s))

			const { top, right, bottom, left } = margin(s, panelDimensions)

			// subtract rendered height of legend from dimensions
			const graphicDimensions = {
				x: panelDimensions.x - left - right,
				y: imageHeight - top - bottom
			}

			if (graphicDimensions.y > 0) {
				const wrapper = chartNode
					.select('.graphic')
					.select('svg')
					.call(position(s, { x: panelDimensions.x, y: imageHeight }))
					.select(`g.${WRAPPER_CLASS}`)

				wrapper
					.call(axes(s, graphicDimensions))
					.call((s.layer ? layerMarks : marks)(s, graphicDimensions))
					.call(keyboard(s))
					.call(interactions(s))
				selection.call(testAttributes)
			}
		} catch (error) {
			handleError(error)
		}
	}

	renderer.table = t => {
		try {
			if (typeof t === 'undefined') {
				return tableRenderer
			} else {
				tableRenderer = t
				return renderer
			}
		} catch (error) {
			handleError(error)
		}
	}

	renderer.tooltip = h => {
		try {
			if (typeof h === 'undefined') {
				return tooltipHandler
			} else {
				tooltipHandler = h
				usermeta(s)
				s.usermeta.tooltipHandler = true
				return renderer
			}
		} catch (error) {
			handleError(error)
		}
	}

	renderer.error = h => typeof h !== 'undefined' ? (errorHandler = h, renderer) : errorHandler

	return renderer
}

/**
 * convert a synchronous rendering function
 * into an asynchronous rendering function
 * @param {specification} s Vega Lite specification
 * @param {dimensions} dimensions chart dimensions
 * @return {function(object)} asynchronous rendering function
 */
const asyncRender = (s, dimensions) => {
	const renderer = render(s, dimensions)
	const fn = selection => {
		selection = resolveTarget(selection)
		fetchAll(s)
			.then(() => {
				selection.call(renderer)
			})
			.catch(error => {
				extendError(error, 'could not render chart with remote data')
			})
	}
	copyMethods(['error', 'tooltip', 'table'], renderer, fn)
	return fn
}

/**
 * optionally fetch remote data, then create and run
 * a chart rendering function
 * @param {specification} s Vega Lite specification
 * @param {dimensions} [dimensions] chart dimensions
 * @return {function(object)} renderer
 */
const chart = (s, dimensions) => {
	if (s.data?.url || s.layer?.find(layer => layer.data?.url)) {
		return asyncRender(s, dimensions)
	} else {
		return render(s, dimensions)
	}
}

export { chart }
