/**
 * render marks
 * @module marks
 * @see {@link https://vega.github.io/vega-lite/docs/mark.html|vega-lite:mark}
 */

import * as d3 from 'd3'

import { createAccessors } from './accessors.js'
import {
	createEncoders,
	encodingChannelCovariateCartesian,
	encodingChannelQuantitative,
	encodingType,
	encodingValue
} from './encodings.js'
import { data, pointData } from './data.js'
import { values } from './values.js'
import { markDescription } from './descriptions.js'
import { detach, datum, isDiscrete, kebabToCamel, key, mark, missingSeries } from './helpers.js'
import { feature } from './feature.js'
import { memoize } from './memoize.js'
import { parseScales } from './scales.js'
import { parseTime, timePeriod } from './time.js'
import { sortMarkData } from './sort.js'
import { tooltips } from './tooltips.js'
import { ticks } from './axes.js'

const transparent = 0.001

/**
 * aggregate and sort mark data
 * @param {object} s Vega Lite specification
 * @returns {object[]} aggregated and sorted data for data join
 */
const markData = s => {
	const series = Array.isArray(data(s)) && data(s).every(Array.isArray)

	if (series) {
		return data(s).map(item => item.sort(sortMarkData(s)))
	} else {
		return data(s).sort((a, b) => sortMarkData(s)(a, b))
	}
}

const category = {
	get(key) {
		return this.datum.get(key) || this.datum.get(d3.select(key).datum()) || this.node.get(key)
	},
	datum: new Map(),
	node: d3.local(),
	set(key, category) {
		const isNode = typeof key.querySelector === 'function'

		if (isNode) {
			this.datum.set(d3.select(key).datum(), category)
			this.node.set(key, category)
		} else {
			this.datum.set(key, category)
		}
	}
}

const stroke = 3
const defaultSize = 30

/**
 * partition dimensions into categorical steps
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {number} step size in pixels
 */
const _step = (s, dimensions) => {
	const channel = encodingChannelCovariateCartesian(s)

	const min = 2
	const max = dimensions[channel] / 3

	const stacked = markData(s)
	const type = encodingType(s, channel)
	const temporal = type === 'temporal'
	const customDomain = s.encoding[channel]?.scale?.domain

	let count

	if (customDomain && !temporal) {
		count = customDomain.length
	} else if (temporal) {
		let endpoints
		// this check is logically the same as parseScales()[channel].domain()
		// but writing it that way would be circular
		if (customDomain) {
			endpoints = customDomain?.map(parseTime)
		} else {
			endpoints = d3.extent(stacked.flat(), d => parseTime(d.data.key))
		}
		const periods = d3[timePeriod(s, channel)].count(endpoints[0], endpoints[1])
		count = periods
	} else {
		count = d3.max(stacked, d => d.length)
	}

	const dynamic = (dimensions[channel] / count) * 0.5

	if (dynamic > min && dynamic < max) {
		return dynamic
	} else if (dynamic < min) {
		return min
	} else if (dynamic > max) {
		return max
	}
}
const step = memoize(_step)
const barWidth = step

/**
 * retrieve the d3 curve factory function needed for the marks
 * in a specification
 * @param {object} s Vega Lite specification
 */
const curve = s => {
	const { interpolate } = s.mark
	if (interpolate === 'monotone') {
		return d3.curveMonotoneY
	} else if (interpolate) {
		return d3[kebabToCamel(`curve-${s.mark.interpolate}`)]
	} else {
		return null
	}
}

/**
 * point mark tagName
 * @param {object} s Vega Lite specification
 * @returns {'circle'|'rect'} point mark tag name
 */
const pointMarkSelector = s => {
	const defaultPointMark = 'circle'
	if (feature(s).isLine() || mark(s) === 'point') {
		return defaultPointMark
	} else if (mark(s) === 'square') {
		return 'rect'
	} else if (mark(s) === 'circle') {
		return 'circle'
	}
}

/**
 * mark tagName
 * @param {object} s Vega Lite specification
 * @returns {('rect'|'path'|'circle'|'rect'|'line'|'image'|'text')} tagName to use in DOM for mark
 */
const markSelector = s => {
	if (feature(s).isBar()) {
		return 'rect'
	} else if (feature(s).isLine() || feature(s).isCircular() || feature(s).isArea()) {
		return 'path'
	} else if (!feature(s).isLine() && feature(s).hasPoints()) {
		return pointMarkSelector(s)
	} else if (feature(s).isRule()) {
		return 'line'
	} else if (feature(s).isText()) {
		return 'text'
	} else if (feature(s).isImage()) {
		return 'image'
	}
}

/**
 * determine the selector string used for interactions
 * @param {object} _s Vega Lite specification
 * @returns {string} DOM selector string
 */
const markInteractionSelector = _s => {
	const s = !feature(_s).hasLayers() ? _s : _s.layer.find(layer => !feature(layer).isRule())

	if (feature(s).isLine()) {
		return `.marks ${pointMarkSelector(s)}.point.mark`
	} else {
		return `.marks ${markSelector(s)}`
	}
}

/**
 * determine which way marks are oriented
 * @param {object} s Vega Lite specification
 */
const layoutDirection = s => {
	if (encodingType(s, 'x') === 'quantitative') {
		return 'horizontal'
	} else if (encodingType(s, 'y') === 'quantitative') {
		return 'vertical'
	}
}

/**
 * shuffle around mark encoders to
 * facilitate bidirectional layout
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {object} bar encoder methods
 */
const stackEncoders = (s, dimensions) => {
	const encoders = createEncoders(s, dimensions, createAccessors(s))
	const vertical = layoutDirection(s) === 'vertical'
	const lane = encoders[encodingChannelCovariateCartesian(s)]
	const start = encoders.start
	const length = encoders.length
	const width = () => step(s, dimensions)

	return {
		x: vertical ? lane : start,
		y: vertical ? start : lane,
		height: vertical ? length : width,
		width: vertical ? width : length
	}
}

/**
 * render a single bar chart mark
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} single mark renderer
 */
const barMark = (s, dimensions) => {
	const encoders = stackEncoders(s, dimensions)

	const y = feature(s).hasEncodingY() ? encoders.y : 0
	const x = feature(s).hasEncodingX() ? encoders.x : 0
	const description = markDescription(s)
	const hasLink = encodingValue(s, 'href')
	const tooltipFn = tooltips(s)

	const markRenderer = selection => {
		const rect = selection.append(markSelector(s))

		rect
			.attr('role', 'region')
			.attr('aria-roledescription', 'data point')
			.attr('tabindex', -1)
			.attr('class', 'block mark')
			.attr('y', y)
			.attr('x', x)
			.attr('aria-label', description)
			.attr('height', encoders.height)
			.attr('width', encoders.width)
			.classed('link', hasLink)
			.call(tooltipFn)
	}

	return markRenderer
}

/**
 * lane transform for all bar marks
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {string} transform
 */
const barMarksTransform = (s, dimensions) => {
	let x = 0
	let y = 0

	if (encodingType(s, 'y') === 'quantitative') {
		if (feature(s).hasEncodingX()) {
			if (isDiscrete(s, 'x')) {
				x = barWidth(s, dimensions) * 0.5
			}
		}
	} else if (encodingType(s, 'x') === 'quantitative') {
		if (feature(s).hasEncodingY()) {
			if (isDiscrete(s, 'y')) {
				y = barWidth(s, dimensions) * 0.5
			}
		}
	}

	return `translate(${x},${y})`
}

/**
 * render bar chart marks
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} bar renderer
 */
const barMarks = (s, dimensions) => {
	const encoders = createEncoders(s, dimensions, createAccessors(s, 'series'))
	const renderer = selection => {
		const marks = selection
			.append('g')
			.attr('class', 'marks')
			.attr('transform', barMarksTransform(s, dimensions))

		const series = marks
			.selectAll('g')
			.data(markData(s))
			.enter()
			.append('g')
			.each(function(d) {
				category.set(this, d.key)
				d.forEach(item => {
					category.set(item, d.key)
				})
			})
			.attr('class', d => {
				return ['series', key(category.get(d))].join(' ')
			})
			.attr('role', 'region')
			.attr('aria-label', d => `${d.key}`)
			.style('fill', encoders.color)

		series.order()

		series
			.selectAll(markSelector(s))
			.data(d => d)
			.enter()
			.call(barMark(s, dimensions))
	}

	return renderer
}

/**
 * assign encoders to area mark methods
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {object} area encoders
 */
const areaEncoders = (s, dimensions) => {
	const { x, y, width, height } = stackEncoders(s, dimensions)
	let base = {
		y0: y,
		x0: x,
		x1: d => x(d) + width(d)
	}
	if (encodingChannelQuantitative(s) === 'x') {
		return {
			...base
		}
	} else if (encodingChannelQuantitative(s) === 'y') {
		return {
			x0: x,
			y0: y,
			y1: d => y(d) + height(d)
		}
	}
}

/**
 * render area marks
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} area mark renderer
 */
const areaMarks = (s, dimensions) => {
	const encoders = areaEncoders(s, dimensions)
	const { color } = createEncoders(s, dimensions, createAccessors(s, 'series'))
	const renderer = selection => {
		const marks = selection
			.append('g')
			.attr('class', 'marks')

		const area = d3.area();

		['x0', 'x1', 'y0', 'y1'].forEach(point => {
			area[point](encoders[point])
		})

		if (s.mark.interpolate) {
			area.curve(curve(s))
		}

		const layout = data(s)

		marks
			.selectAll(markSelector(s))
			.data(layout)
			.enter()
			.append('path')
			.attr('d', area)
			.attr('role', 'region')
			.attr('aria-roledescription', 'data series')
			.attr('tabindex', -1)
			.attr('fill', color)
			.attr('class', 'area mark')
			.attr('aria-label', d => d.key)
	}
	return renderer
}

/**
 * render a circular point mark
 * @param {object} s Vega Lite specification
 * @returns {function(object)} circular point mark rendering function
 */
const pointMarkCircle = (s, dimensions) => {
	const size = s.mark.size || defaultSize
	const encoders = createEncoders(s, dimensions, createAccessors(s))
	const radius = d => encoders.size ? encoders.size(d) : Math.sqrt(size / Math.PI)
	const renderer = selection => {
		selection
			.attr('cx', encoders.x)
			.attr('cy', encoders.y)
			.attr('r', radius)
	}
	return renderer
}

/**
 * render a square point mark
 * @param {object} s Vega Lite specification
 * @returns {function(object)} square point mark rendering function
 */
const pointMarkSquare = (s, dimensions) => {
	const size = s.mark.size || defaultSize
	const encoders = createEncoders(s, dimensions, createAccessors(s))
	const side = d => encoders.size ? encoders.size(d) : Math.sqrt(size)
	const offset = d => side(d) * 0.5 * -1
	const renderer = selection => {
		selection
			.attr('x', d => encoders.x(d) + offset(d))
			.attr('y', d => encoders.y(d) + offset(d))
			.attr('height', side)
			.attr('width', side)
	}
	return renderer
}

/**
 * render a single point mark
 * @param {object} s Vega Lite specification
 * @returns {function(object)} point rendering function
 */
const pointMark = (s, dimensions) => {
	const pointMarkRenderer = mark(s) === 'square' ? pointMarkSquare : pointMarkCircle
	const renderer = selection => {
		const point = selection
			.append(pointMarkSelector(s))
		point
			.classed('point', true)
			.classed('mark', true)
			.attr('role', 'region')
			.attr('aria-roledescription', 'data point')
			.each(function(d) {
				const categoryValue = encodingValue(s, 'color')(d)
				if (categoryValue) {
					category.set(this, categoryValue)
				}
			})
			.attr('aria-label', markDescription(s))
			.classed('link', encodingValue(s, 'href'))
			.call(pointMarkRenderer(s, dimensions))
			.call(tooltips(s))
		if (!feature(s).isLine()) {
			point.attr('aria-label', markDescription(s))
		}
	}
	return renderer
}

/**
 * render image marks
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} image mark renderer
 */
const imageMarks = (s, dimensions) => {
	const encoders = createEncoders(s, dimensions, createAccessors(s))
	const dx = (s.mark.width || 0) * 0.5 * -1
	const dy = (s.mark.height || 0) * 0.5 * -1
	const renderer = selection => {
		const marks = selection.append('g').attr('class', 'images')

		marks
			.selectAll(markSelector(s))
			.data(data(s))
			.enter()
			.append(markSelector(s))
			.attr('class', 'mark image')
			.attr('href', encoders.url)
			.attr('transform', d => {
				const x = encoders.x(d)
				const y = encoders.y(d)
				return `translate(${x + dx},${y + dy})`
			})
			.attr('aspect', s.mark.aspect)
			.attr('width', s.mark.width)
			.attr('height', s.mark.height)
	}

	return renderer
}

/**
 * render multiple point marks
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} points renderer
 */
const pointMarks = (s, dimensions) => {
	const encoders = createEncoders(s, dimensions, createAccessors(s))
	const renderer = selection => {
		const marks = selection.append('g').attr('class', () => {
			const classes = ['marks', 'points']

			if (feature(s).isLine()) {
				classes.push('mark-group')
			}

			return classes.join(' ')
		})

		const getPointData = feature(s).isLine() ? d => d.values : pointData(s)

		marks
			.selectAll(pointMarkSelector(s))
			.data(getPointData)
			.enter()
			.call(pointMark(s, dimensions))

		// style the point mark directly when they are standalone
		if (!feature(s).isLine()) {
			const { color } = parseScales(s)
			const points = marks.selectAll(pointMarkSelector(s))
			points
				.style('stroke', feature(s).isMulticolor() ? encoders.color : color)
				.style('stroke-width', 1)
			points
				.style('fill', feature(s).isMulticolor() ? encoders.color : color)
				.style('fill-opacity', feature(s).hasPointsFilled() ? 1 : transparent)
		// style the series node when point marks are on top of line marks
		} else {
			marks
				.style('stroke', encoders.color)
				.style('fill', feature(s).hasPointsFilled() ? encoders.color : null)
				.style('fill-opacity', feature(s).hasPointsFilled() ? 1 : transparent)
			if (s.mark.point === 'transparent') {
				marks
					.selectAll(pointMarkSelector(s))
					.style('stroke-opacity', transparent)
					.style('fill-opacity', transparent)
			}
		}
	}

	return renderer
}

/**
 * render line chart marks
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} line renderer
 */
const lineMarks = (s, dimensions) => {
	const encoders = createEncoders(s, dimensions, createAccessors(s))
	const line = d3.line().x(encoders.x).y(encoders.y)
	if (s.mark.interpolate) {
		line.curve(curve(s))
	}

	const renderer = selection => {
		const marks = selection.append('g').attr('class', 'marks')
		const markTransforms = ['x', 'y'].map(channel => {
			const offset = isDiscrete(s, channel) && ticks(s, channel) <= 2

			if (offset) {
				const scale = parseScales(s, dimensions)[channel]
				const difference = Math.abs(scale.range()[1] - scale.range()[0])

				return difference / scale.domain().length / 2
			}

			return 0
		})

		if (markTransforms.some(item => !!item)) {
			marks.attr('transform', `translate(${markTransforms.join(',')})`)
		}

		const series = marks
			.selectAll('g.series')
			.data(markData(s))
			.enter()
			.append('g')
			.classed('series', true)

		series.each(d => {
			const categoryValue = encodingValue(s, 'color')(d)
			category.set(d, categoryValue)
			d.values.forEach(item => {
				category.set(item, categoryValue)
			})
		})

		series.attr('fill', encoders.color)

		const path = series
			.append('g')
			.attr('class', 'mark-group line')
			.attr('aria-hidden', true)
			.append('path')
			.classed('mark', true)

		path
			.attr('d', d => line(d.values))
			.attr('aria-label', d => {
				const series = category.get(d)

				return typeof series === 'string' && series !== missingSeries() ? series : 'line'
			})
			.style('fill', 'none')
			.style('stroke', encoders.color)
			.style('stroke-width', stroke)

		if (s.mark.point) {
			series.call(pointMarks(s, dimensions))
		}
	}

	return renderer
}

/**
 * maximum viable radius for a given set of dimensions
 * @param {object} dimensions chart dimensions
 * @returns {number} radius
 */
const maxRadius = dimensions => Math.min(dimensions.x, dimensions.y) * 0.5

/**
 * render arc marks for a circular pie or donut chart
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} circular chart arc renderer
 */
const circularMarks = (s, dimensions) => {
	const encoders = createEncoders(s, dimensions, createAccessors(s))
	const { radius } = encoders
	const innerRadiusRatio = s.mark?.innerRadius ? s.mark.innerRadius / 100 : 0
	const { color } = parseScales(s)
	const outerRadius = d => {
		if (radius) {
			return radius(d)
		} else {
			return maxRadius(dimensions)
		}
	}
	const innerRadius = () => {
		if (radius) {
			return innerRadiusRatio * 100
		} else {
			return maxRadius(dimensions) * innerRadiusRatio
		}
	}
	const sort = (a, b) => color.domain().indexOf(a.group) - color.domain().indexOf(b.group)
	const value = d => d.value
	const layout = d3.pie().value(value).sort(sort)
	const renderer = selection => {
		const marks = selection.append('g').attr('class', 'marks')
		const mark = marks
			.selectAll('path')
			.data(layout(markData(s)))
			.enter()
			.append('path')
			.attr('role', 'region')
			.attr('aria-roledescription', 'data point')
			.each(function(d) {
				category.set(this, d.data.key)
			})
			.attr('class', 'mark arc')
		const arc = d3.arc().innerRadius(innerRadius).outerRadius(outerRadius)

		mark
			.attr('d', arc)
			.attr('aria-label', markDescription(s))
			.style('fill', encoders.color)
			.classed('link', d => {
				return encodingValue(s, 'href')(datum(s, d))
			})
			.call(tooltips(s))
	}

	return renderer
}

/**
 * determine orientation of rule marks
 * @param {object} s Vega Lite specification
 * @returns {('diagonal'|'horizontal'|'vertical')} rule orientation
 */
const ruleDirection = s => {
	if (s.encoding.x && s.encoding.x2 && s.encoding.y && s.encoding.y2) {
		return 'diagonal'
	}

	if (s.encoding.y && !s.encoding.x) {
		return 'horizontal'
	}

	if (s.encoding.x && !s.encoding.y) {
		return 'vertical'
	}

	if (s.encoding.x && s.encoding.y) {
		if (s.encoding.x2) {
			return 'horizontal'
		}

		if (s.encoding.y2) {
			return 'vertical'
		}
	}
}

/**
 * render rule marks
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} rule renderer
 */
const ruleMarks = (s, dimensions) => {
	const renderer = selection => {
		const marks = selection.append('g').attr('class', 'marks')
		const encoders = createEncoders(s, dimensions, createAccessors(s))

		const rule = {}

		rule.vertical = selection => {
			selection
				.attr('x1', encoders.x)
				.attr('x2', encoders.x)
				.attr('y1', encoders.y || 0)
				.attr('y2', encoders.y2 || dimensions.y)
		}

		rule.horizontal = selection => {
			selection
				.attr('x1', encoders.x || 0)
				.attr('x2', encoders.x2 || dimensions.x)
				.attr('y1', encoders.y)
				.attr('y2', encoders.y)
		}

		const mark = marks.selectAll('line').data(values(s)).enter().append('line')

		mark
			.call(rule[ruleDirection(s)])
			.each(function(d) {
				category.set(this, encodingValue(s, 'color')(d))
			})
			.style('stroke', encoders.color)
			.attr('class', 'mark rule')
			.attr('role', 'region')
			.attr('aria-roledescription', 'data point')
			.attr('aria-label', markDescription(s))
			.style('fill', encoders.color)
	}

	return renderer
}

/**
 * render text marks
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} text mark renderer
 */
const textMarks = (s, dimensions) => {
	const defaultFontSize = 11
	return selection => {
		const marks = selection.append('g').attr('class', 'marks')
		const encoders = createEncoders(s, dimensions, createAccessors(s))

		let text

		// data binding
		if (feature(s).hasData()) {
			text = marks.selectAll('text').data(markData(s)).enter().append('text').attr('class', 'mark')
		} else if (s.mark.text) {
			text = marks.append('text').classed('mark', true)
		}

		// default font size
		text.style('font-size', encoders.size ? encoders.size : defaultFontSize)

		// text content
		if (s.mark.text) {
			text.text(s.mark.text)
		} else {
			text.text(encoders.text)
		}

		// encoded attributes
		['x', 'y'].forEach(channel => {
			if (typeof encoders[channel] === 'function') {
				text.attr(channel, encoders[channel])
			}
		})

		// encoded attributes with aliases
		if (encoders.color) {
			text.attr('fill', encoders.color)
		}

		// static attributes
		['dx', 'dy'].forEach(attribute => {
			if (s.mark[attribute]) {
				text.attr(attribute, s.mark[attribute])
			}
		})

		// styles with aliases
		const styles = {
			// mark.fontSize will override mark.size since
			// it is probably a more specialized case
			size: 'font-size',
			fontSize: 'font-size',
			font: 'font-family',
			fontStyle: 'font-style',
			fontWeight: 'font-weight'
		}

		Object.entries(styles).forEach(([key, value]) => {
			if (s.mark[key]) {
				text.style(value, s.mark[key])
			}
		})

		text.attr('text-anchor', s.mark.align || 'middle')
		text.attr('alignment-baseline', s.mark.baseline || 'middle')

		const hasLink = !!(s.encoding && encodingValue(s, 'href'))
		text.classed('link', hasLink)
	}
}

/**
 * select an appropriate mark renderer
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function(object)} mark renderer
 */
const _marks = (s, dimensions) => {
	try {
		if (feature(s).isBar()) {
			return barMarks(s, dimensions)
		} else if (feature(s).isArea()) {
			return areaMarks(s, dimensions)
		} else if (feature(s).isCircular()) {
			return circularMarks(s, dimensions)
		} else if (feature(s).isLine()) {
			return lineMarks(s, dimensions)
		} else if (feature(s).isRule()) {
			return ruleMarks(s, dimensions)
		} else if (feature(s).hasPoints() && !feature(s).isLine()) {
			return pointMarks(s, dimensions)
		} else if (feature(s).isText()) {
			return textMarks(s, dimensions)
		} else if (feature(s).isImage()) {
			return imageMarks(s, dimensions)
		} else {
			throw new Error('could not determine mark rendering function')
		}
	} catch (error) {
		error.message = `could not render marks - ${error.message}`
		throw error
	}
}
const marks = (s, dimensions) => detach(_marks(s, dimensions))

export { marks, maxRadius, step, barWidth, layoutDirection, markData, markSelector, markInteractionSelector, category }
