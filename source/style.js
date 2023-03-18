import { noop } from './helpers.js'

const styleMap = {
	titleColor: 'fill',
	titleFont: 'font-family',
	titleFontSize: 'font-size',
	titleFontStyle: 'font-style',
	titleFontWeight: 'font-weight',
	titleOpacity: 'opacity'
}

/**
 * convert a style from JSON to CSS syntax
 * @param {string} style JavaScript style instruction in camelCase
 * @returns {string} CSS style property in kebab-case
 */
const style = style => {
	if (styleMap[style]) {
		return styleMap[style]
	} else {
		throw new Error(`could not convert unknown style property ${style} to CSS equivalent`)
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
	if (!axis) {
		return noop
	}

	const key = 'title'

	return selection => {
		Object.keys(styleMap)
			.filter(js => js.startsWith(key))
			.forEach(js => {
				const value = axis[js]
				if (value !== undefined) {
					const css = style(js)
					selection.style(css, value)
				}
			})
	}
}

export { axisTitleStyles }
