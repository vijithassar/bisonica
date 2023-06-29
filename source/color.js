/**
 * generate color palettes
 * @module color
 * @see {@link module:scales}
 */

import * as d3 from 'd3'
import { extension } from './extensions.js'

const defaultColor = 'steelblue'

/**
 * alternate luminance on a set of color objects
 * @param {object} color color
 * @param {number} index position of the color in the palette
 * @param {number} k severity of luminance adjustment
 * @return {object} color
 */
const alternateLuminance = (color, index, k = 1) => color[index % 2 ? 'brighter' : 'darker'](k)

const stops = {
	deuteranopia: ['#e1daae', '#ff934f', '#cc2d35', '#058ed9', '#2d3142'],
	protanopia: ['#e8f086', '#6fde6e', '#ff4242', '#a691ae', '#235fa4'],
	tritanopia: ['#dd4444', '#f48080', '#ffdcdc', '#2d676f', '#194b4f']
}

/**
 * generate a palette of accessible colors for use
 * as a categorical scale
 * @param {number} count number of colors
 * @param {string} variant palette variant
 * @return {string[]} color palette
 */
const accessibleColors = (count, variant) => {
	if (!stops[variant]) {
		throw new Error(`unknown color palette "${variant}"`)
	}
	const interpolator = d3.piecewise(d3.interpolateRgb.gamma(2.2), stops[variant])
	const step = 1 / count
	const values = Array.from({ length: count }).map((_, index) => {
		return interpolator(index * step)
	}).map(item => {
		return d3.hsl(item)
	})

	let k
	if (variant === 'tritanopia') {
		k = 0.1
	} else {
		k = 0.5
	}
	return values.map((item, index) => alternateLuminance(item, index, k))
}

/**
 * create a standard color palette from the entire
 * available hue range for use as a categorical scale
 * @param {number} count number of colors
 * @return {string[]} color palette
 */
const standardColors = count => {
	if (!count || count === 1) {
		return [defaultColor]
	}
	const hues = d3.range(count).map((item, index) => {
		const hue = 360 / count * index
		return hue
	})
	const swatches = hues
		.map(hue => d3.hcl(hue, 100, 50))
		.map((color, index) => alternateLuminance(color, index))
		.map(item => item.toString())
	return swatches
}

/**
 * alternate colors
 * @param {string[]} colors color palette
 * @return {string[]} alternating color palette
 */
const alternate = colors => {
	if (colors.length === 1) {
		return colors
	}
	const count = colors.length
	const midpoint = Math.floor(count * 0.5)
	const a = colors.slice(0, midpoint)
	const b = colors.slice(midpoint)
	const ordered = d3.zip(a, b).flat()
	if (a.length < b.length) {
		ordered.push(b.pop())
	}
	return ordered
}

/**
 * look up an array of colors for a named color scheme
 * @param {number} _count number of colors
 * @param {string|object} config color scheme name or configuration object
 * @return {string[]} color scheme array
 */
const scheme = (_count, config) => {
	const object = typeof config === 'object'
	const name = object ? config.name : config
	const count = object ? config.count : _count
	const key = name.slice(0, 1).toUpperCase() + name.slice(1)
	const scheme = d3[`scheme${key}`] || d3[`interpolate${key}`]
	if (!scheme) {
		throw new Error(`unknown color scheme ${name}`)
	}
	const callable = typeof scheme === 'function'
	if (callable) {
		return Array.from({ length: count }).map((_, index) => scheme(1 / count * index))
	}
	const nested = Array.isArray([...scheme].pop())
	if (!nested) {
		return scheme.slice(0, count)
	} else {
		const index = d3.min([count, scheme.length])
		const palette = scheme[index]
		if (!palette) {
			throw new Error(`color scheme ${name} does not provide a range with swatch count ${count}`)
		}
		return palette
	}
}

/**
 * generate a categorical color scale
 * @param {object} s Vega Lite specification
 * @param {number} count number of colors
 */
const colors = (s, count) => {
	const variant = extension(s, 'color')?.variant
	if (variant) {
		return alternate(accessibleColors(count, variant))
	} else if (s.encoding.color?.scale?.scheme) {
		return scheme(count, s.encoding.color.scale.scheme)
	} else {
		return alternate(standardColors(count))
	}
}

export { colors }
