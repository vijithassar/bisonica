import * as d3 from 'd3'

import { dispatchers } from './interactions.js'
import { encodingField } from './encodings.js'
import { feature } from './feature.js'
import { key, noop } from './helpers.js'
import { layerPrimary } from './views.js'
import { parseScales } from './scales.js'

/**
 * color scale legend item
 * @param {object} config name and color
 * @returns {object} DOM node
 */
function createLegendItem(config) {
	const item = d3.create('li')

	item.attr('class', 'category pair')

	const color = d3.create('div')

	color.classed('color', true).style('background-color', config.color)

	const label = d3.create('div')

	label.classed('label', true).text(config.group)
	item.append(() => color.node())
	item.append(() => label.node())

	return item.node()
}

/**
 * test whether a node is overflowing
 * @param {object} node DOM node
 * @returns {boolean}
 */
const isOverflown = ({ clientWidth, clientHeight, scrollWidth, scrollHeight }) => {
	return scrollHeight > clientHeight || scrollWidth > clientWidth
}

/**
 * color scale legend
 * @param {object} _s Vega Lite specification
 * @returns {function} renderer
 */
const color = (_s) => {
	let s = feature(_s).hasLayers() ? layerPrimary(_s) : _s

	const renderer = (selection) => {
		try {
			const { color } = parseScales(s)
			const dispatcher = dispatchers.get(selection.node())

			if (feature(s).hasLegendTitle()) {
				const title = s.encoding.color.legend?.title
				const legendTitle = title || encodingField(s, 'color')

				selection.append('h3').text(legendTitle)
			}

			const main = selection.append('div').classed('items-main', true).append('ul')
			const more = d3.create('ul').classed('items-more', true)
			const moreHeader = more.append('h3')

			let target = main

			const items = color.domain().map((label, index) => {
				const itemConfig = {
					group: label,
					color: color.range()[index]
				}

				return createLegendItem(itemConfig)
			})

			target.node().append(...items)

			const transplantItem = () => {
				let node = main.select('li:last-of-type').remove().node()

				if (node) {
					more.append(() => node)
				}
			}

			if (isOverflown(selection.node())) {
				while (isOverflown(selection.node())) {
					transplantItem()
				}

				// one more for good measure
				transplantItem()

				main.append(() => more.node())
			}

			const moreCount = more.selectAll('li').size()

			moreHeader.text(`+ ${moreCount} more`)

			// respond to mouseover events

			const addLegendHighlight = (group) => {
				selection
					.selectAll('.pair')
					.filter(function () {
						return key(d3.select(this).text()) === key(group)
					})
					.attr('data-highlight', true)
			}

			const removeLegendHighlight = () => {
				selection.selectAll('.pair').attr('data-highlight', null)
			}

			if (dispatcher) {
				dispatcher.on('addLegendHighlight', addLegendHighlight)
				dispatcher.on('removeLegendHighlight', removeLegendHighlight)
			}
		} catch (error) {
			error.message = `could not render legend - ${error.message}`
			throw error
		}
	}

	return renderer
}

/**
 * render chart legend
 * @param {object} s Vega Lite specification
 * @returns {function} renderer
 */
const legend = (s) => {
	if (feature(s).hasLegend() && (feature(s).isMulticolor() || feature(s).isCircular())) {
		return color(s)
	} else {
		return noop
	}
}

export { legend }
