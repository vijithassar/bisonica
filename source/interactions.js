import * as d3 from 'd3'

import { category, markInteractionSelector, markSelector } from './marks.js'
import { customLinkHandler } from './config.js'
import { feature } from './feature.js'
import { getUrl, key, noop } from './helpers.js'
import { layerCall, layerNode } from './views.js'
import { tooltipEvent } from './tooltips.js'

const dispatchers = d3.local()
const charts = d3.local()

/**
 * events to listen for
 * @param {object} s Vega Lite specification
 * @returns {array} list of event names
 */
const events = (s) => {
	if (
		feature(s).isBar() ||
    feature(s).isArea() ||
    feature(s).isCircular() ||
    feature(s).isLine() ||
    feature(s).isRule() ||
    feature(s).isText() ||
    (!feature(s).isLine() && feature(s).hasPoints())
	) {
		return [
			'addLegendHighlight',
			'removeLegendHighlight',
			'addMarkHighlight',
			'removeMarkHighlight',
			'link',
			'tooltip',
			'play',
			'focus'
		]
	}
}

/**
 * events to listen for
 * @param {object} node parent node
 * @param {object} s Vega Lite specification
 */
const initializeInteractions = (node, s) => {
	const dispatcher = d3.dispatch(...(events(s) || []))

	dispatchers.set(node, dispatcher)
	// allow child nodes to retrieve the parent using d3.local()
	charts.set(node, node)
}

/**
 * select nodes to manipulate with interactions
 * @param {object} s Vega Lite specification
 * @param {object} wrapper chart wrapper selection
 * @param {object} node current mark node
 * @returns {object} nodes
 */
const interactionTargets = (s, wrapper, node) => {
	const series = wrapper.select('.marks').selectAll('.series')
	const mark = wrapper.select('.marks').selectAll(markSelector(s))
	let target = node
	let parent

	if (feature(s).isCircular() || (!feature(s).isLine() && feature(s).hasPoints())) {
		parent = mark.node()
	} else if (feature(s).isBar()) {
		parent = series.filter((d) => key(d.key) === key(category.get(node))).node()
	}

	return { target, parent }
}

/**
 * determine selectors to which interactions are attached
 * @param {object} s Vega Lite specification
 * @returns {string} selector
 */
const markMouseoverSelector = (s) => {
	return feature(s).isLine()
		? `${markSelector(s)},${markInteractionSelector(s)}`
		: markInteractionSelector(s)
}

/**
 * dispatch a CustomEvent with a URL from a node
 * @param {object} node node
 * @param {string} url url
 */
const handleUrl = (url, node) => {
	if (typeof url !== 'string') {
		console.error(`cannot link to url of type ${typeof url}`)
	}

	if (typeof customLinkHandler === 'function') {
		customLinkHandler(url, node)
	} else if (!customLinkHandler) {
		window.open(url)
	}

	const event = new CustomEvent('link', { bubbles: true, detail: { url } })

	node.dispatchEvent(event)
}

/**
 * attach event listeners to a layer
 * @param {object} s Vega Lite specification
 * @returns {function} user interactions
 */
const _interactions = (s) => {

	const fn = (wrapper) => {
		if (!s) {
			return noop
		}

		const dispatcher = dispatchers.get(wrapper.node())

		const markMouseover = () => {
			const layer = layerNode(s, wrapper.node())
			const mouseover = d3.select(layer).selectAll(markMouseoverSelector(s))
			const click = d3.select(layer).selectAll(markInteractionSelector(s))
			const tooltip = d3.select(layer).selectAll(markInteractionSelector(s))

			if (
				feature(s).isBar() ||
        feature(s).isLine() ||
        feature(s).isCircular() ||
        feature(s).isText() ||
        (!feature(s).isLine() && feature(s).hasPoints())
			) {
				dispatcher.on('addMarkHighlight', function () {
					// this use of selection.raise() sometimes steals focus
					// from the active node, so make sure it is reset
					const active = document.activeElement

					const { target, parent } = interactionTargets(s, wrapper, this)

					if (parent) {
						d3.select(parent).order()
						d3.select(parent).raise()
					}

					d3.select(target).raise()
					d3.select(target).attr('data-highlight', true)

					// the .focus() method is not officially supported on SVG
					// elements per the formal specification, but informally
					// it works

					// @ts-ignore
					active.focus()
				})

				// highlighting
				dispatcher.on('removeMarkHighlight', function () {
					const { target } = interactionTargets(s, wrapper, this)

					d3.select(target).attr('data-highlight', null)
				})
				mouseover
					.on('mouseover.highlight', function () {
						dispatcher.call('addMarkHighlight', this)
						dispatcher.call('addLegendHighlight', null, category.get(this))
					})
					.on('mouseout.highlight', function () {
						dispatcher.call('removeMarkHighlight', this)
						dispatcher.call('removeLegendHighlight', this)
					})

				// tooltips
				dispatcher.on('tooltip', function (event, s) {
					if (s) {
						tooltipEvent(s, this, event)
					}
				})

				// focus
				dispatcher.on('focus', function (event, s) {
					dispatcher.call('tooltip', null, event, s)
					dispatcher.call('addMarkHighlight', null)
				})

				tooltip.on('mouseover.tooltip', function (event) {
					if (feature(s).hasTooltip()) {
						dispatcher.call('tooltip', this, event, s)
					}
				})

				// pivot links
				dispatcher.on('link', function (url) {
					if (url) {
						handleUrl(url, this)
					}
				})
				click.on('click', function () {
					if (feature(s).hasLinks()) {
						const url = getUrl(s, d3.select(this).datum() || null)
						dispatcher.call('link', this, url)
					}
				})
			}
		}

		markMouseover()

		const legendMouseover = () => {
			const legendMouseoverSelector = '.category'
			const chart = d3.select(charts.get(wrapper.node()))
			const legendMouseover = chart.select('.legend').selectAll(legendMouseoverSelector)

			legendMouseover.on('mouseover', function () {
				const legendCategory = key(d3.select(this).select('.label').text())

				dispatcher.call('addLegendHighlight', null, legendCategory)
				wrapper
					.selectAll(markMouseoverSelector(s))
					.filter(function () {
						return legendCategory === key(category.get(this))
					})
					.each(function () {
						dispatcher.call('addMarkHighlight', this)
					})
			})
			legendMouseover.on('mouseout', function () {
				dispatcher.call('removeLegendHighlight')
				wrapper.selectAll(markMouseoverSelector(s)).each(function () {
					dispatcher.call('removeMarkHighlight', this)
				})
			})
		}

		legendMouseover()
	}

	return fn
}

const interactions = (s) => layerCall(s, _interactions)

export { dispatchers, initializeInteractions, interactions }
