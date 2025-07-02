import bench from 'nanobench'
import { charts, internals, dimensions } from '../tests/unit/support.js'

const time = fn => {
	const start = performance.now() // eslint-disable-line compat/compat
	fn()
	const end = performance.now() // eslint-disable-line compat/compat
	return end - start
}

const pairs = Object.entries(charts).map(([chart]) => {
	return Object.entries(internals).map(([internal]) => [chart, internal])
})
	.flat()
	.filter(item => item[1] !== 'createEncoders')

const timed = pairs.map(([chart, internal]) => {
	return { chart, internal, time: time(() => internals[internal](charts[chart], dimensions)) }
})

const round = number => Math.round(number * 100) / 100

const table = {}
timed.forEach(({ chart, internal, time }) => {
	table[chart] = table[chart] || {}
	table[chart][internal] = round(time)
})

console.table(table) // eslint-disable-line no-console
