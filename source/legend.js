/**
 * legend rendering
 * @module legend
 * @see {@link module:interactions}
 * @see {@link https://vega.github.io/vega-lite/docs/legend.html|vega-lite:legend}
 */

import * as d3 from 'd3'
import { extendError } from './error.js'

import { dispatchers } from './interactions.js'
import { encodingField } from './encodings.js'
import { feature } from './feature.js'
import { key, mark } from './helpers.js'
import { layerPrimary } from './views.js'
import { extension } from './extensions.js'
import { parseScales } from './scales.js'
import { renderStyles } from './styles.js'
import { list } from './text.js'

/**
 * color scale legend item
 * @param {object} config name and color
 * @return {object} DOM node
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
 * @param {specification} s Vega Lite specification
 * @return {string} legend title
 */
const legendTitle = s => {
	return s.encoding.color.legend?.title || s.encoding.color.title || encodingField(s, 'color')
}

/**
 * a string for identifiying the legend in the DOM
 * @param {specification} s specification
 * @return {string|null} legend title identifier string
 */
const legendIdentifier = s => {
	if (extension(s, 'id')) {
		return `legend-title-${extension(s, 'id')}`
	} else {
		return null
	}
}

/**
 * generate a written description for the legend
 * @param {specification} s Vega Lite specification
 * @return {string} legend description
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
 * @param {number} node.clientWidth client width
 * @param {number} node.clientHeight client height
 * @param {number} node.scrollWidth scroll width
 * @param {number} node.scrollHeight scroll height
 * @return {boolean}
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
 * @param {specification} s Vega Lite specification
 * @return {function(object)} legend style renderer
 */
const legendStyle = s => renderStyles(legendStyles, s.encoding?.color?.legend)

/**
 * legend item configuration
 * @param {specification} s Vega Lite specification
 * @param {number} index item in legend
 * @return {object} object describing the legend item
 */
const itemConfig = (s, index) => {
	const scales = parseScales(s)
	const label = scales.color.domain()[index]
	const color = scales.color.range()[index]
	const itemConfig = {
		group: label,
		color
	}
	return itemConfig
}

/**
 * items to plot in swatch legend
 * @param {specification} s Vega Lite specification
 * @return {string[]} domain for legend
 */
const swatches = s => {
	return parseScales(s).color.domain()
		.filter(item => {
			return s.encoding.color?.legend?.values ? s.encoding.color.legend.values.includes(item) : true
		})
}

/**
 * discrete swatch legend
 * @param {specification} s Vega Lite specification
 * @return {function(object)} renderer
 */
const swatch = s => {
	const renderer = selection => {
		const titleIdentifier = feature(s).hasLegendTitle() ? selection.select('h3').attr('id') : null
		try {
			const dispatcher = dispatchers.get(selection.node())

			const channels = [
				'color'
			]

			if (channels.every(channel => s.encoding[channel].legend?.aria !== false)) {
				selection.attr('aria-description', legendDescription(s))
			} else {
				selection.attr('aria-hidden', true)
			}

			selection.call(legendStyle(s))

			const main = selection.append('div').classed('items-main', true).append('ul')
			const more = d3.create('ul').classed('items-more', true)
			const moreHeader = more.append('h3')

			main.attr('aria-labelledby', titleIdentifier)

			let target = main

			const items = swatches(s).map((_, index) => createLegendItem(itemConfig(s, index)))

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
			extendError(error, 'could not render legend')
		}
	}

	return renderer
}

/**
 * render chart legend
 * @param {object} _s Vega Lite specification
 * @return {function(object)} renderer
 */
const legend = _s => {
	let s = feature(_s).hasLayers() ? layerPrimary(_s) : _s
	const id = legendIdentifier(_s)
	return selection => {
		if (feature(s).hasLegendTitle()) {
			const title = selection
				.append('h3')
				.classed('title', true)
				.text(legendTitle(s))
			if (id) {
				title.attr('id', id)
			}
		}
		if (feature(s).hasLegend() && (feature(s).isMulticolor() || feature(s).isCircular())) {
			selection.call(swatch(s))
		}
	}
}

export { legend }
