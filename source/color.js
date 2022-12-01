import * as d3 from 'd3'

const defaultColor = 'steelblue'

/**
 * alternate luminance on a set of color objects
 * @param {object} color color
 * @returns {object} color
 */
const alternateLuminance = (color, index) => color[index % 2 ? 'brighter' : 'darker']()

/**
 * create a color palette from the available hue range
 * for use as a categorical scale
 * @param {number} count number of colors
 * @returns {array} color palette
 */
const colors = count => {
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

export { colors }
