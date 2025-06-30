import bench from 'nanobench'
import { render } from '../tests/test-helpers.js'
import { charts } from '../tests/unit/support.js'

const count = 100

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
