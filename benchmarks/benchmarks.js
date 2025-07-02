import bench from 'nanobench'
import { render } from '../tests/test-helpers.js'
import { charts, internals, dimensions } from '../tests/unit/support.js'

const count = 100

const time = fn => {
	const start = performance.now() // eslint-disable-line compat/compat
	fn()
	const end = performance.now() // eslint-disable-line compat/compat
	return end - start
}

const bar = time => {
	const step = 50 // milliseconds per unit
	const units = time / step
	const bar = Array.from({ length: units }).fill('■').join('')
	return bar
}

Object.entries(charts).forEach(([name, s]) => {
	bench(`${name} × ${count}`, b => {
		b.start()
		for (let i = 0; i < count; i++) {
			render(s)
		}
		b.log(bar(b.elapsed()))
		b.end()
	})
})

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
