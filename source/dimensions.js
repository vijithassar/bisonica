import { feature } from './feature.js'
import { markData } from './marks.js'

/**
 * determine rendering size for chart
 * @param {object} s Vega Lite specification
 * @param {HTMLElement} node DOM node
 * @param {object} [_panelDimensions] chart dimensions
 * @returns {object} chart dimensions
 */
const dimensions = (s, node, _panelDimensions) => {
	let result = { x: null, y: null }
	if (_panelDimensions) {
		result.x = _panelDimensions.x
		result.y = _panelDimensions.y
	} else {
		const marks = feature(s).isBar() ? markData(s)[0].length : 1
		if (s.width) {
			if (s.width === 'container') {
				result.x = node.getBoundingClientRect().width
			} else if (s.width.step) {
				result.x = s.width.step * marks
			} else if (typeof s.width === 'number') {
				result.x = s.width
			} else if (_panelDimensions.x) {
				result.x = _panelDimensions.x
			}
		}
		if (s.height) {
			if (s.height === 'container') {
				result.y = node.getBoundingClientRect().height
			} else if (s.height.step) {
				result.y = s.height.step * marks
			} else if (typeof s.height === 'number') {
				result.y = s.height
			} else if (_panelDimensions.y) {
				result.y = _panelDimensions.y
			}
		}
	}
	return result
}

export { dimensions }
