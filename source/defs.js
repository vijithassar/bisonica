import { feature } from './feature.js'
import { gradient } from './gradient.js'
import { noop } from './helpers.js'
import { memoize } from './memoize.js'

const _defs = s => {
	if (!feature(s).hasDefs()) {
		return noop
	}
	const renderer = selection => {
		if (selection.node().tagName !== 'svg') {
			throw new Error('defs must be rendered at the top level of the SVG node')
		}
		const defs = selection.append('defs')
		const fns = [gradient(s)]
		fns.forEach(fn => {
			defs.call(fn)
		})
	}
	return renderer
}
const defs = memoize(_defs)

export { defs }
