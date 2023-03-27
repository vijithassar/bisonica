import * as d3 from 'd3'

import { dispatchers } from './interactions.js'
import { encodingField } from './encodings.js'
import { feature } from './feature.js'
import { key, mark, noop } from './helpers.js'
import { layerPrimary } from './views.js'
import { parseScales } from './scales.js'
import { renderStyles } from './styles.js'
import { list } from './text.js'

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
 * look up the title of the legend
 * @param {object} s Vega Lite specification
 * @returns {string} legend title
 */
const legendTitle = s => {
	return s.encoding.color.legend?.title || encodingField(s, 'color')
}

/**
 * generate a written description for the legend
 * @param {object} s Vega Lite specification
 * @returns {string} legend description
 */
const legendDescription = s => {
	const description = s.encoding.color.legend?.description
	if (description) {
		return description
	}
	const domain = parseScales(s).color.domain()
	return `${mark(s)} legend titled '${legendTitle(s)}' with ${domain.length} values: ${list(domain)}`
}

/**
 * test whether a node is overflowing
 * @param {object} node DOM node
 * @returns {boolean}
 */
const isOverflown = ({ clientWidth, clientHeight, scrollWidth, scrollHeight }) => {
	return scrollHeight > clientHeight || scrollWidth > clientWidth
}

const legendStyles = {
	cornerRadius: 'border-radius',
	fillColor: 'background-color',
	padding: 'padding'
}

/**
 * style the legend based on the specification
 * @param {object} s Vega Lite specification
 * @returns {function(object)} legend style renderer
 */
const legendStyle = s => renderStyles(legendStyles, s.encoding?.color?.legend)

/**
 * color scale legend
 * @param {object} _s Vega Lite specification
 * @returns {function} renderer
 */
const color = _s => {
	let s = feature(_s).hasLayers() ? layerPrimary(_s) : _s

	const renderer = selection => {
		try {
			const { color } = parseScales(s)
			const dispatcher = dispatchers.get(selection.node())

			if (s.encoding.color.legend?.aria !== false) {
				selection.attr('aria-description', legendDescription(s))
			} else {
				selection.attr('aria-hidden', true)
			}

			selection.call(legendStyle(s))

			if (feature(s).hasLegendTitle()) {
				selection.append('h3').text(legendTitle(s))
			}

			const main = selection.append('div').classed('items-main', true).append('ul')
			const more = d3.create('ul').classed('items-more', true)
			const moreHeader = more.append('h3')

			let target = main

			const items = color.domain()
				.filter(item => {
					return s.encoding.color?.legend?.values ? s.encoding.color.legend.values.includes(item) : true
				})
				.map((label, index) => {
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

			const addLegendHighlight = group => {
				selection
					.selectAll('.pair')
					.filter(function() {
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
const legend = s => {
	if (feature(s).hasLegend() && (feature(s).isMulticolor() || feature(s).isCircular())) {
		return color(s)
	} else {
		return noop
	}
}

export { legend }
