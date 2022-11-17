import * as d3 from 'd3'
import { extension } from './extensions.js'

const defaultColor = 'steelblue'

/**
 * alternate luminance on a set of color objects
 * @param {object} color color
 * @returns {object} color
 */
const alternateLuminance = (color, index) => color[index % 2 ? 'brighter' : 'darker']()

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
 * @returns {string[]} color palette
 */
const accessibleColors = (count, variant) => {
	if (!stops[variant]) {
		throw new Error(`unknown color palette "${variant}"`)
	}
	const interpolator = d3.piecewise(d3.interpolateRgb.gamma(2.2), stops[variant])
	const step = 1 / count
	const values = Array.from({ length: count }).map((_, index) => {
		return interpolator(index * step)
	})
	return values
}

/**
 * create a standard color palette from the entire
 * available hue range for use as a categorical scale
 * @param {number} count number of colors
 * @returns {array} color palette
 */
const standardColors = count => {
	if (!count || count === 1) {
		return [defaultColor]
	}
	const hues = d3.range(count).map((item, index) => {
		const hue = 360 / count * index
		return hue
	})
	const swatch = hues
		.map(hue => d3.hcl(hue, 100, 50))
		.map(alternateLuminance)
		.map(item => item.toString())
	const midpoint = Math.floor(count * 0.5)
	const a = swatch.slice(0, midpoint)
	const b = swatch.slice(midpoint)
	const ordered = d3.zip(a, b).flat()
	return ordered
}

/**
 * generate a categorical color scale
 * @param {object} s Vega Lite specification
 * @param {number} count number of colors
 */
const colors = (s, count) => {
	const variant = extension(s, 'color')?.variant
	if (variant) {
		return accessibleColors(count, variant)
	} else {
		return standardColors(count)
	}
}

export { colors }
