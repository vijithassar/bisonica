/**
 * render gradients
 * @module gradients
 * @see {@link https://vega.github.io/vega-lite/docs/gradient.html|vega-lite:gradient}
 */

import { key, noop } from './helpers.js'

/**
 * assemble a string key for a gradient
 * @param {specification} s Vega Lite specification
 * @param {number} [index] gradient index
 * @return {string} gradient id
 */
const gradientKey = (s, index = 0) => {
	const n = index + 1
	return `${key(s.title.text)}-gradient-${n}`
}

/**
 * create a gradient
 * @param {specification} s Vega Lite specification
 * @return {function(object)} gradient definition rendering function
 */
const gradient = s => {
	if (!s.mark?.color?.gradient) {
		return noop
	}
	const renderer = selection => {
		if (selection.node().tagName !== 'defs') {
			throw new Error('gradients can only be rendered into a <defs> node')
		}
		const colors = [
			s.mark.color,
			s.layer?.map(item => item.mark.color)
		]
			.filter(Boolean)
			.filter(item => item.gradient)
		colors.forEach((color, index) => {
			const type = `${color.gradient}Gradient`
			const gradient = selection.append(type)
			gradient
				.attr('id', gradientKey(s, index))
				.attr('x1', color.x1)
				.attr('x2', color.x2)
				.attr('y1', color.y1)
				.attr('y2', color.y2)
			if (type === 'radialGradient') {
				gradient.attr('r1', color.r1)
				gradient.attr('r2', color.r2)
			}
			gradient
				.selectAll('stop')
				.data(color.stops)
				.enter()
				.append('stop')
				.attr('offset', d => d.offset)
				.attr('stop-color', d => d.color)
		})
	}
	return renderer
}

export { gradient, gradientKey }
