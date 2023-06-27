/**
 * render CSS in the DOM
 * @module styles
 */

import { noop } from './helpers.js'

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

export { renderStyles }
