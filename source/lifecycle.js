import { WRAPPER_CLASS } from './config.js'
import { feature } from './feature.js'
import { extension } from './extensions.js'
import { chartLabel, chartDescription } from './descriptions.js'
import { detach } from './helpers.js'
import { fetchAll } from './fetch.js'

/**
 * prepare the DOM of a specified element for rendering a chart
 * @param {object} s Vega Lite specification
 * @param {object} dimensions desired dimensions of the chart
 */
const setupNode = (s, dimensions) => {
	const initializer = selection => {
		selection.html('')

		const chartNode = selection.append('div').classed('chart', true)

		const graphic = chartNode.append('div').classed('graphic', true)

		if (feature(s).hasLegend()) {
			chartNode.append('div').classed('legend', true)
		}

		if (feature(s).hasTable()) {
			chartNode.append('div').classed('table', true)
		}

		const svg = graphic.append('svg')

		svg.attr('tabindex', 0)

		const wrapper = svg.append('g').classed(WRAPPER_CLASS, true)

		svg.attr('width', dimensions.x)
		svg.attr('role', 'document')

		if (!s.title?.text) {
			throw new Error('specification title is required')
		}

		svg.attr('aria-label', chartLabel(s))
		svg.attr('aria-description', chartDescription(s))

		if (feature(s).hasAxis()) {
			const axes = wrapper.append('g').classed('axes', true)

			axes.attr('aria-hidden', true)

			if (feature(s).hasEncodingX()) {
				axes.append('g').attr('class', 'x')
			}

			if (feature(s).hasEncodingY()) {
				axes.append('g').attr('class', 'y')
			}
		}

		const id = extension(s, 'id')

		if (id) {
			svg.attr('aria-labelledby', `title-${id}`)
		}
	}

	return detach(initializer)
}

const init = s => {
	return fetchAll(s)
}

export { setupNode, init }
