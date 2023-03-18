import { noop } from './helpers.js'

const titleStyles = {
	titleColor: 'fill',
	titleFont: 'font-family',
	titleFontSize: 'font-size',
	titleFontStyle: 'font-style',
	titleFontWeight: 'font-weight',
	titleOpacity: 'opacity'
}

const tickStyles = {
	tickColor: 'fill',
	tickCap: 'stroke-linecap',
	tickOpacity: 'opacity'
}

/**
 * render style instructions for an axis title
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {function(object)} title style rendering function
 */
const axisTitleStyles = (s, channel) => {
	const axis = s.encoding[channel].axis
	if (axis === undefined || axis === null) {
		return noop
	}

	return selection => {
		Object.entries(titleStyles)
			.forEach(([js, css]) => {
				const value = axis[js]
				if (value !== undefined) {
					selection.style(css, value)
				}
			})
	}
}

/**
 * render style instructions for axis ticks
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {function(object)} tick style rendering function
 */
const axisTickStyles = (s, channel) => {
	const axis = s.encoding[channel].axis
	if (axis === undefined || axis === null) {
		return noop
	}

	return selection => {
		Object.entries(tickStyles)
			.forEach(([js, css]) => {
				const value = axis[js]
				if (value !== undefined) {
					selection.style(css, value)
				}
			})
	}
}

export { axisTitleStyles, axisTickStyles }
