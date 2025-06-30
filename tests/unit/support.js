import { createAccessors } from '../../source/accessors.js'
import { parseScales } from '../../source/scales.js'
import { createEncoders } from '../../source/encodings.js'
import { data } from '../../source/data.js'
import { feature } from '../../source/feature.js'
import { marks } from '../../source/marks.js'
import { specificationFixture } from '../test-helpers.js'

const chartNames = [
	'categoricalBar',
	'circular',
	'dotPlot',
	'line',
	'multiline',
	'rules',
	'scatterPlot',
	'singleBar',
	'stackedArea',
	'temporalBar'
]

const fixtures = chartNames.map(name => [name, specificationFixture(name)])

const charts = Object.fromEntries(fixtures)

const internals = {
	createAccessors,
	parseScales,
	createEncoders,
	data,
	feature,
	marks
}

const timeFormat = () => null

const day = () => Math.floor(Math.random() * 10)
const groups = 5
const group = () => String.fromCharCode(Math.floor(Math.random() * groups + 97))

const datum = () => {
	const date = timeFormat(new Date(new Date().getFullYear(), 1, day()))

	return { label: date, value: Math.random(), group: group() }
}

const generateData = () => {
	return Array.from({ length: 100 }).map(datum)
}

const dimensions = { x: 100, y: 100 }

export { generateData as data, dimensions, groups, charts, internals }
