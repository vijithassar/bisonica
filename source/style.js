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
 * read styles from a JavaScript object and apply them as CSS properties
 * @param {object} styles key/value pairs of JavaScript and CSS properties
 * @param {object} source desired styles with JavaScript style keys
 */
const renderStyles = (styles, source) => {
	if (source === undefined || source === null) {
		return noop
	}
	return selection => {
		Object.entries(styles)
			.forEach(([js, css]) => {
				const value = source[js]
				if (value !== undefined) {
					selection.style(css, value)
				}
			})
	}
}

/**
 * render style instructions for an axis title
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {function(object)} title style rendering function
 */
const axisTitleStyles = (s, channel) => {
	const axis = s.encoding[channel].axis
	return renderStyles(titleStyles, axis)
}

/**
 * render style instructions for axis ticks
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {function(object)} tick style rendering function
 */
const axisTickStyles = (s, channel) => {
	const axis = s.encoding[channel].axis
	return renderStyles(tickStyles, axis)
}

export { renderStyles, axisTitleStyles, axisTickStyles }
