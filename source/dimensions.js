import { feature } from './feature.js'
import { isContinuous } from './helpers.js'
import { markData } from './marks.js'

const channels = {
	x: 'width',
	y: 'height'
}

/**
 * determine rendering size for chart
 * @param {object} s Vega Lite specification
 * @param {HTMLElement} node DOM node
 * @param {object} [explicitDimensions] chart dimensions
 * @returns {object} chart dimensions
 */
const dimensions = (s, node, explicitDimensions) => {
	let result = { x: null, y: null }
	const marks = feature(s).isBar() ? markData(s)[0].length : 1
	Object.entries(channels).forEach(([channel, dimension]) => {
		if (explicitDimensions?.[channel]) {
			result[channel] = explicitDimensions[channel]
		} else if (s[dimension]) {
			if (s[dimension] === 'container') {
				result[channel] = node.getBoundingClientRect()[dimension]
			} else if (s[dimension].step) {
				result[channel] = s[dimension].step * marks
			} else if (typeof s[dimension] === 'number') {
				result[channel] = s[dimension]
			}
		}
		if (feature(s).isCartesian() || feature(s).isLinear()) {
			if (!result[channel]) {
				if (isContinuous(s, channel)) {
					result[channel] = 200
				} else {
					result[channel] = marks * 20
				}
			}
		}
	})
	return result
}

export { dimensions }
